import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../infrastructure/jwt-auth.guard';
import {
  assertNoDuplicateUser,
  normalizeEmail,
  normalizePhone,
} from '../../application/identity-validator.util';

@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Public: Get active subjects list for the application dropdowns
   */
  @Get('subjects-list')
  async getSubjectsList() {
    return this.prisma.subject.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        code: true,
        curriculumType: true,
      },
      orderBy: { nameAr: 'asc' },
    });
  }

  /**
   * 2. Public: Submit new volunteer teacher application (Form 2)
   */
  @Post('apply')
  async submitVolunteerApplication(@Body() body: any) {
    if (!body.email || !body.phone) {
      throw new BadRequestException('البريد الإلكتروني ورقم الواتساب مطلوبان لإرسال الاستمارة');
    }

    const email = normalizeEmail(body.email);
    const { normalized: phone } = normalizePhone(body.phone);

    const fullNameAr = body.fullNameAr?.trim() || '';
    const fullNameEn = body.fullNameEn?.trim() || '';

    if (!fullNameAr && !fullNameEn) {
      throw new BadRequestException('يُرجى إدخال الاسم الكامل بالعربية أو باللاتينية');
    }

    // Check if an application with same email already exists
    const existingApp = await this.prisma.volunteerApplication.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    const subjects = Array.isArray(body.subjects) ? body.subjects : (body.subjects ? [body.subjects] : []);

    let appRecord;
    if (existingApp) {
      // Update existing application
      appRecord = await this.prisma.volunteerApplication.update({
        where: { id: existingApp.id },
        data: {
          fullNameAr: fullNameAr || existingApp.fullNameAr,
          fullNameEn: fullNameEn || existingApp.fullNameEn,
          age: body.age ? parseInt(body.age, 10) : existingApp.age,
          gender: body.gender || existingApp.gender,
          telegramId: body.telegramId || existingApp.telegramId,
          nationality: body.nationality || existingApp.nationality,
          teachingField: body.teachingField || 'high_school',
          specialty: body.specialty || existingApp.specialty,
          university: body.university || existingApp.university,
          graduationYear: body.graduationYear || existingApp.graduationYear,
          hasExperience: body.hasExperience !== undefined ? Boolean(body.hasExperience) : existingApp.hasExperience,
          experienceYears: body.experienceYears || existingApp.experienceYears,
          experienceDetails: body.experienceDetails || existingApp.experienceDetails,
          subjects: subjects.length > 0 ? subjects : existingApp.subjects,
          otherSubjects: body.otherSubjects || existingApp.otherSubjects,
          preferredPlatform: body.preferredPlatform || existingApp.preferredPlatform,
          sessionsPerWeek: body.sessionsPerWeek || existingApp.sessionsPerWeek,
          availableTimes: Array.isArray(body.availableTimes) ? body.availableTimes : existingApp.availableTimes,
          availableDays: Array.isArray(body.availableDays) ? body.availableDays : existingApp.availableDays,
          preferredLanguage: body.preferredLanguage || existingApp.preferredLanguage,
          deviceType: Array.isArray(body.deviceType) ? body.deviceType : existingApp.deviceType,
          internetReliability: body.internetReliability || existingApp.internetReliability,
          motivation: body.motivation || existingApp.motivation,
          discoveryChannel: body.discoveryChannel || existingApp.discoveryChannel,
          additionalNotes: body.additionalNotes || existingApp.additionalNotes,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new application
      appRecord = await this.prisma.volunteerApplication.create({
        data: {
          isExistingBaaqoonTeacher: false,
          fullNameAr,
          fullNameEn,
          age: body.age ? parseInt(body.age, 10) : null,
          gender: body.gender || null,
          email,
          phone,
          telegramId: body.telegramId || null,
          nationality: body.nationality || 'الجزائر',
          teachingField: body.teachingField || 'high_school',
          specialty: body.specialty || null,
          university: body.university || null,
          graduationYear: body.graduationYear || null,
          hasExperience: body.hasExperience !== undefined ? Boolean(body.hasExperience) : true,
          experienceYears: body.experienceYears || null,
          experienceDetails: body.experienceDetails || null,
          subjects,
          otherSubjects: body.otherSubjects || null,
          preferredPlatform: body.preferredPlatform || null,
          sessionsPerWeek: body.sessionsPerWeek || null,
          availableTimes: Array.isArray(body.availableTimes) ? body.availableTimes : [],
          availableDays: Array.isArray(body.availableDays) ? body.availableDays : [],
          preferredLanguage: body.preferredLanguage || null,
          deviceType: Array.isArray(body.deviceType) ? body.deviceType : [],
          internetReliability: body.internetReliability || null,
          motivation: body.motivation || null,
          discoveryChannel: body.discoveryChannel || null,
          additionalNotes: body.additionalNotes || null,
          status: 'pending',
        },
      });
    }

    // Send high-priority notification to admins & relevant subject supervisors
    try {
      const subjectKeywords = subjects.map((s: string) => s.trim().toLowerCase());
      const relevantSupervisors = await this.prisma.user.findMany({
        where: {
          OR: [
            { primaryRole: { in: ['admin', 'super_admin'] as any } },
            {
              primaryRole: { in: ['subject_supervisor', 'supervisor'] as any },
              supervisedSubject: {
                nameAr: { in: subjects },
              },
            },
          ],
          status: 'active',
        },
        select: { id: true },
      });

      const teacherName = fullNameAr || fullNameEn;
      const subjectsStr = subjects.join('، ') || 'عام';
      for (const sup of relevantSupervisors) {
        await this.prisma.notification.create({
          data: {
            userId: sup.id,
            title: `متطوع تدريس جديد: أ. ${teacherName}`,
            body: `تقدم الأستاذ(ة) «${teacherName}» بطلب تطوع لتدريس (${subjectsStr}) لطلبة غزة. يرجى مراجعة الاستمارة وفرزها.`,
            type: 'academic_update' as any,
            actionUrl: '/admin/volunteers',
          },
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send volunteer notification:', notifErr);
    }

    return {
      success: true,
      message: 'تم استلام استمارة التطوع بنجاح! شكراً لمبادرتك النبيلة في دعم طلبة غزة.',
      applicationId: appRecord.id,
      telegramChannelUrl: 'https://t.me/+TeachersForGaza',
      whatsappGroupUrl: 'https://chat.whatsapp.com/TeachersForGaza',
    };
  }

  /**
   * 3. Public: Fast onboarding for CURRENT Baaqoon teachers
   * Teachers who are ALREADY teaching in Baaqoon don't fill out the full form.
   */
  @Post('existing-teacher-onboard')
  async onboardExistingTeacher(@Body() body: any) {
    const {
      firstNameAr,
      lastNameAr,
      firstNameEn,
      lastNameEn,
      email,
      phone,
      password,
      teachingSubjects,
      currentCohortsDetails,
      notes,
    } = body;

    if (!email || !phone || !password) {
      throw new BadRequestException('البريد الإلكتروني ورقم الواتساب وكلمة المرور مطلوبة');
    }

    // 1. Assert no duplicate user in users table
    const cleaned = await assertNoDuplicateUser(
      this.prisma,
      {
        email,
        phone,
        firstNameAr,
        lastNameAr,
        firstNameEn,
        lastNameEn,
        primaryRole: 'teacher',
      },
    );

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const subjectsArr = Array.isArray(teachingSubjects)
      ? teachingSubjects
      : teachingSubjects
      ? [teachingSubjects]
      : [];

    // 3. Create the Teacher user account directly
    const user = await this.prisma.user.create({
      data: {
        email: cleaned.normalizedEmail,
        phone: cleaned.normalizedPhone,
        firstName: cleaned.cleanFirstNameAr || cleaned.cleanFirstNameEn || cleaned.cleanFirstName || 'أستاذ',
        lastName: cleaned.cleanLastNameAr || cleaned.cleanLastNameEn || cleaned.cleanLastName || 'باقون',
        firstNameAr: cleaned.cleanFirstNameAr,
        lastNameAr: cleaned.cleanLastNameAr,
        firstNameEn: cleaned.cleanFirstNameEn,
        lastNameEn: cleaned.cleanLastNameEn,
        passwordHash,
        primaryRole: 'teacher' as any,
        status: 'active' as any,
        mustChangePassword: false,
        nationality: body.nationality || 'الجزائر',
      },
    });

    // 4. Create UserRoleAssignment
    try {
      await this.prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: 'teacher' as any,
        },
      });
    } catch (_) {}

    // 5. Also log a record in volunteer_applications flagged as isExistingBaaqoonTeacher
    await this.prisma.volunteerApplication.create({
      data: {
        isExistingBaaqoonTeacher: true,
        fullNameAr: `${cleaned.cleanFirstNameAr || ''} ${cleaned.cleanLastNameAr || ''}`.trim() || null,
        fullNameEn: `${cleaned.cleanFirstNameEn || ''} ${cleaned.cleanLastNameEn || ''}`.trim() || null,
        email: cleaned.normalizedEmail,
        phone: cleaned.normalizedPhone,
        subjects: subjectsArr,
        additionalNotes: `معلم حالي يدرس في باقون. تفاصيل الأفواج: ${currentCohortsDetails || 'لم تُحدد'}. ${notes || ''}`,
        status: 'approved',
        convertedUserId: user.id,
        reviewedAt: new Date(),
      },
    });

    // 6. Notify Admins and Supervisors
    try {
      const adminsAndSups = await this.prisma.user.findMany({
        where: {
          OR: [
            { primaryRole: { in: ['admin', 'super_admin'] as any } },
            {
              primaryRole: { in: ['subject_supervisor', 'supervisor'] as any },
              supervisedSubject: {
                nameAr: { in: subjectsArr },
              },
            },
          ],
          status: 'active',
        },
        select: { id: true },
      });

      const teacherDisplayName = `${cleaned.cleanFirstNameAr || ''} ${cleaned.cleanLastNameAr || ''}`.trim() || cleaned.normalizedEmail;
      const subStr = subjectsArr.join('، ') || 'معلم حالي';

      for (const recipient of adminsAndSups) {
        await this.prisma.notification.create({
          data: {
            userId: recipient.id,
            title: `معلم حالي فعّل حسابه: أ. ${teacherDisplayName}`,
            body: `قام الأستاذ «${teacherDisplayName}» (المواد: ${subStr}) بتفعيل حسابه الرسمي على المنصة. يمكن الآن إسناد وتدقيق أفواجه الميدانية مباشرة.`,
            type: 'academic_update' as any,
            actionUrl: '/supervisor/cohorts',
          },
        });
      }
    } catch (_) {}

    const { passwordHash: _, ...safeUser } = user;
    return {
      success: true,
      message: 'تم تفعيل حسابك كمعلم في منصة باقون بنجاح! يمكنك الآن تسجيل الدخول مباشرة.',
      user: safeUser,
    };
  }

  /**
   * 4. Protected: List applications (Admin sees ALL, Supervisor sees ONLY their subject)
   */
  @Get('applications')
  @UseGuards(JwtAuthGuard)
  async listApplications(@Req() req: any, @Query() query: any) {
    const user = req.user;
    const role = user.primaryRole;
    const isSuperOrAdmin = ['super_admin', 'admin'].includes(role);
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(role);

    if (!isSuperOrAdmin && !isSupervisor) {
      throw new UnauthorizedException('غير مصرح لك بالاطلاع على استمارات المعلمين');
    }

    let subjectFilter: string[] | null = null;

    if (isSupervisor && !isSuperOrAdmin) {
      // Find the supervisor's assigned subject
      const supervisorUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { supervisedSubject: true },
      });

      if (!supervisorUser?.supervisedSubject) {
        // If supervisor has no subject assigned yet, return empty list
        return { applications: [], totalCount: 0, supervisedSubjectName: null };
      }

      subjectFilter = [supervisorUser.supervisedSubject.nameAr];
    }

    // Build Prisma where clause
    const where: any = {};

    // Filter by query subject if admin specified, or supervisor subject
    if (query.subject && query.subject !== 'all') {
      where.subjects = { has: query.subject };
    } else if (subjectFilter && subjectFilter.length > 0) {
      where.subjects = { hasSome: subjectFilter };
    }

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.isExisting === 'true') {
      where.isExistingBaaqoonTeacher = true;
    } else if (query.isExisting === 'false') {
      where.isExistingBaaqoonTeacher = false;
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { fullNameAr: { contains: q, mode: 'insensitive' } },
        { fullNameEn: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { specialty: { contains: q, mode: 'insensitive' } },
        { university: { contains: q, mode: 'insensitive' } },
      ];
    }

    const applications = await this.prisma.volunteerApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedSubject: {
          select: {
            id: true,
            nameAr: true,
            code: true,
          },
        },
        convertedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        supervisorReviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      applications,
      totalCount: applications.length,
      scope: isSuperOrAdmin ? 'all' : 'subject_scoped',
      supervisedSubjectName: subjectFilter ? subjectFilter[0] : null,
    };
  }

  /**
   * 5. Protected (Supervisor Review): Supervisor approves/recommends or rejects with justification
   */
  @Patch('applications/:id/supervisor-review')
  @UseGuards(JwtAuthGuard)
  async supervisorReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; supervisorNotes?: string; rejectionReason?: string },
  ) {
    const user = req.user;
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);
    const isAdmin = ['super_admin', 'admin'].includes(user.primaryRole);

    if (!isSupervisor && !isAdmin) {
      throw new UnauthorizedException('دراسة ملفات المعلمين متاحة للمشرف الأكاديمي أو إدارة المنصة فقط');
    }

    if (!body.decision || !['approved', 'rejected'].includes(body.decision)) {
      throw new BadRequestException('يجب تحديد قرار المشرف (قبول وترشيح أو اعتذار ورفض)');
    }

    if (body.decision === 'rejected' && (!body.rejectionReason || !body.rejectionReason.trim())) {
      throw new BadRequestException('⛔ تنبيه إلزامي: كتابة مبرر الرفض إجبارية للمشرف لتوثيق أسباب عدم ملاءمة الملف.');
    }

    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException('الاستمارة غير موجودة');
    }

    const newStatus = body.decision === 'approved' ? 'supervisor_approved' : 'supervisor_rejected';

    const updated = await this.prisma.volunteerApplication.update({
      where: { id },
      data: {
        status: newStatus,
        supervisorReviewedById: user.id,
        supervisorReviewedAt: new Date(),
        supervisorDecision: body.decision,
        supervisorNotes: body.supervisorNotes?.trim() || null,
        supervisorRejectionReason: body.decision === 'rejected' ? body.rejectionReason?.trim() : null,
        updatedAt: new Date(),
      },
      include: {
        supervisorReviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Notify all Admins about the supervisor's review
    try {
      const admins = await this.prisma.user.findMany({
        where: { primaryRole: { in: ['admin', 'super_admin'] as any }, status: 'active' },
        select: { id: true },
      });

      const applicantName = application.fullNameAr || application.fullNameEn || application.email;
      const supervisorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'المشرف الأكاديمي';
      const decisionArabic = body.decision === 'approved' ? '✅ توصية بالقبول' : '❌ اعتذار ورفض بمبرر';

      for (const admin of admins) {
        await this.prisma.notification.create({
          data: {
            userId: admin.id,
            title: `دراسة ملف معلم: ${decisionArabic} من المشرف ${supervisorName}`,
            body: `أتم أ. ${supervisorName} دراسة ملف المتطوع «${applicantName}» (${application.subjects?.join('، ')}). القرار: ${decisionArabic}. بانتظار التأكيد والاعتماد النهائي منك.`,
            type: 'academic_update' as any,
            actionUrl: '/admin/volunteers',
          },
        });
      }
    } catch (_) {}

    return {
      success: true,
      message: body.decision === 'approved' 
        ? 'تم تسجيل توصية القبول بنجاح، والملف بانتظار التأكيد النهائي من مدير المنصة.'
        : 'تم تسجيل رفض المشرف مع المبرر بنجاح، ورفع التقرير لإدارة المنصة.',
      application: updated,
    };
  }

  /**
   * 6. Protected (Admin Final Decision & Activation): Admin confirms & activates or final-rejects
   */
  @Post('applications/:id/admin-confirm')
  @UseGuards(JwtAuthGuard)
  async adminConfirm(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { 
      action: 'activate' | 'reject'; 
      assignedSubjectId?: string; 
      adminNotes?: string; 
      customPassword?: string;
    },
  ) {
    const adminUser = req.user;
    if (!['super_admin', 'admin'].includes(adminUser.primaryRole)) {
      throw new UnauthorizedException('التأكيد النهائي وتفعيل حسابات المعلمين متاح لمدير المنصة فقط');
    }

    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException('الاستمارة غير موجودة');
    }

    if (body.action === 'reject') {
      const updated = await this.prisma.volunteerApplication.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedById: adminUser.id,
          reviewedAt: new Date(),
          internalNotes: body.adminNotes || application.internalNotes,
        },
      });
      return { success: true, message: 'تم تسجيل الرفض النهائي للطلب', application: updated };
    }

    // Action: 'activate'
    if (application.convertedUserId) {
      throw new BadRequestException('هذا المعلم تم تفعيل حسابه بالفعل مسبقاً');
    }

    // Check if user already exists with this email or phone
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: application.email }, { phone: application.phone }],
      },
    });

    // Resolve subject to assign
    let subjectIdToAssign = body.assignedSubjectId || application.assignedSubjectId;
    if (!subjectIdToAssign && application.subjects && application.subjects.length > 0) {
      const matchedSubject = await this.prisma.subject.findFirst({
        where: {
          OR: [
            { nameAr: { in: application.subjects } },
            { nameEn: { in: application.subjects } },
          ],
        },
      });
      if (matchedSubject) {
        subjectIdToAssign = matchedSubject.id;
      }
    }

    if (existingUser) {
      // User already exists: ensure teacher role is granted and subject is assigned
      if (existingUser.primaryRole !== 'teacher' && existingUser.primaryRole !== 'admin' && existingUser.primaryRole !== 'super_admin') {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            primaryRole: 'teacher' as any,
            supervisedSubjectId: subjectIdToAssign || existingUser.supervisedSubjectId,
          },
        });
      } else if (subjectIdToAssign && !existingUser.supervisedSubjectId) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { supervisedSubjectId: subjectIdToAssign },
        });
      }

      try {
        await this.prisma.userRoleAssignment.upsert({
          where: { userId_role: { userId: existingUser.id, role: 'teacher' as any } },
          update: {},
          create: { userId: existingUser.id, role: 'teacher' as any },
        });
      } catch (_) {}

      await this.prisma.volunteerApplication.update({
        where: { id },
        data: {
          convertedUserId: existingUser.id,
          assignedSubjectId: subjectIdToAssign,
          status: 'approved',
          reviewedById: adminUser.id,
          reviewedAt: new Date(),
          internalNotes: body.adminNotes || application.internalNotes,
        },
      });

      return {
        success: true,
        message: 'تم ربط الاستمارة بالحساب وتأكيد اعتماده كمعلم رسمي بنجاح!',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          phone: existingUser.phone,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
        },
      };
    }

    // Create new Teacher user
    const initialPassword = body.customPassword || `Baaqoon@${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(initialPassword, 12);

    const namePartsAr = (application.fullNameAr || '').trim().split(/\s+/);
    const firstNameAr = namePartsAr[0] || 'أستاذ';
    const lastNameAr = namePartsAr.slice(1).join(' ') || 'متطوع';

    const namePartsEn = (application.fullNameEn || '').trim().split(/\s+/);
    const firstNameEn = namePartsEn[0] || '';
    const lastNameEn = namePartsEn.slice(1).join(' ') || '';

    const newUser = await this.prisma.user.create({
      data: {
        email: application.email,
        phone: application.phone,
        firstName: firstNameAr,
        lastName: lastNameAr,
        firstNameAr,
        lastNameAr,
        firstNameEn: firstNameEn || null,
        lastNameEn: lastNameEn || null,
        passwordHash,
        primaryRole: 'teacher' as any,
        status: 'active' as any,
        mustChangePassword: true,
        nationality: application.nationality || 'الجزائر',
        supervisedSubjectId: subjectIdToAssign || null,
      },
    });

    try {
      await this.prisma.userRoleAssignment.create({
        data: {
          userId: newUser.id,
          role: 'teacher' as any,
        },
      });
    } catch (_) {}

    await this.prisma.volunteerApplication.update({
      where: { id },
      data: {
        convertedUserId: newUser.id,
        assignedSubjectId: subjectIdToAssign,
        status: 'approved',
        reviewedById: adminUser.id,
        reviewedAt: new Date(),
        internalNotes: body.adminNotes || application.internalNotes,
      },
    });

    // Notify the supervisor who reviewed the application
    if (application.supervisorReviewedById) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: application.supervisorReviewedById,
            title: `تم الاعتماد النهائي: أ. ${application.fullNameAr || application.fullNameEn}`,
            body: `اعتمد مدير المنصة توصيتكم وتم إنشاء حساب الأستاذ رسميًا في مادتكم.`,
            type: 'academic_update' as any,
            actionUrl: '/supervisor/teachers',
          },
        });
      } catch (_) {}
    }

    const { passwordHash: _, ...safeUser } = newUser;

    return {
      success: true,
      message: `تم اعتماد وتفعيل حساب المعلم بنجاح! كلمة المرور المبدئية: ${initialPassword}`,
      user: safeUser,
      initialPassword,
    };
  }

  /**
   * 7. Protected (Admin only): Convert volunteer application to official Teacher account (alias)
   */
  @Post('applications/:id/convert-to-teacher')
  @UseGuards(JwtAuthGuard)
  async convertToTeacherAccount(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { customPassword?: string; assignedSubjectId?: string; adminNotes?: string },
  ) {
    return this.adminConfirm(req, id, {
      action: 'activate',
      customPassword: body.customPassword,
      assignedSubjectId: body.assignedSubjectId,
      adminNotes: body.adminNotes,
    });
  }

  /**
   * 8. Protected: Legacy status update
   */
  @Patch('applications/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateApplicationStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; internalNotes?: string },
  ) {
    const user = req.user;
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException('الاستمارة غير موجودة');
    }

    const updated = await this.prisma.volunteerApplication.update({
      where: { id },
      data: {
        status: body.status,
        internalNotes: body.internalNotes !== undefined ? body.internalNotes : application.internalNotes,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });

    return { success: true, application: updated };
  }
}
