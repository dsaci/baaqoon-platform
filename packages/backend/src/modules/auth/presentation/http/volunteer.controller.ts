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
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../infrastructure/jwt-auth.guard';
import {
  assertNoDuplicateUser,
  normalizeEmail,
  normalizePhone,
} from '../../application/identity-validator.util';
import { evaluateTeacherDossier } from '../../application/volunteer-dossier-evaluator.util';
import { EmailService } from '../../../email/email.service';

// Canonical keyword signatures for Palestinian curriculum subjects
const SUBJECT_KEYWORDS = [
  { keywords: ['رياضيات', 'رياضيه', 'math', 'calculus'], codePrefix: 'MATH' },
  { keywords: ['فيزياء', 'physics'], codePrefix: 'PHYSICS' },
  { keywords: ['كيمياء', 'chemistry'], codePrefix: 'CHEMISTRY' },
  { keywords: ['احياء', 'حياتيه', 'biology'], codePrefix: 'BIOLOGY' },
  { keywords: ['انجليزي', 'انجليزيه', 'english'], codePrefix: 'ENGLISH' },
  { keywords: ['عربي', 'عربيه', 'مطالعه', 'نصوص', 'ادب', 'arabic'], codePrefix: 'ARABIC' },
  { keywords: ['اسلامي', 'اسلاميه', 'شريعه', 'قران', 'دين', 'islamic'], codePrefix: 'ISLAMIC' },
  { keywords: ['تاريخ', 'history'], codePrefix: 'HISTORY' },
  { keywords: ['جغرافيا', 'جغرافي', 'geography'], codePrefix: 'GEOGRAPHY' },
  { keywords: ['تكنولوجيا', 'برمجه', 'حاسوب', 'it', 'technology', 'tech'], codePrefix: 'IT' },
  { keywords: ['ثقافه علميه', 'علوم عامه', 'sciences', 'science'], codePrefix: 'THAQAFEH' },
];

function normalizeSubjectSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function resolveSubjectIds(
  prisma: PrismaService,
  subjects: string[],
): Promise<{ primaryId: string | null; allIds: string[] }> {
  if (!subjects || subjects.length === 0) return { primaryId: null, allIds: [] };

  const allDbSubjects = await prisma.subject.findMany({
    where: { isActive: true },
    select: { id: true, nameAr: true, nameEn: true, code: true },
  });

  const matchedIds: string[] = [];

  for (const raw of subjects) {
    if (!raw) continue;
    const cleanRaw = raw.trim();
    const normRaw = normalizeSubjectSearchText(cleanRaw);

    // 1. Direct UUID match
    const byId = allDbSubjects.find(s => s.id === cleanRaw);
    if (byId && !matchedIds.includes(byId.id)) {
      matchedIds.push(byId.id);
      continue;
    }

    // 2. Direct code match
    const byCode = allDbSubjects.find(s => s.code.toLowerCase() === cleanRaw.toLowerCase());
    if (byCode && !matchedIds.includes(byCode.id)) {
      matchedIds.push(byCode.id);
      continue;
    }

    // 3. Exact normalized match
    const byExact = allDbSubjects.find(s => {
      const normAr = normalizeSubjectSearchText(s.nameAr);
      const normEn = normalizeSubjectSearchText(s.nameEn || '');
      return normRaw === normAr || (normEn && normRaw === normEn);
    });
    if (byExact && !matchedIds.includes(byExact.id)) {
      matchedIds.push(byExact.id);
      continue;
    }

    // 4. Canonical keyword signatures (highest precision for subject domains)
    let foundBySignature = false;
    for (const sig of SUBJECT_KEYWORDS) {
      const matchesSignature = sig.keywords.some(kw => normRaw.includes(kw));
      if (matchesSignature) {
        const dbSub = allDbSubjects.find(s => s.code.includes(sig.codePrefix));
        if (dbSub && !matchedIds.includes(dbSub.id)) {
          matchedIds.push(dbSub.id);
          foundBySignature = true;
          break;
        }
      }
    }
    if (foundBySignature) continue;

    // 5. Whole phrase inclusion (without generic false positives)
    const byInclusion = allDbSubjects.find(s => {
      const normAr = normalizeSubjectSearchText(s.nameAr);
      const normEn = normalizeSubjectSearchText(s.nameEn || '');
      if (normAr && (normRaw.includes(normAr) || normAr.includes(normRaw))) return true;
      if (normEn && (normRaw.includes(normEn) || normEn.includes(normRaw))) return true;
      return false;
    });

    if (byInclusion && !matchedIds.includes(byInclusion.id)) {
      matchedIds.push(byInclusion.id);
    }
  }

  return { primaryId: matchedIds[0] || null, allIds: matchedIds };
}

@Controller('volunteer')
export class VolunteerController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

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
   * 1.1 Public: Get volunteer application status by email or phone
   */
  @Get('application-status')
  async getApplicationStatus(@Query('identifier') rawIdentifier?: string) {
    if (!rawIdentifier || !rawIdentifier.trim()) {
      throw new BadRequestException('يُرجى إدخال البريد الإلكتروني أو رقم الهاتف للاستعلام');
    }

    const clean = rawIdentifier.trim();
    const cleanMail = clean.toLowerCase();
    const digitsOnly = clean.replace(/[^0-9]/g, '');

    // Look for the latest volunteer application
    const applications = await this.prisma.volunteerApplication.findMany({
      where: {
        OR: [
          { email: { equals: cleanMail, mode: 'insensitive' } },
          { phone: clean },
          ...(digitsOnly.length >= 6 ? [{ phone: { contains: digitsOnly.slice(-8) } }] : []),
        ],
      },
      include: {
        assignedSubject: {
          select: { id: true, nameAr: true, nameEn: true, code: true, iconUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const application = applications[0];

    if (!application) {
      return {
        found: false,
        message: 'لم يتم العثور على أي استمارة تطوع مسجلة بهذا البريد أو رقم الهاتف. يُرجى التحقق من المدخلات أو تقديم طلب جديد.',
      };
    }

    // Check if user account already exists and is activated
    let isCompleted = false;
    let existingUser = null;
    if (application.convertedUserId) {
      existingUser = await this.prisma.user.findUnique({
        where: { id: application.convertedUserId },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true, mustChangePassword: true, status: true, nationality: true },
      });
      if (existingUser && !existingUser.mustChangePassword && existingUser.status === 'active') {
        isCompleted = true;
      }
    } else {
      existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: application.email }, { phone: application.phone }],
        },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true, mustChangePassword: true, status: true, nationality: true },
      });
      if (existingUser && !existingUser.mustChangePassword && existingUser.status === 'active') {
        isCompleted = true;
      }
    }

    let statusDisplay = application.status;
    let message = '';

    if (application.status === 'approved') {
      message = isCompleted
        ? 'تم اعتماد ملفكم وحسابكم نشط وجاهز للتدريس. يمكنك تسجيل الدخول مباشرة.'
        : 'مبارك! تم اعتماد ملفكم الأكاديمي كأستاذ معتمد في باقون. يُرجى تعيين كلمة المرور واستكمال بياناتكم للانطلاق مباشرة.';
    } else if (application.status === 'supervisor_approved') {
      statusDisplay = 'supervisor_approved';
      message = 'تمت دراسة ملفكم واعتماده من قبل المشرف التربوي للمادة، وهو الآن في مرحلة التأكيد الإداري النهائي من إدارة المنصة.';
    } else if (application.status === 'rejected' || application.status === 'supervisor_rejected') {
      statusDisplay = 'rejected';
      message = 'نشكر لكم مبادرتكم الكريمة ورغبتكم الصادقة في إسناد طلبة غزة. نعتذر عن تعذر قبول الطلب في هذه الدورة لانشغال الشواغر التدريسية أو عدم توفر الفوج المناسب في الوقت الراهن، ويبقى ملفكم محفوظاً للدورات القادمة بإذن الله.';
    } else {
      statusDisplay = 'pending';
      message = 'طلبكم قيد التدقيق والمراجعة الأكاديمية لدى المشرف التربوي المختص وإدارة المنصة، وسيتم إشعاركم فور اتخاذ القرار.';
    }

    // Split name parts if needed
    const namePartsAr = (application.fullNameAr || '').trim().split(/\s+/);
    const firstNameAr = existingUser?.firstNameAr || existingUser?.firstName || namePartsAr[0] || '';
    const lastNameAr = existingUser?.lastNameAr || existingUser?.lastName || namePartsAr.slice(1).join(' ') || '';

    const namePartsEn = (application.fullNameEn || '').trim().split(/\s+/);
    const firstNameEn = existingUser?.firstNameEn || namePartsEn[0] || '';
    const lastNameEn = existingUser?.lastNameEn || namePartsEn.slice(1).join(' ') || '';

    return {
      found: true,
      status: statusDisplay,
      isCompleted,
      application: {
        id: application.id,
        fullNameAr: application.fullNameAr,
        fullNameEn: application.fullNameEn,
        firstNameAr,
        lastNameAr,
        firstNameEn,
        lastNameEn,
        email: application.email,
        phone: application.phone,
        nationality: existingUser?.nationality || application.nationality || 'فلسطيني',
        teachingField: application.teachingField,
        subjects: application.subjects,
        assignedSubject: application.assignedSubject,
        createdAt: application.createdAt,
        rejectionReason: application.supervisorRejectionReason || null,
      },
      message,
    };
  }

  /**
   * 1.2 Public: Complete registration and set password for approved teacher application
   */
  @Post('complete-registration')
  async completeRegistration(
    @Body()
    body: {
      applicationId: string;
      identifier: string;
      password: string;
      confirmPassword: string;
      firstNameAr?: string;
      lastNameAr?: string;
      firstNameEn?: string;
      lastNameEn?: string;
      nationality?: string;
    },
  ) {
    if (!body.applicationId) {
      throw new BadRequestException('معرّف الاستمارة إجباري لاستكمال التسجيل');
    }
    if (!body.password || body.password.length < 8) {
      throw new BadRequestException('كلمة المرور يجب أن تتكون من 8 خانات على الأقل');
    }
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
    }

    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id: body.applicationId },
      include: {
        assignedSubject: true,
      },
    });

    if (!application) {
      throw new NotFoundException('استمارة التطوع غير موجودة');
    }

    if (application.status !== 'approved') {
      throw new BadRequestException('لا يمكن استكمال التسجيل إلا بعد الاعتماد النهائي للاستمارة من إدارة المنصة');
    }

    // Verify identifier matches
    const cleanId = (body.identifier || '').trim().toLowerCase();
    const cleanAppMail = (application.email || '').trim().toLowerCase();
    const cleanAppPhone = (application.phone || '').trim();
    const digitsOnlyId = cleanId.replace(/[^0-9]/g, '');
    const digitsOnlyPhone = cleanAppPhone.replace(/[^0-9]/g, '');

    const matchesEmail = cleanId === cleanAppMail;
    const matchesPhone = cleanId === cleanAppPhone || (digitsOnlyId.length >= 6 && digitsOnlyPhone.includes(digitsOnlyId.slice(-7)));

    if (cleanId && !matchesEmail && !matchesPhone) {
      throw new UnauthorizedException('بيانات الاستعلام غير متطابقة مع الاستمارة');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    // Resolve subject
    let subjectIdToAssign = application.assignedSubjectId;
    let allSubjectIdsToAssign: string[] = [];
    if (!subjectIdToAssign && application.subjects && application.subjects.length > 0) {
      const resolved = await resolveSubjectIds(this.prisma, application.subjects);
      subjectIdToAssign = resolved.primaryId;
      allSubjectIdsToAssign = resolved.allIds;
    } else if (subjectIdToAssign) {
      allSubjectIdsToAssign = [subjectIdToAssign];
    }

    const namePartsAr = (body.firstNameAr && body.lastNameAr)
      ? { first: body.firstNameAr.trim(), last: body.lastNameAr.trim() }
      : (application.fullNameAr || '').trim().split(/\s+/).reduce(
          (acc, part, idx, arr) => (idx === 0 ? { ...acc, first: part } : { ...acc, last: arr.slice(1).join(' ') }),
          { first: 'أستاذ', last: 'متطوع' },
        );

    const firstNameEn = body.firstNameEn?.trim() || (application.fullNameEn || '').trim().split(/\s+/)[0] || null;
    const lastNameEn = body.lastNameEn?.trim() || (application.fullNameEn || '').trim().split(/\s+/).slice(1).join(' ') || null;
    const finalNationality = body.nationality?.trim() || application.nationality || 'فلسطيني';

    // Find existing user if any
    let user = null;
    if (application.convertedUserId) {
      user = await this.prisma.user.findUnique({ where: { id: application.convertedUserId } });
    }
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: application.email }, { phone: application.phone }],
        },
      });
    }

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          primaryRole: 'teacher' as any,
          status: 'active' as any,
          mustChangePassword: false,
          nationality: finalNationality,
          firstName: namePartsAr.first || user.firstName,
          lastName: namePartsAr.last || user.lastName,
          firstNameAr: namePartsAr.first || user.firstNameAr,
          lastNameAr: namePartsAr.last || user.lastNameAr,
          firstNameEn: firstNameEn || user.firstNameEn,
          lastNameEn: lastNameEn || user.lastNameEn,
          supervisedSubjectId: subjectIdToAssign || user.supervisedSubjectId,
          supervisedSubjectIds: allSubjectIdsToAssign.length > 0 ? allSubjectIdsToAssign : user.supervisedSubjectIds,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: application.email,
          phone: application.phone,
          firstName: namePartsAr.first,
          lastName: namePartsAr.last,
          firstNameAr: namePartsAr.first,
          lastNameAr: namePartsAr.last,
          firstNameEn,
          lastNameEn,
          passwordHash,
          primaryRole: 'teacher' as any,
          status: 'active' as any,
          mustChangePassword: false,
          nationality: finalNationality,
          supervisedSubjectId: subjectIdToAssign,
          supervisedSubjectIds: allSubjectIdsToAssign,
        },
      });
    }

    // Role assignment
    try {
      await this.prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId: user.id, role: 'teacher' as any } },
        update: {},
        create: { userId: user.id, role: 'teacher' as any },
      });
    } catch (_) {}

    // Link subjects to supervisor_subjects
    for (const subId of allSubjectIdsToAssign) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO users.supervisor_subjects (user_id, subject_id)
           VALUES ($1::uuid, $2::uuid)
           ON CONFLICT (user_id, subject_id) DO NOTHING;`,
          user.id,
          subId,
        );
      } catch (_) {}
    }

    // Link converted user back to application
    await this.prisma.volunteerApplication.update({
      where: { id: application.id },
      data: {
        convertedUserId: user.id,
        assignedSubjectId: subjectIdToAssign || application.assignedSubjectId,
      },
    });

    // Create session token so they are immediately logged in
    const roles = ['teacher'];
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      primaryRole: 'teacher',
      isDualRole: false,
    };
    const accessToken = this.jwtService.sign(payload);

    let supervisedSubject = null;
    if (user.supervisedSubjectId) {
      supervisedSubject = await this.prisma.subject.findUnique({
        where: { id: user.supervisedSubjectId },
        select: { id: true, code: true, nameAr: true, nameEn: true, iconUrl: true },
      });
    }

    return {
      success: true,
      message: 'تم تعيين كلمة المرور وتفعيل حساب الأستاذ بنجاح! مرحباً بك في منصة باقون.',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameAr: user.firstNameAr,
        lastNameAr: user.lastNameAr,
        firstNameEn: user.firstNameEn,
        lastNameEn: user.lastNameEn,
        primaryRole: 'teacher',
        roles: ['teacher'],
        isDualRole: false,
        supervisedSubjectId: user.supervisedSubjectId,
        supervisedSubjectIds: user.supervisedSubjectIds,
        supervisedSubject,
        mustChangePassword: false,
        status: 'active',
        phone: user.phone,
        nationality: user.nationality,
      },
    };
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

    // Smartly auto-resolve subject ID matching Palestinian curriculum
    const { primaryId: autoSubjectId, allIds: autoSubjectIds } = await resolveSubjectIds(
      this.prisma,
      subjects,
    );

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
          assignedSubjectId: autoSubjectId || existingApp.assignedSubjectId || null,
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
          isExistingBaaqoonTeacher: body.isExistingBaaqoonTeacher !== undefined ? Boolean(body.isExistingBaaqoonTeacher) : existingApp.isExistingBaaqoonTeacher,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new application
      appRecord = await this.prisma.volunteerApplication.create({
        data: {
          isExistingBaaqoonTeacher: Boolean(body.isExistingBaaqoonTeacher),
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
          assignedSubjectId: autoSubjectId || null,
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
      const matchingSubjectIds = autoSubjectIds;

      const relevantSupervisors = await this.prisma.user.findMany({
        where: {
          OR: [
            { primaryRole: { in: ['admin', 'super_admin'] as any } },
            {
              primaryRole: { in: ['subject_supervisor', 'supervisor'] as any },
              OR: [
                { supervisedSubjectId: { in: matchingSubjectIds } },
                { supervisedSubjectIds: { hasSome: matchingSubjectIds } },
                { supervisedSubject: { nameAr: { in: subjects } } },
              ],
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

    // Send application receipt confirmation email asynchronously (never blocking response)
    try {
      this.emailService
        .sendVolunteerApplicationReceivedEmail({
          fullName: appRecord.fullNameAr || appRecord.fullNameEn || 'الأستاذ(ة) الفاضل(ة)',
          email: appRecord.email,
          subjects: appRecord.subjects,
        })
        .catch(err => console.warn('[VolunteerController] Application received email err:', err.message));
    } catch (_) {}

    return {
      success: true,
      message: 'تم استلام استمارة التطوع بنجاح! شكراً لمبادرتك النبيلة في دعم طلبة غزة.',
      applicationId: appRecord.id,
      telegramChannelUrl: 'https://t.me/+TeachersForGaza',
      whatsappGroupUrl: 'https://chat.whatsapp.com/TeachersForGaza',
    };
  }

  /**
   * 3. Disabled: Direct teacher onboarding is completely closed
   * All teachers must submit a volunteer application, pass supervisor review, and receive admin approval.
   */
  @Post('existing-teacher-onboard')
  async onboardExistingTeacher() {
    throw new ForbiddenException(
      'تم إغلاق مسار التسجيل المباشر نهائياً. يلزم تقديم استمارة تطوع رسمية وتدقيقها من قبل المشرف الأكاديمي المختص واعتمادها رسمياً من إدارة المنصة.'
    );
  }

  /**
   * 3.5 Protected: Fast pending volunteer applications count for Admin & Supervisor
   */
  @Get('pending-count')
  @UseGuards(JwtAuthGuard)
  async getPendingCount(@Req() req: any) {
    const user = req.user;
    const role = user.primaryRole;
    const isSuperOrAdmin = ['super_admin', 'admin'].includes(role);
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(role);

    if (!isSuperOrAdmin && !isSupervisor) {
      return { count: 0, pendingSupervisorReview: 0, supervisorApproved: 0 };
    }

    if (isSupervisor && !isSuperOrAdmin) {
      const supervisorUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { supervisedSubjectId: true, supervisedSubjectIds: true },
      });
      const subjectIdSet = new Set<string>();
      if (supervisorUser?.supervisedSubjectId) subjectIdSet.add(supervisorUser.supervisedSubjectId);
      if (Array.isArray(supervisorUser?.supervisedSubjectIds)) {
        supervisorUser.supervisedSubjectIds.forEach((id: string) => id && subjectIdSet.add(id));
      }

      if (subjectIdSet.size === 0) {
        return { count: 0, pendingSupervisorReview: 0, supervisorApproved: 0 };
      }

      const subjects = await this.prisma.subject.findMany({
        where: { id: { in: Array.from(subjectIdSet) } },
        select: { nameAr: true },
      });
      const subjectNames = subjects.map(s => s.nameAr);

      const count = await this.prisma.volunteerApplication.count({
        where: {
          status: 'pending',
          OR: [
            { assignedSubjectId: { in: Array.from(subjectIdSet) } },
            { subjects: { hasSome: subjectNames } },
          ],
        },
      });

      return {
        count,
        pendingSupervisorReview: count,
        supervisorApproved: 0,
      };
    }

    // For Admin:
    const pendingSupervisorReview = await this.prisma.volunteerApplication.count({
      where: { status: 'pending' },
    });
    const supervisorApproved = await this.prisma.volunteerApplication.count({
      where: { status: 'supervisor_approved' },
    });

    return {
      count: pendingSupervisorReview + supervisorApproved,
      pendingSupervisorReview,
      supervisorApproved,
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
      throw new UnauthorizedException('غير مصرح لك بالاطلاع على استمارات الأساتذة');
    }

    let subjectFilter: string[] | null = null;
    let supervisedSubjects: Array<{ id: string; nameAr: string; nameEn?: string | null; code: string }> = [];

    if (isSupervisor && !isSuperOrAdmin) {
      // Find the supervisor's assigned subject(s)
      const supervisorUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { supervisedSubject: true },
      });

      const subjectIdSet = new Set<string>();
      if (supervisorUser?.supervisedSubjectId) {
        subjectIdSet.add(supervisorUser.supervisedSubjectId);
      }
      if (supervisorUser?.supervisedSubjectIds && Array.isArray(supervisorUser.supervisedSubjectIds)) {
        supervisorUser.supervisedSubjectIds.forEach((id: string) => {
          if (id) subjectIdSet.add(id);
        });
      }

      if (subjectIdSet.size > 0) {
        supervisedSubjects = await this.prisma.subject.findMany({
          where: { id: { in: Array.from(subjectIdSet) } },
          select: { id: true, nameAr: true, nameEn: true, code: true },
          orderBy: { nameAr: 'asc' },
        });
      }

      if (supervisedSubjects.length === 0) {
        // If supervisor has no subject assigned yet, return empty list
        return {
          applications: [],
          totalCount: 0,
          supervisedSubjectName: null,
          supervisedSubjects: [],
          isMultiSubjectSupervisor: false,
          stats: {
            total: 0,
            highlyRecommended: 0,
            qualified: 0,
            needsReview: 0,
            pendingSupervisorReview: 0,
            supervisorApproved: 0,
            adminActivated: 0,
          },
        };
      }

      subjectFilter = supervisedSubjects.map(s => s.nameAr);
    } else if (isSuperOrAdmin) {
      supervisedSubjects = await this.prisma.subject.findMany({
        where: { isActive: true },
        select: { id: true, nameAr: true, nameEn: true, code: true },
        orderBy: { nameAr: 'asc' },
      });
    }

    // Build Prisma where clause
    const where: any = {};

    // Filter by query subject if specified
    if (query.subject && query.subject !== 'all') {
      if (query.subject === '__dual__') {
        // Multi-subject applicants applying for 2 or more of supervisor's subjects
        if (subjectFilter && subjectFilter.length > 1) {
          where.AND = subjectFilter.slice(0, 2).map((subName: string) => ({
            subjects: { has: subName },
          }));
        }
      } else if (isSupervisor && !isSuperOrAdmin) {
        const allowed = subjectFilter?.includes(query.subject);
        if (allowed) {
          where.subjects = { has: query.subject };
        } else {
          where.subjects = { hasSome: subjectFilter || [] };
        }
      } else {
        where.subjects = { has: query.subject };
      }
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

    // Enrich each application with automated dossier evaluation
    const enrichedApplications = applications.map((app: any) => {
      const dossierAnalysis = evaluateTeacherDossier(app, supervisedSubjects);
      return {
        ...app,
        dossierAnalysis,
      };
    });

    // Optional filter by tier if requested
    let finalApplications = enrichedApplications;
    if (query.tier && query.tier !== 'all') {
      finalApplications = enrichedApplications.filter(a => a.dossierAnalysis.tier === query.tier);
    }

    // Stats calculations
    const stats = {
      total: enrichedApplications.length,
      highlyRecommended: enrichedApplications.filter(a => a.dossierAnalysis.tier === 'highly_recommended').length,
      qualified: enrichedApplications.filter(a => a.dossierAnalysis.tier === 'qualified').length,
      needsReview: enrichedApplications.filter(a => a.dossierAnalysis.tier === 'needs_review' || a.dossierAnalysis.tier === 'low_match').length,
      pendingSupervisorReview: enrichedApplications.filter(a => a.status === 'pending').length,
      supervisorApproved: enrichedApplications.filter(a => a.status === 'supervisor_approved').length,
      adminActivated: enrichedApplications.filter(a => a.status === 'approved' && a.convertedUserId != null).length,
    };

    return {
      applications: finalApplications,
      totalCount: finalApplications.length,
      scope: isSuperOrAdmin ? 'all' : 'subject_scoped',
      supervisedSubjectName: subjectFilter ? subjectFilter.join(' + ') : null,
      supervisedSubjects,
      isMultiSubjectSupervisor: supervisedSubjects.length > 1,
      stats,
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
    @Body() body: {
      decision: 'approved' | 'rejected';
      supervisorNotes?: string;
      rejectionReason?: string;
      recommendedSubjectId?: string;
    },
  ) {
    const user = req.user;
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);
    const isAdmin = ['super_admin', 'admin'].includes(user.primaryRole);

    if (!isSupervisor && !isAdmin) {
      throw new UnauthorizedException('دراسة ملفات الأساتذة متاحة للمشرف الأكاديمي أو إدارة المنصة فقط');
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

    const updateData: any = {
      status: newStatus,
      supervisorReviewedById: user.id,
      supervisorReviewedAt: new Date(),
      supervisorDecision: body.decision,
      supervisorNotes: body.supervisorNotes?.trim() || null,
      supervisorRejectionReason: body.decision === 'rejected' ? body.rejectionReason?.trim() : null,
      updatedAt: new Date(),
    };

    if (body.decision === 'approved' && body.recommendedSubjectId) {
      updateData.assignedSubjectId = body.recommendedSubjectId;
    }

    const updated = await this.prisma.volunteerApplication.update({
      where: { id },
      data: updateData,
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
            title: `دراسة ملف أستاذ: ${decisionArabic} من المشرف ${supervisorName}`,
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
      throw new UnauthorizedException('التأكيد النهائي وتفعيل حسابات الأساتذة متاح لمدير المنصة فقط');
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

      // Send polite rejection email asynchronously
      try {
        this.emailService
          .sendVolunteerRejectedEmail({
            fullName: application.fullNameAr || application.fullNameEn || 'الأستاذ(ة) الفاضل(ة)',
            email: application.email,
            reason: body.adminNotes || application.supervisorRejectionReason || undefined,
          })
          .catch(err => console.warn('[VolunteerController] Rejection email err:', err.message));
      } catch (_) {}

      return { success: true, message: 'تم تسجيل الرفض النهائي للطلب', application: updated };
    }

    // Action: 'activate'
    if (application.convertedUserId) {
      throw new BadRequestException('هذا الأستاذ تم تفعيل حسابه بالفعل مسبقاً');
    }

    // Check if user already exists with this email or phone
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: application.email }, { phone: application.phone }],
      },
    });

    // Resolve subject to assign
    let subjectIdToAssign = body.assignedSubjectId || application.assignedSubjectId;
    let allSubjectIdsToAssign: string[] = [];

    if (!subjectIdToAssign && application.subjects && application.subjects.length > 0) {
      const resolved = await resolveSubjectIds(this.prisma, application.subjects);
      subjectIdToAssign = resolved.primaryId;
      allSubjectIdsToAssign = resolved.allIds;
    } else if (subjectIdToAssign) {
      allSubjectIdsToAssign = [subjectIdToAssign];
    }

    if (existingUser) {
      // User already exists: ensure teacher role is granted and subject is assigned
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          primaryRole: 'teacher' as any,
          supervisedSubjectId: subjectIdToAssign || existingUser.supervisedSubjectId,
          supervisedSubjectIds: allSubjectIdsToAssign.length > 0 ? allSubjectIdsToAssign : existingUser.supervisedSubjectIds,
        },
      });

      for (const subId of allSubjectIdsToAssign) {
        try {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO users.supervisor_subjects (user_id, subject_id)
             VALUES ($1::uuid, $2::uuid)
             ON CONFLICT (user_id, subject_id) DO NOTHING;`,
            existingUser.id,
            subId,
          );
        } catch (_) {}
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

      // Send approval email asynchronously
      try {
        let assignedSubName: string | undefined;
        if (subjectIdToAssign) {
          const sub = await this.prisma.subject.findUnique({
            where: { id: subjectIdToAssign },
            select: { nameAr: true },
          });
          assignedSubName = sub?.nameAr;
        }

        this.emailService
          .sendVolunteerApprovedEmail({
            fullName: application.fullNameAr || application.fullNameEn || `${existingUser.firstName} ${existingUser.lastName}`.trim(),
            email: application.email,
            assignedSubject: assignedSubName,
          })
          .catch(err => console.warn('[VolunteerController] Approval email err:', err.message));
      } catch (_) {}

      return {
        success: true,
        message: 'تم ربط الاستمارة بالحساب وتأكيد اعتماده كأستاذ رسمي بنجاح!',
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
        supervisedSubjectIds: allSubjectIdsToAssign,
      },
    });

    for (const subId of allSubjectIdsToAssign) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO users.supervisor_subjects (user_id, subject_id)
           VALUES ($1::uuid, $2::uuid)
           ON CONFLICT (user_id, subject_id) DO NOTHING;`,
          newUser.id,
          subId,
        );
      } catch (_) {}
    }

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

    // Send official approval email with credentials and terms reminder
    try {
      let assignedSubName: string | undefined;
      if (subjectIdToAssign) {
        const sub = await this.prisma.subject.findUnique({
          where: { id: subjectIdToAssign },
          select: { nameAr: true },
        });
        assignedSubName = sub?.nameAr;
      }

      this.emailService
        .sendVolunteerApprovedEmail({
          fullName: application.fullNameAr || application.fullNameEn || `${firstNameAr} ${lastNameAr}`.trim(),
          email: application.email,
          assignedSubject: assignedSubName,
          initialPassword,
        })
        .catch(err => console.warn('[VolunteerController] New user approval email err:', err.message));
    } catch (_) {}

    const { passwordHash: _, ...safeUser } = newUser;

    return {
      success: true,
      message: `تم اعتماد وتفعيل حساب الأستاذ بنجاح! كلمة المرور المبدئية: ${initialPassword}`,
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
