import { Controller, Get, Req, Res, Post, Body, Param, Patch, Delete, UseGuards, Query, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import * as XLSX from 'xlsx';

function getActivityStatusText(lastLogin?: Date | null, created?: Date | null) {
  const now = Date.now();
  if (lastLogin) {
    const diffDays = Math.floor((now - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `نشط (منذ ${diffDays === 0 ? 'اليوم' : diffDays + ' أيام'})`;
    if (diffDays <= 14) return `غائب منذ ${diffDays} يوماً (خمول نسبي)`;
    return `خامل ومنقطع منذ ${diffDays} يوماً`;
  }
  const diffDays = created ? Math.floor((now - new Date(created).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  if (diffDays < 7) return 'جديد (لم يدخل بعد)';
  return `خامل (لم يسجل دخوله قط منذ ${diffDays} يوماً)`;
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  @Get('activity-logs')
  async getActivityLogs(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (role !== 'admin' && role !== 'super_admin' && role !== 'supervisor' && role !== 'subject_supervisor') {
      return [];
    }
    
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true, primaryRole: true } }
      }
    });
  }


  @Get('admin/distribution')
  async getAdminDistribution() {
    // Ensure table users.supervisor_subjects exists
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users.supervisor_subjects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES curriculum.subjects(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
          UNIQUE(user_id, subject_id)
        );
      `);
    } catch (_) {}

    let extraSupervisorRows: any[] = [];
    try {
      extraSupervisorRows = await this.prisma.$queryRawUnsafe(`
        SELECT ss.subject_id, u.id, u."firstName", u."lastName", u.email, u.phone, u."primaryRole"
        FROM users.supervisor_subjects ss
        JOIN users.users u ON u.id = ss.user_id
        WHERE u.status IN ('active', 'pending')
          AND (
            u."primaryRole" IN ('subject_supervisor', 'admin', 'super_admin')
            OR EXISTS (SELECT 1 FROM users.user_roles ur WHERE ur."userId" = u.id AND ur.role = 'subject_supervisor')
          )
      `);
    } catch (_) {}

    const subjects = await this.prisma.subject.findMany({
      orderBy: { nameAr: 'asc' },
      include: {
        supervisors: {
          where: {
            OR: [
              { primaryRole: { in: ['subject_supervisor', 'admin', 'super_admin'] } },
              { roles: { some: { role: 'subject_supervisor' } } }
            ]
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            primaryRole: true,
            roles: { select: { role: true } }
          }
        }
      }
    });

    const courses = await this.prisma.course.findMany({
      select: { id: true, subjectId: true }
    });

    const cohorts = await this.prisma.cohort.findMany({
      select: { id: true, courseId: true }
    });

    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohorts.map(c => c.id) } }
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: instructors.map(i => i.teacherId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        primaryRole: true,
        supervisedSubjectId: true,
        roles: { select: { role: true } }
      }
    });

    const formattedSubjects = subjects.map((subject: any) => {
      const subjectCourses = courses.filter(c => c.subjectId === subject.id).map(c => c.id);
      const subjectCohorts = cohorts.filter(c => subjectCourses.includes(c.courseId)).map(c => c.id);
      
      const teachersMap = new Map();
      instructors.filter(inst => subjectCohorts.includes(inst.cohortId)).forEach(inst => {
        const teacher: any = users.find(u => u.id === inst.teacherId);
        if (teacher) {
          const rawRoles = teacher.roles?.map((r: any) => r.role as string) || [];
          const roleList: string[] = Array.from(new Set([teacher.primaryRole as string, ...rawRoles]));
          const isDualRole = roleList.includes('teacher') && (roleList.includes('subject_supervisor') || roleList.includes('supervisor'));
          teachersMap.set(teacher.id, {
            ...teacher,
            roles: roleList,
            isDualRole
          });
        }
      });

      // Merge direct supervisors with extra assignments from supervisor_subjects
      const directSupervisors = (subject.supervisors as any[]) || [];
      const directSupIds = new Set(directSupervisors.map((s: any) => s.id));
      const extraSups = extraSupervisorRows
        .filter(r => r.subject_id === subject.id && !directSupIds.has(r.id))
        .map(r => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: r.phone,
          primaryRole: r.primaryRole,
          roles: [{ role: 'subject_supervisor' }]
        }));

      const allSupervisorsForSubject = [...directSupervisors, ...extraSups];

      const formattedSupervisors = allSupervisorsForSubject.map((sup: any) => {
        const rawRoles = sup.roles?.map((r: any) => r.role as string) || [];
        const roleList: string[] = Array.from(new Set([sup.primaryRole as string, ...rawRoles]));
        const taughtCount = instructors.filter(inst => inst.teacherId === sup.id).length;
        const isDualRole =
          (roleList.includes('teacher') && (roleList.includes('subject_supervisor') || roleList.includes('supervisor'))) ||
          taughtCount > 0;
        return {
          ...sup,
          roles: isDualRole ? Array.from(new Set([...roleList, 'teacher', 'subject_supervisor'])) : roleList,
          isDualRole,
          taughtCohortsCount: taughtCount
        };
      });

      return {
        ...subject,
        supervisors: formattedSupervisors,
        teachers: Array.from(teachersMap.values())
      };
    });

    const rawSupervisors = await this.prisma.user.findMany({
      where: {
        primaryRole: { in: ['subject_supervisor', 'admin', 'super_admin', 'teacher'] },
        status: { in: ['active', 'pending'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        primaryRole: true,
        supervisedSubjectId: true,
        roles: { select: { role: true } }
      },
      orderBy: [
        { primaryRole: 'asc' },
        { firstName: 'asc' }
      ]
    });

    const supervisors = rawSupervisors.map((s: any) => {
      const rawRoles = s.roles?.map((r: any) => r.role as string) || [];
      const roleList: string[] = Array.from(new Set([s.primaryRole as string, ...rawRoles]));
      const isDualRole = roleList.includes('teacher') && (roleList.includes('subject_supervisor') || roleList.includes('supervisor'));
      return {
        ...s,
        roles: roleList,
        isDualRole
      };
    });

    return { subjects: formattedSubjects, supervisors };
  }

  @Post('admin/distribution/:subjectId/supervisor/:userId')
  async assignSupervisorPost(
    @Req() req: any,
    @Param('subjectId') subjectId: string,
    @Param('userId') userId: string,
    @Body() body?: { keepTeaching?: boolean }
  ) {
    return this.assignSupervisor(req, subjectId, userId, body);
  }

  @Patch('admin/distribution/:subjectId/supervisor/:userId')
  async assignSupervisor(
    @Req() req: any,
    @Param('subjectId') subjectId: string,
    @Param('userId') userId: string,
    @Body() body?: { keepTeaching?: boolean }
  ) {
    const role = req.user?.primaryRole;
    if (role !== 'super_admin' && role !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    if (userId === 'none' || !userId) {
      const currentSupes = await this.prisma.user.findMany({
        where: {
          supervisedSubjectId: subjectId,
          primaryRole: { in: ['subject_supervisor'] }
        }
      });
      for (const su of currentSupes) {
        await this.prisma.user.update({
          where: { id: su.id },
          data: { primaryRole: 'teacher', supervisedSubjectId: subjectId }
        });
        await this.prisma.userRoleAssignment.deleteMany({
          where: { userId: su.id, role: 'subject_supervisor' }
        });
        await this.prisma.userRoleAssignment.upsert({
          where: { userId_role: { userId: su.id, role: 'teacher' } },
          update: {},
          create: { userId: su.id, role: 'teacher' }
        });
      }
      try {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM users.supervisor_subjects WHERE subject_id = $1::uuid;`,
          subjectId
        );
      } catch (_) {}
      try {
        await this.prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action: 'UNASSIGN_ALL_SUPERVISORS',
            details: `إلغاء تعيين كافة المشرفين للمادة ${subjectId} مع إبقائهم كأساتذة مدرّسين لمادتهم`
          }
        });
      } catch (e) {}
      return { success: true, message: 'تم إخلاء مشرفي المادة بنجاح وتحويلهم لأساتذة مدرّسين لمادتهم' };
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });

    if (!targetUser) {
      return { error: 'User not found' };
    }

    const existingRoles = targetUser.roles?.map(r => r.role) || [];
    const wasTeacher = targetUser.primaryRole === 'teacher' || existingRoles.includes('teacher');
    const enableDual = body?.keepTeaching !== undefined ? body.keepTeaching : true;

    // 1. Ensure supervisor_subjects table exists and insert multi-subject link
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users.supervisor_subjects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES curriculum.subjects(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
          UNIQUE(user_id, subject_id)
        );
      `);
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO users.supervisor_subjects (user_id, subject_id)
         VALUES ($1::uuid, $2::uuid)
         ON CONFLICT (user_id, subject_id) DO NOTHING;`,
        userId,
        subjectId
      );
    } catch (_) {}

    // 2. Set primaryRole to subject_supervisor, and if supervisedSubjectId is null set it to this subject
    const updateData: any = {
      primaryRole: 'subject_supervisor'
    };
    if (!targetUser.supervisedSubjectId) {
      updateData.supervisedSubjectId = subjectId;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Always grant subject_supervisor role
    await this.prisma.userRoleAssignment.upsert({
      where: { userId_role: { userId, role: 'subject_supervisor' } },
      update: {},
      create: { userId, role: 'subject_supervisor', grantedById: req.user.id }
    });

    // Preserve or grant teacher role for dual-role (Teaching + Supervision together)
    if (wasTeacher || enableDual) {
      await this.prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId, role: 'teacher' } },
        update: {},
        create: { userId, role: 'teacher', grantedById: req.user.id }
      });
    }

    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'ترقية وتكليف إشرافي (تنسيق مادة دراسية)',
          body: 'تم تكليفك مشرفاً منسقاً للمادة مع الاحتفاظ بكافة صلاحياتك التعليمية والإشرافية وأفواجك.',
          actionUrl: '/supervisor/dashboard',
          type: 'system'
        }
      });
    } catch (_) {}

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'ASSIGN_SUPERVISOR_DUAL',
          details: `ترقية وتعيين ${targetUser.firstName} ${targetUser.lastName} مشرفاً منسقاً للمادة`
        }
      });
    } catch (e) {}

    return {
      success: true,
      message: `تم إلحاق وتعيين ${targetUser.firstName} ${targetUser.lastName} كمشرف منسق للمادة بنجاح!`
    };
  }

  @Delete('admin/distribution/:subjectId/supervisor/:userId')
  async removeSupervisor(@Req() req: any, @Param('subjectId') subjectId: string, @Param('userId') userId: string) {
    const role = req.user?.primaryRole;
    if (role !== 'super_admin' && role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    if (userId === 'all') {
      const currentSupervisors = await this.prisma.user.findMany({
        where: {
          supervisedSubjectId: subjectId,
          primaryRole: { in: ['subject_supervisor', 'admin', 'super_admin'] }
        }
      });
      for (const su of currentSupervisors) {
        if (su.primaryRole === 'subject_supervisor') {
          await this.prisma.user.update({
            where: { id: su.id },
            data: { primaryRole: 'teacher', supervisedSubjectId: subjectId }
          });
          await this.prisma.userRoleAssignment.deleteMany({
            where: { userId: su.id, role: 'subject_supervisor' }
          });
          await this.prisma.userRoleAssignment.upsert({
            where: { userId_role: { userId: su.id, role: 'teacher' } },
            update: {},
            create: { userId: su.id, role: 'teacher' }
          });
        }
      }
      try {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM users.supervisor_subjects WHERE subject_id = $1::uuid;`,
          subjectId
        );
      } catch (_) {}
      return { success: true, message: 'تم إزالة جميع المشرفين من المادة وإبقاؤهم كأساتذة مدرّسين لمادتهم' };
    }

    // 1. Remove from supervisor_subjects
    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM users.supervisor_subjects WHERE user_id = $1::uuid AND subject_id = $2::uuid;`,
        userId,
        subjectId
      );
    } catch (_) {}

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });

    if (!targetUser) {
      return { error: 'المستخدم غير موجود' };
    }

    // Check if user still supervises other subjects
    let otherSubjectId: string | null = null;
    try {
      const remaining: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT subject_id FROM users.supervisor_subjects WHERE user_id = $1::uuid LIMIT 1`,
        userId
      );
      if (remaining && remaining.length > 0) {
        otherSubjectId = remaining[0].subject_id;
      }
    } catch (_) {}

    let message = 'تم إزالة المشرف من المادة بنجاح';
    if (otherSubjectId) {
      // User still supervises another subject! Keep them as subject_supervisor with the other subject
      await this.prisma.user.update({
        where: { id: userId },
        data: { supervisedSubjectId: otherSubjectId }
      });
      message = 'تم إزالة المشرف من هذه المادة مع استمرار تكليفه الإشرافي للمواد الأخرى';
    } else {
      // No remaining supervisory subjects
      // RETAIN AND PRESERVE THEIR TEACHING SUBJECT - NEVER SET TO NULL!
      const teachingSubjectId = targetUser.supervisedSubjectId || subjectId;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          primaryRole: 'teacher',
          supervisedSubjectId: teachingSubjectId
        }
      });
      await this.prisma.userRoleAssignment.deleteMany({
        where: { userId, role: 'subject_supervisor' }
      });
      await this.prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId, role: 'teacher' } },
        update: {},
        create: { userId, role: 'teacher' }
      });
      message = 'تم إلغاء التكليف الإشرافي بنجاح مع الاحتفاظ بكامل صلاحياته كأستاذ مدرّس للمادة دون أي انقطاع';
    }

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'REMOVE_SUPERVISOR',
          details: `إزالة المشرف ${targetUser ? targetUser.firstName + ' ' + targetUser.lastName : userId} من إشراف المادة`
        }
      });
    } catch (e) {}

    return {
      success: true,
      message
    };
  }

  constructor(private readonly prisma: PrismaService) {}

  private async getSupervisorSubjectIds(userId?: string, supervisedSubjectId?: string | null): Promise<string[]> {
    const ids = new Set<string>();
    if (supervisedSubjectId) {
      ids.add(supervisedSubjectId);
    }
    if (userId) {
      try {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT subject_id FROM users.supervisor_subjects WHERE user_id = $1::uuid`,
          userId
        );
        for (const r of rows) {
          if (r.subject_id) ids.add(r.subject_id);
        }
      } catch (_) {}
    }
    return Array.from(ids);
  }

  @Get('admin/data')
  async getAdminData() {
    const teachers = await this.prisma.user.findMany({
      where: {
        OR: [
          { primaryRole: 'teacher' },
          { roles: { some: { role: 'teacher' } } }
        ]
      },
      select: { id: true, firstName: true, lastName: true, email: true, primaryRole: true, supervisedSubjectId: true }
    });
    const students = await this.prisma.user.findMany({
      where: { primaryRole: 'student' },
      select: { id: true, firstName: true, lastName: true, email: true, academicBranch: true, curriculumType: true, gradeLevel: true }
    });
    const courses = await this.prisma.course.findMany({
      include: {
        subject: { select: { nameAr: true } },
        versions: { where: { isDefault: true }, select: { id: true, versionTag: true } }
      }
    });
    return { teachers, students, courses };
  }

  @Get('admin/database')
  async getAdminDatabase() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true, 
        phone: true,
        nationality: true,
        primaryRole: true, 
        status: true, 
        createdAt: true, 
        supervisedSubjectId: true, 
        supervisedSubject: { select: { id: true, nameAr: true, code: true } },
        academicBranch: true, 
        curriculumType: true, 
        gradeLevel: true,
        lastLoginAt: true
      }
    });
    const subjects = await this.prisma.subject.findMany({
      include: { courses: true }
    });
    const cohorts = await this.prisma.cohort.findMany({
      include: {
        instructors: true,
        enrollments: true
      }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    const cohortsWithDetails = cohorts.map(c => {
      const teacher = c.instructors?.[0] ? userMap.get(c.instructors[0].teacherId) : null;
      return {
        ...c,
        instructors: c.instructors.map(i => ({
          ...i,
          teacher: userMap.get(i.teacherId) || null
        })),
        teacher
      };
    });
    const courses = await this.prisma.course.findMany({
      include: { subject: { select: { nameAr: true } } }
    });
    return { users, subjects, cohorts: cohortsWithDetails, courses };
  }

  @Get('admin/export-database')
  async exportAdminDatabase(@Req() req: any, @Res() res: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const [users, cohorts, enrollments, subjects, courses, sessions] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.cohort.findMany({
        include: {
          instructors: true,
          enrollments: true
        }
      }),
      this.prisma.cohortEnrollment.findMany(),
      this.prisma.subject.findMany({
        include: { courses: true }
      }),
      this.prisma.course.findMany({
        include: { subject: true }
      }),
      this.prisma.session.findMany({
        include: {
          teacher: true,
          cohort: true
        }
      })
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const cohortMap = new Map(cohorts.map(c => [c.id, c]));

    const wb = XLSX.utils.book_new();

    // 1. Sheet: Users
    const usersRows = users.map(u => ({
      'معرف المستخدم (ID)': u.id,
      'الاسم الأول': u.firstName,
      'اسم العائلة': u.lastName,
      'البريد الإلكتروني': u.email || '',
      'رقم الهاتف': u.phone || '',
      'الجنسية': u.nationality || '',
      'نوع الحساب (الدور)': u.primaryRole === 'student' ? 'طالب' : u.primaryRole === 'teacher' ? 'أستاذ' : u.primaryRole === 'subject_supervisor' ? 'مشرف مادة' : 'إدارة',
      'الفرع الدراسي': u.academicBranch === 'scientific' ? 'علمي' : u.academicBranch === 'literary' ? 'أدبي' : u.academicBranch || '',
      'المنهاج': u.curriculumType === 'governmental' ? 'حكومي' : u.curriculumType === 'azhari' ? 'أزهري' : ((u.curriculumType as any) || ''),
      'الصف الدراسي': u.gradeLevel || '',
      'حالة الحساب': u.status === 'active' ? 'نشط' : u.status === 'pending' ? 'قيد المراجعة' : u.status,
      'آخر تسجيل دخول': u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : 'لم يسجل الدخول بعد',
      'حالة النشاط / الخمول': getActivityStatusText(u.lastLoginAt, u.createdAt),
      'تاريخ التسجيل': u.createdAt ? new Date(u.createdAt).toISOString() : ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersRows), 'المستخدمون');

    // 2. Sheet: Cohorts
    const cohortsRows = cohorts.map(c => {
      const crs = courseMap.get(c.courseId);
      const teacher = c.instructors?.[0] ? userMap.get(c.instructors[0].teacherId) : null;
      return {
        'معرف الفوج (ID)': c.id,
        'اسم الفوج الدراسي': c.name,
        'الكود الأكاديمي': c.code,
        'المقرر الدراسي': crs?.title || '',
        'المادة الدراسية': crs?.subject?.nameAr || '',
        'الأستاذ المسند': teacher ? `أ. ${teacher.firstName} ${teacher.lastName}` : 'شاغر',
        'بريد الأستاذ': teacher?.email || '',
        'هاتف الأستاذ': teacher?.phone || '',
        'الطاقة الاستيعابية': c.maxStudents || 25,
        'عدد الطلبة المسجلين': c.enrollments?.length || 0,
        'المقاعد المتاحة': Math.max(0, (c.maxStudents || 25) - (c.enrollments?.length || 0)),
        'الحالة': c.status,
        'تاريخ الإنشاء': c.createdAt ? new Date(c.createdAt).toISOString() : ''
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cohortsRows), 'الأفواج الدراسية');

    // 3. Sheet: Enrollments
    const enrollmentsRows = enrollments.map(e => {
      const coh = cohortMap.get(e.cohortId);
      const st = userMap.get(e.studentId);
      return {
        'معرف التسجيل': e.id,
        'معرف الفوج': e.cohortId,
        'اسم الفوج': coh?.name || '',
        'كود الفوج': coh?.code || '',
        'معرف الطالب': e.studentId,
        'اسم الطالب': st ? `${st.firstName} ${st.lastName}` : '',
        'بريد الطالب': st?.email || '',
        'هاتف الطالب': st?.phone || '',
        'جنسية الطالب': st?.nationality || '',
        'فرع الطالب': st?.academicBranch === 'scientific' ? 'علمي' : 'أدبي',
        'حالة التسجيل': e.status,
        'تاريخ التسجيل بالفوج': e.enrolledAt ? new Date(e.enrolledAt).toISOString() : ''
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(enrollmentsRows), 'تسجيلات الطلبة بالأفواج');

    // 4. Sheet: Subjects & Courses
    const subjectsRows: any[] = [];
    subjects.forEach(s => {
      s.courses?.forEach(crs => {
        subjectsRows.push({
          'معرف المادة': s.id,
          'اسم المادة الأساسية': s.nameAr,
          'كود المادة': s.code,
          'معرف المقرر': crs.id,
          'اسم المقرر الدراسي': crs.title,
          'الفرع الدراسي': crs.academicBranch === 'scientific' ? 'علمي' : 'أدبي',
          'نوع المنهاج': crs.curriculumType === 'governmental' ? 'حكومي' : 'أزهري'
        });
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subjectsRows), 'المواد والمناهج');

    // 5. Sheet: Sessions
    const sessionsRows = sessions.map(s => {
      const durationMins = s.scheduledStartTime && s.scheduledEndTime 
        ? Math.round((new Date(s.scheduledEndTime).getTime() - new Date(s.scheduledStartTime).getTime()) / 60000)
        : 45;
      return {
        'معرف الحصة': s.id,
        'عنوان الحصة': s.title,
        'اسم الفوج': s.cohort?.name || '',
        'الأستاذ': s.teacher ? `أ. ${s.teacher.firstName} ${s.teacher.lastName}` : '',
        'وقت البدء': s.scheduledStartTime ? new Date(s.scheduledStartTime).toISOString() : '',
        'وقت الانتهاء': s.scheduledEndTime ? new Date(s.scheduledEndTime).toISOString() : '',
        'الحالة': s.status,
        'المدة (دقيقة)': durationMins
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionsRows), 'الحصص والجداول');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="baaqoon_database_full_backup_${Date.now()}.xlsx"`);
    res.end(buffer);
  }

  @Get('supervisor/export-database')
  async exportSupervisorDatabase(@Req() req: any, @Res() res: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);
    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(user.id, user.supervisedSubjectId) : [];

    let activeSubjectId: string | null = null;
    if (isSupervisor) {
      if (querySubjectId && supervisorSubjectIds.includes(querySubjectId)) {
        activeSubjectId = querySubjectId;
      } else if (user.supervisedSubjectId && supervisorSubjectIds.includes(user.supervisedSubjectId)) {
        activeSubjectId = user.supervisedSubjectId;
      } else {
        activeSubjectId = supervisorSubjectIds[0] || null;
      }
    } else {
      activeSubjectId = querySubjectId || user.supervisedSubjectId || null;
    }

    const subject = activeSubjectId ? await this.prisma.subject.findUnique({ where: { id: activeSubjectId } }) : null;

    const courses = activeSubjectId ? await this.prisma.course.findMany({ where: { subjectId: activeSubjectId }, select: { id: true, title: true } }) : [];
    const courseIds = courses.map(c => c.id);

    const cohorts = await this.prisma.cohort.findMany({
      where: courseIds.length > 0 ? { courseId: { in: courseIds } } : {},
      include: {
        instructors: true,
        enrollments: true
      }
    });

    const cohortIds = cohorts.map(c => c.id);

    // Fetch instructors & students users
    const allCohortUserIds = new Set<string>();
    cohorts.forEach(c => {
      c.instructors.forEach(i => allCohortUserIds.add(i.teacherId));
      c.enrollments.forEach(e => allCohortUserIds.add(e.studentId));
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(allCohortUserIds) } }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const teachers = await this.prisma.user.findMany({
      where: {
        primaryRole: 'teacher',
        ...(activeSubjectId ? { supervisedSubjectId: activeSubjectId } : {})
      }
    });

    const sessions = await this.prisma.session.findMany({
      where: cohortIds.length > 0 ? { cohortId: { in: cohortIds } } : {},
      include: {
        teacher: true,
        cohort: true
      }
    });

    const wb = XLSX.utils.book_new();

    // Sheet 1: Cohorts
    const cohortsRows = cohorts.map(c => {
      const teacher = c.instructors?.[0] ? userMap.get(c.instructors[0].teacherId) : null;
      return {
        'معرف الفوج': c.id,
        'اسم الفوج الدراسي': c.name,
        'الكود الأكاديمي': c.code,
        'الأستاذ المسند': teacher ? `أ. ${teacher.firstName} ${teacher.lastName}` : 'شاغر',
        'بريد الأستاذ': teacher?.email || '',
        'هاتف الأستاذ': teacher?.phone || '',
        'الطاقة الاستيعابية': c.maxStudents || 25,
        'الطلبة المسجلين': c.enrollments?.length || 0,
        'المقاعد الشاغرة': Math.max(0, (c.maxStudents || 25) - (c.enrollments?.length || 0)),
        'الحالة': c.status,
        'تاريخ الإنشاء': c.createdAt ? new Date(c.createdAt).toISOString() : ''
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cohortsRows), 'أفواج مادة التخصص');

    // Sheet 2: Enrolled Students
    const studentRows: any[] = [];
    cohorts.forEach(c => {
      c.enrollments?.forEach(e => {
        const student = userMap.get(e.studentId);
        if (student) {
          studentRows.push({
            'معرف الطالب': student.id,
            'اسم الطالب': `${student.firstName} ${student.lastName}`,
            'البريد الإلكتروني': student.email || '',
            'رقم الهاتف': student.phone || '',
            'الجنسية': student.nationality || '',
            'الفرع الدراسي': student.academicBranch === 'scientific' ? 'علمي' : 'أدبي',
            'المنهاج': student.curriculumType === 'governmental' ? 'حكومي' : 'أزهري',
            'الفوج المسجل به': c.name,
            'كود الفوج': c.code,
            'حالة التسجيل': e.status,
            'آخر تسجيل دخول': student.lastLoginAt ? new Date(student.lastLoginAt).toISOString() : 'لم يسجل الدخول بعد',
            'حالة النشاط / الخمول': getActivityStatusText(student.lastLoginAt, student.createdAt),
            'تاريخ التسجيل': e.enrolledAt ? new Date(e.enrolledAt).toISOString() : ''
          });
        }
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), 'طلبة مادة التخصص');

    // Sheet 3: Teachers
    const teachersRows = teachers.map(t => ({
      'معرف الأستاذ': t.id,
      'الاسم الكامل': `أ. ${t.firstName} ${t.lastName}`,
      'البريد الإلكتروني': t.email || '',
      'رقم الهاتف': t.phone || '',
      'الجنسية': t.nationality || '',
      'الحالة': t.status,
      'آخر تسجيل دخول': t.lastLoginAt ? new Date(t.lastLoginAt).toISOString() : 'لم يسجل الدخول بعد',
      'حالة النشاط / الخمول': getActivityStatusText(t.lastLoginAt, t.createdAt),
      'تاريخ الانضمام': t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teachersRows), 'كادر أساتذة المادة');

    // Sheet 4: Sessions
    const sessionsRows = sessions.map(s => ({
      'معرف الحصة': s.id,
      'عنوان الحصة': s.title,
      'الفوج الدراسي': s.cohort?.name || '',
      'الأستاذ': s.teacher ? `أ. ${s.teacher.firstName} ${s.teacher.lastName}` : '',
      'وقت البدء': s.scheduledStartTime ? new Date(s.scheduledStartTime).toISOString() : '',
      'وقت الانتهاء': s.scheduledEndTime ? new Date(s.scheduledEndTime).toISOString() : '',
      'الحالة': s.status
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionsRows), 'حصص وجدول المادة');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const subCode = subject?.code || 'SUBJECT';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="baaqoon_${subCode}_backup_${Date.now()}.xlsx"`);
    res.end(buffer);
  }

  @Get('admin/stats')
  async getAdminStats() {
    const teachers = await this.prisma.user.count({
      where: {
        OR: [
          { primaryRole: 'teacher' },
          { roles: { some: { role: 'teacher' } } }
        ]
      }
    });
    const students = await this.prisma.user.count({ where: { primaryRole: 'student' } });
    const supervisors = await this.prisma.user.count({
      where: {
        OR: [
          { primaryRole: 'subject_supervisor' },
          { roles: { some: { role: 'subject_supervisor' } } }
        ]
      }
    });
    const cohorts = await this.prisma.cohort.count();
    const activeSessions = await this.prisma.session.count({ where: { status: 'scheduled' } });
    const pendingUsers = await this.prisma.user.count({ where: { status: 'pending' } });

    const recentCohorts = await this.prisma.cohort.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        instructors: true,
        enrollments: true
      }
    });

    for (const cohort of recentCohorts) {
      for (const instructor of cohort.instructors) {
        const teacher = await this.prisma.user.findUnique({ where: { id: instructor.teacherId }, select: { firstName: true, lastName: true } });
        (instructor as any).teacher = teacher;
      }
    }

    return {
      stats: { teachers, students, supervisors, cohorts, activeSessions, pendingUsers },
      recentCohorts
    };
  }

  @Get('supervisor/hr')
  async getSupervisorHR(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const role = user?.primaryRole;
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(role || '');
    
    let subjectFilter: any = {};
    let supervisorSubjectIds: string[] = [];
    if (isSupervisor) {
      supervisorSubjectIds = await this.getSupervisorSubjectIds(user?.id, user?.supervisedSubjectId);
      if (supervisorSubjectIds.length > 0) {
        subjectFilter = { subjectId: { in: supervisorSubjectIds } };
      } else {
        return { teachers: [], students: [] };
      }
    }

    const courses = await this.prisma.course.findMany({
      where: subjectFilter,
      select: { id: true }
    });
    const courseIds = courses.map(c => c.id);

    const cohorts = await this.prisma.cohort.findMany({
      where: isSupervisor ? { courseId: { in: courseIds } } : (courseIds.length > 0 ? { courseId: { in: courseIds } } : {}),
      select: { id: true }
    });
    const cohortIds = cohorts.map(c => c.id);

    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { teacherId: true }
    });
    const cohortTeacherIds = instructors.map(i => i.teacherId);

    let supervisorSubjectUserIds: string[] = [];
    if (isSupervisor && supervisorSubjectIds.length > 0) {
      try {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT user_id FROM users.supervisor_subjects WHERE subject_id = ANY($1::uuid[])`,
          supervisorSubjectIds
        );
        supervisorSubjectUserIds = rows.map(r => r.user_id);
      } catch (_) {}
    }

    const roleCondition = {
      OR: [
        { primaryRole: { in: ['teacher', 'subject_supervisor'] as any } },
        { roles: { some: { role: { in: ['teacher', 'subject_supervisor'] as any } } } }
      ]
    };

    let teacherWhere: any = {
      ...roleCondition
    };
    if (isSupervisor && supervisorSubjectIds.length > 0) {
      teacherWhere = {
        AND: [
          roleCondition,
          {
            OR: [
              { supervisedSubjectId: { in: supervisorSubjectIds } },
              ...(supervisorSubjectUserIds.length > 0 ? [{ id: { in: supervisorSubjectUserIds } }] : []),
              {
                AND: [
                  { id: { in: cohortTeacherIds } },
                  { supervisedSubjectId: null }
                ]
              }
            ]
          }
        ]
      };
    }

    const teachers = await this.prisma.user.findMany({
      where: teacherWhere,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    const students = await this.prisma.user.findMany({
      where: { primaryRole: 'student' },
      orderBy: { firstName: 'asc' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    return { teachers, students };
  }

  @Get('supervisor/stats')
  async getSupervisorStats(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const userId = req.user.id || req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const role = user?.primaryRole;
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(role || '');
    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(user?.id, user?.supervisedSubjectId) : [];
    
    let subjectFilter: any = {};
    let supervisedSubject = null;

    if (isSupervisor) {
      if (supervisorSubjectIds.length === 0) {
        return {
          supervisedSubject: null,
          totalCohorts: 0,
          totalStudents: 0,
          totalTeachers: 0,
          recentAssessments: []
        };
      }

      const activeSubjectId = (querySubjectId && supervisorSubjectIds.includes(querySubjectId))
        ? querySubjectId
        : (user?.supervisedSubjectId || supervisorSubjectIds[0]);

      if (querySubjectId && supervisorSubjectIds.includes(querySubjectId)) {
        subjectFilter = { subjectId: querySubjectId };
      } else {
        subjectFilter = { subjectId: { in: supervisorSubjectIds } };
      }
      supervisedSubject = await this.prisma.subject.findUnique({ where: { id: activeSubjectId } });
    }

    const courses = await this.prisma.course.findMany({
      where: subjectFilter,
      select: { id: true }
    });
    const courseIds = courses.map(c => c.id);

    const totalCohorts = await this.prisma.cohort.count({
      where: isSupervisor ? { courseId: { in: courseIds } } : (courseIds.length > 0 ? { courseId: { in: courseIds } } : undefined)
    });
    
    const cohorts = await this.prisma.cohort.findMany({
      where: isSupervisor ? { courseId: { in: courseIds } } : (courseIds.length > 0 ? { courseId: { in: courseIds } } : undefined),
      select: { id: true }
    });
    const cohortIds = cohorts.map(c => c.id);

    const totalStudents = await this.prisma.user.count({ where: { primaryRole: 'student' } });
    
    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { teacherId: true }
    });
    const cohortTeacherIds = instructors.map(i => i.teacherId);

    let totalTeachers = 0;
    if (isSupervisor && supervisorSubjectIds.length > 0) {
      let assignedUserIds: string[] = [];
      try {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT user_id FROM users.supervisor_subjects WHERE subject_id = ANY($1::uuid[])`,
          supervisorSubjectIds
        );
        assignedUserIds = rows.map(r => r.user_id);
      } catch (_) {}

      const subjectTeachers = await this.prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { primaryRole: { in: ['teacher', 'subject_supervisor'] as any } },
                { roles: { some: { role: { in: ['teacher', 'subject_supervisor'] as any } } } }
              ]
            },
            {
              OR: [
                { supervisedSubjectId: { in: supervisorSubjectIds } },
                ...(assignedUserIds.length > 0 ? [{ id: { in: assignedUserIds } }] : [])
              ]
            }
          ]
        },
        select: { id: true }
      });
      totalTeachers = new Set([...subjectTeachers.map(t => t.id), ...cohortTeacherIds]).size;
    } else {
      totalTeachers = await this.prisma.user.count({
        where: {
          OR: [
            { primaryRole: { in: ['teacher', 'subject_supervisor'] as any } },
            { roles: { some: { role: { in: ['teacher', 'subject_supervisor'] as any } } } }
          ]
        }
      });
    }

    const recentAssessments = await this.prisma.assessment.findMany({
      where: { cohortId: { in: cohortIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { cohort: true }
    });

    let allSubjects: any[] = [];
    if (isSupervisor && supervisorSubjectIds.length > 0) {
      allSubjects = await this.prisma.subject.findMany({
        where: { id: { in: supervisorSubjectIds } },
        select: { id: true, nameAr: true, code: true, iconUrl: true }
      });
    }

    return {
      supervisedSubject,
      allSubjects,
      totalCohorts,
      totalStudents,
      totalTeachers,
      recentAssessments
    };
  }

  @Get('supervisor/subject-teachers')
  async getSupervisorSubjectTeachers(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const userId = req.user?.id || req.user?.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }
    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);

    // Ensure database tables exist
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users.teacher_evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supervisor_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          evaluation_type VARCHAR(100) NOT NULL DEFAULT 'survey',
          title VARCHAR(200) NOT NULL,
          syllabus_adherence_score INT NOT NULL DEFAULT 5,
          pedagogical_quality_score INT NOT NULL DEFAULT 5,
          student_interaction_score INT NOT NULL DEFAULT 5,
          assessment_quality_score INT NOT NULL DEFAULT 5,
          tech_platform_use_score INT NOT NULL DEFAULT 5,
          overall_score DECIMAL(5,2) NOT NULL DEFAULT 100,
          notes TEXT,
          recommendations TEXT,
          action_plan TEXT,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS users.teacher_clarifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supervisor_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL DEFAULT 'clarification',
          title VARCHAR(200) NOT NULL,
          content TEXT NOT NULL,
          teacher_reply TEXT,
          teacher_replied_at TIMESTAMPTZ(6),
          is_urgent BOOLEAN NOT NULL DEFAULT false,
          status VARCHAR(32) NOT NULL DEFAULT 'sent',
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
        );
      `);
    } catch (_) {}

    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(user.id, user.supervisedSubjectId) : [];

    let allSubjects = await this.prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
      select: { id: true, nameAr: true, code: true, iconUrl: true }
    });

    if (isSupervisor && supervisorSubjectIds.length > 0) {
      allSubjects = allSubjects.filter(s => supervisorSubjectIds.includes(s.id));
    }

    let activeSubjectId: string | null = null;
    if (isSupervisor) {
      if (querySubjectId && supervisorSubjectIds.includes(querySubjectId)) {
        activeSubjectId = querySubjectId;
      } else if (user.supervisedSubjectId && supervisorSubjectIds.includes(user.supervisedSubjectId)) {
        activeSubjectId = user.supervisedSubjectId;
      } else {
        activeSubjectId = supervisorSubjectIds[0] || (allSubjects[0]?.id || null);
      }
    } else {
      activeSubjectId = querySubjectId || user.supervisedSubjectId || (allSubjects[0]?.id || null);
    }

    let subjectInfo = null;
    if (activeSubjectId) {
      subjectInfo = await this.prisma.subject.findUnique({
        where: { id: activeSubjectId },
        select: { id: true, nameAr: true, code: true, iconUrl: true }
      });
    }

    let subjectCohortIds: string[] = [];
    if (activeSubjectId) {
      const courses = await this.prisma.course.findMany({
        where: { subjectId: activeSubjectId },
        select: { id: true }
      });
      const cohorts = await this.prisma.cohort.findMany({
        where: { courseId: { in: courses.map(c => c.id) } },
        select: { id: true }
      });
      subjectCohortIds = cohorts.map(c => c.id);
    }

    const cohortInstructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: subjectCohortIds } },
      select: { teacherId: true }
    });
    const instructorTeacherIds = cohortInstructors.map(ci => ci.teacherId);

    let supervisorSubjectUserIds: string[] = [];
    if (activeSubjectId) {
      try {
        const assignedUsers: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT user_id FROM users.supervisor_subjects WHERE subject_id = $1::uuid`,
          activeSubjectId
        );
        supervisorSubjectUserIds = assignedUsers.map(r => r.user_id);
      } catch (_) {}
    }

    const roleCondition = {
      OR: [
        { primaryRole: { in: ['teacher', 'subject_supervisor'] as any } },
        { roles: { some: { role: { in: ['teacher', 'subject_supervisor'] as any } } } }
      ]
    };

    let teacherWhere: any = {
      ...roleCondition
    };
    if (activeSubjectId) {
      teacherWhere = {
        AND: [
          roleCondition,
          {
            OR: [
              { supervisedSubjectId: activeSubjectId },
              ...(supervisorSubjectUserIds.length > 0 ? [{ id: { in: supervisorSubjectUserIds } }] : []),
              {
                AND: [
                  { id: { in: instructorTeacherIds } },
                  { supervisedSubjectId: null }
                ]
              }
            ]
          }
        ]
      };
    }

    const teachers = await this.prisma.user.findMany({
      where: teacherWhere,
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        nationality: true,
        academicBranch: true,
        curriculumType: true,
        gradeLevel: true,
        primaryRole: true,
        roles: { select: { role: true } },
        status: true,
        createdAt: true,
        lastLoginAt: true,
        supervisedSubjectId: true,
        supervisedSubject: {
          select: { id: true, nameAr: true, code: true }
        }
      }
    });

    const teachersWithDetails = await Promise.all(teachers.map(async (t) => {
      const myCohortInstructors = await this.prisma.cohortInstructor.findMany({
        where: {
          teacherId: t.id,
          ...(activeSubjectId && subjectCohortIds.length > 0 ? { cohortId: { in: subjectCohortIds } } : {})
        },
        include: {
          cohort: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
              enrollments: { select: { id: true } }
            }
          }
        }
      });
      const cohortsTaught = myCohortInstructors.map(ci => ({
        id: ci.cohort.id,
        name: ci.cohort.name,
        code: ci.cohort.code,
        status: ci.cohort.status,
        studentsCount: ci.cohort.enrollments.length
      }));

      const teacherSessions = await this.prisma.session.findMany({
        where: {
          teacherId: t.id,
          ...(activeSubjectId && subjectCohortIds.length > 0 ? { cohortId: { in: subjectCohortIds } } : {})
        },
        select: { id: true, status: true, scheduledStartTime: true }
      });
      const totalSessions = teacherSessions.length;
      const completedSessions = teacherSessions.filter(s => s.status === 'completed').length;
      const scheduledSessions = teacherSessions.filter(s => s.status === 'scheduled').length;
      const cancelledSessions = teacherSessions.filter(s => s.status === 'cancelled').length;

      const sessionIds = teacherSessions.map(s => s.id);
      let attendanceRate = 100;
      if (sessionIds.length > 0) {
        const totalAttendances = await this.prisma.sessionAttendance.count({
          where: { sessionId: { in: sessionIds } }
        });
        if (totalAttendances > 0) {
          const presentAttendances = await this.prisma.sessionAttendance.count({
            where: { sessionId: { in: sessionIds }, status: 'present' }
          });
          attendanceRate = Math.round((presentAttendances / totalAttendances) * 100);
        }
      }

      const createdAssessmentsCount = await this.prisma.assessment.count({
        where: { createdById: t.id }
      });
      const gradedSubmissionsCount = await this.prisma.assessmentSubmission.count({
        where: { gradedById: t.id }
      });

      let evaluations: any[] = [];
      try {
        evaluations = await this.prisma.$queryRawUnsafe(`
          SELECT e.id, e.title, e.evaluation_type AS "evaluationType",
                 e.syllabus_adherence_score AS "syllabusAdherenceScore",
                 e.pedagogical_quality_score AS "pedagogicalQualityScore",
                 e.student_interaction_score AS "studentInteractionScore",
                 e.assessment_quality_score AS "assessmentQualityScore",
                 e.tech_platform_use_score AS "techPlatformUseScore",
                 e.overall_score AS "overallScore",
                 e.notes, e.recommendations, e.action_plan AS "actionPlan",
                 e.created_at AS "createdAt",
                 u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
          FROM users.teacher_evaluations e
          LEFT JOIN users.users u ON u.id = e.supervisor_id
          WHERE e.teacher_id = $1::uuid
          ORDER BY e.created_at DESC
        `, t.id);
      } catch (_) {}

      const avgScore = evaluations.length > 0
        ? Math.round(evaluations.reduce((acc, curr) => acc + Number(curr.overallScore || 0), 0) / evaluations.length)
        : null;

      let clarifications: any[] = [];
      try {
        clarifications = await this.prisma.$queryRawUnsafe(`
          SELECT c.id, c.type, c.title, c.content,
                 c.teacher_reply AS "teacherReply",
                 c.teacher_replied_at AS "teacherRepliedAt",
                 c.is_urgent AS "isUrgent",
                 c.status,
                 c.created_at AS "createdAt",
                 u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
          FROM users.teacher_clarifications c
          LEFT JOIN users.users u ON u.id = c.supervisor_id
          WHERE c.teacher_id = $1::uuid
          ORDER BY c.created_at DESC
        `, t.id);
      } catch (_) {}

      return {
        ...t,
        cohortsTaught,
        totalCohorts: cohortsTaught.length,
        metrics: {
          totalSessions,
          completedSessions,
          scheduledSessions,
          cancelledSessions,
          attendanceRate,
          createdAssessmentsCount,
          gradedSubmissionsCount,
          evaluationScore: avgScore,
          evaluationsCount: evaluations.length,
          clarificationsCount: clarifications.length
        },
        recentEvaluations: evaluations.slice(0, 5),
        recentClarifications: clarifications.slice(0, 5)
      };
    }));

    return {
      activeSubject: subjectInfo,
      allSubjects,
      teachers: teachersWithDetails,
      totalCount: teachersWithDetails.length
    };
  }

  @Post('supervisor/teachers/:teacherId/evaluations')
  async createSupervisorEvaluation(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
    @Body() body: any
  ) {
    const supervisorId = req.user?.id || req.user?.userId;
    const {
      evaluationType = 'survey',
      title,
      syllabusAdherenceScore = 5,
      pedagogicalQualityScore = 5,
      studentInteractionScore = 5,
      assessmentQualityScore = 5,
      techPlatformUseScore = 5,
      notes = '',
      recommendations = '',
      actionPlan = ''
    } = body;

    const overallScore = Math.round(
      ((Number(syllabusAdherenceScore) +
        Number(pedagogicalQualityScore) +
        Number(studentInteractionScore) +
        Number(assessmentQualityScore) +
        Number(techPlatformUseScore)) / 25) * 100
    );

    const result = await this.prisma.$queryRawUnsafe(`
      INSERT INTO users.teacher_evaluations (
        supervisor_id, teacher_id, evaluation_type, title,
        syllabus_adherence_score, pedagogical_quality_score,
        student_interaction_score, assessment_quality_score,
        tech_platform_use_score, overall_score, notes, recommendations, action_plan
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING id, title, created_at AS "createdAt"
    `, supervisorId, teacherId, evaluationType, title || 'استبيان تقييم أداء الأستاذ',
       Number(syllabusAdherenceScore), Number(pedagogicalQualityScore), Number(studentInteractionScore),
       Number(assessmentQualityScore), Number(techPlatformUseScore), overallScore, notes, recommendations, actionPlan
    );

    try {
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `استبيان تقييم إشرافي جديد: ${title || 'تقييم الأداء والمرافقة'}`,
          body: `قام المشرف المنسق بتسجيل استبيان تقييم إشرافي لك بنتيجة ${overallScore}%. التوصيات: ${recommendations || 'متابعة طيبة'}`,
          type: 'system',
          actionUrl: '/teacher/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, result, overallScore };
  }

  @Get('supervisor/teachers/:teacherId/evaluations')
  async getSupervisorTeacherEvaluations(@Param('teacherId') teacherId: string) {
    return this.prisma.$queryRawUnsafe(`
      SELECT e.id, e.title, e.evaluation_type AS "evaluationType",
             e.syllabus_adherence_score AS "syllabusAdherenceScore",
             e.pedagogical_quality_score AS "pedagogicalQualityScore",
             e.student_interaction_score AS "studentInteractionScore",
             e.assessment_quality_score AS "assessmentQualityScore",
             e.tech_platform_use_score AS "techPlatformUseScore",
             e.overall_score AS "overallScore",
             e.notes, e.recommendations, e.action_plan AS "actionPlan",
             e.created_at AS "createdAt",
             u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
          FROM users.teacher_evaluations e
          LEFT JOIN users.users u ON u.id = e.supervisor_id
          WHERE e.teacher_id = $1::uuid
          ORDER BY e.created_at DESC
    `, teacherId);
  }

  @Post('supervisor/teachers/:teacherId/clarifications')
  async createSupervisorClarification(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
    @Body() body: any
  ) {
    const supervisorId = req.user?.id || req.user?.userId;
    const { type = 'clarification', title, content, isUrgent = false } = body;

    const result = await this.prisma.$queryRawUnsafe(`
      INSERT INTO users.teacher_clarifications (
        supervisor_id, teacher_id, type, title, content, is_urgent, status
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6, 'sent'
      ) RETURNING id, title, created_at AS "createdAt"
    `, supervisorId, teacherId, type, title || 'توضيح واستفسار إشرافي', content, isUrgent);

    try {
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `رسالة/توضيح جديد من المشرف: ${title}`,
          body: content,
          type: 'system',
          actionUrl: '/teacher/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, result };
  }

  @Get('supervisor/teachers/:teacherId/clarifications')
  async getSupervisorTeacherClarifications(@Param('teacherId') teacherId: string) {
    return this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.type, c.title, c.content,
             c.teacher_reply AS "teacherReply",
             c.teacher_replied_at AS "teacherRepliedAt",
             c.is_urgent AS "isUrgent",
             c.status,
             c.created_at AS "createdAt",
             u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
      FROM users.teacher_clarifications c
      LEFT JOIN users.users u ON u.id = c.supervisor_id
      WHERE c.teacher_id = $1::uuid
      ORDER BY c.created_at DESC
    `, teacherId);
  }

  @Patch('supervisor/set-subject')
  async updateSupervisorSubject(@Req() req: any, @Body() body: { subjectId: string }) {
    const userId = req.user?.id || req.user?.userId;
    const { subjectId } = body;
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO users.supervisor_subjects (user_id, subject_id)
        VALUES ($1::uuid, $2::uuid)
        ON CONFLICT (user_id, subject_id) DO NOTHING
      `, userId, subjectId);
    } catch (_) {}
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { supervisedSubjectId: subjectId },
      include: { supervisedSubject: true }
    });
    return updated;
  }

  @Get('cohorts/me')
  async getMyCohorts(@Req() req: any, @Query('mode') mode?: string) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    const role = req.user?.primaryRole || 'teacher';
    const rawRoles = req.user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.role)) || [];
    const hasTeacherRole = role === 'teacher' || rawRoles.includes('teacher');

    let whereClause: any = {};
    if (mode === 'teacher' || role === 'teacher') {
      whereClause = { instructors: { some: { teacherId: userId } } };
    } else if (role === 'subject_supervisor' || role === 'supervisor') {
      // If dual-role supervisor is teaching cohorts and didn't explicitly ask for supervisor mode, check their taught cohorts first
      if (hasTeacherRole && mode !== 'supervisor') {
        const taughtCount = await this.prisma.cohort.count({
          where: { instructors: { some: { teacherId: userId } } }
        });
        if (taughtCount > 0) {
          return this.prisma.cohort.findMany({
            where: { instructors: { some: { teacherId: userId } } },
            include: { enrollments: true }
          });
        }
      }
      const supervisorSubjectIds = await this.getSupervisorSubjectIds(userId);
      const courses = await this.prisma.course.findMany({
        where: supervisorSubjectIds.length > 0 ? { subjectId: { in: supervisorSubjectIds } } : {
          subject: {
            supervisors: { some: { id: userId } }
          }
        },
        select: { id: true }
      });
      const courseIds = courses.map(c => c.id);
      whereClause = { courseId: { in: courseIds } };
    } else if (role === 'super_admin' || role === 'admin') {
      whereClause = {}; // Admin gets all cohorts
    } else if (role === 'student') {
      whereClause = { enrollments: { some: { studentId: userId } } };
    }

    const cohorts = await this.prisma.cohort.findMany({
      where: whereClause,
      include: {
        enrollments: true
      }
    });

    const courseIds = Array.from(new Set(cohorts.map(c => c.courseId).filter(Boolean)));
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: { subject: { select: { id: true, nameAr: true, code: true } } }
    });
    const courseMap = new Map(courses.map(c => [c.id, c]));

    return cohorts.map(cohort => ({
      ...cohort,
      course: courseMap.get(cohort.courseId) || null,
      subjectName: courseMap.get(cohort.courseId)?.subject?.nameAr || null
    }));
  }

  @Get('student/subjects-and-cohorts')
  async getStudentSubjectsAndCohorts(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, academicBranch: true, gradeLevel: true, curriculumType: true }
    });

    if (!user) throw new UnauthorizedException();

    const branch = user.academicBranch || 'scientific';
    const grade = user.gradeLevel || 'grade_11';
    const curriculum = user.curriculumType || 'governmental';

    // Also include any courses where the student is actively enrolled (even as an exception from another branch)
    const extraEnrollments = await this.prisma.cohortEnrollment.findMany({
      where: { studentId: userId, status: 'enrolled' as any },
      select: { cohort: { select: { courseId: true } } }
    });
    const extraCourseIds = extraEnrollments.map(e => e.cohort.courseId).filter(Boolean);

    const courses = await this.prisma.course.findMany({
      where: {
        OR: [
          {
            academicBranch: branch as any,
            gradeLevel: grade as any,
            curriculumType: curriculum as any,
            isActive: true
          },
          ...(extraCourseIds.length > 0 ? [{ id: { in: extraCourseIds } }] : [])
        ]
      },
      include: {
        subject: {
          select: { id: true, nameAr: true, code: true, iconUrl: true }
        }
      }
    });

    const courseIds = courses.map(c => c.id);
    const cohorts = await this.prisma.cohort.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'active'
      },
      include: {
        instructors: true,
        enrollments: {
          select: { studentId: true, status: true }
        }
      }
    });

    const subjectMap = new Map();
    for (const course of courses) {
      const subject = course.subject;
      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subjectId: subject.id,
          subjectName: subject.nameAr,
          subjectCode: subject.code,
          courseId: course.id,
          courseTitle: course.title,
          cohorts: []
        });
      }
    }

    for (const cohort of cohorts) {
      const course = courses.find(c => c.id === cohort.courseId);
      if (!course) continue;
      const sub = subjectMap.get(course.subjectId);
      if (sub) {
        const isEnrolled = cohort.enrollments.some(e => e.studentId === userId);
        const enrolledCount = cohort.enrollments.length;
        const maxCapacity = cohort.maxStudents || 25;
        const isFull = enrolledCount >= maxCapacity;

        sub.cohorts.push({
          id: cohort.id,
          name: cohort.name,
          code: cohort.code,
          enrolledCount,
          maxCapacity,
          availableSeats: Math.max(0, maxCapacity - enrolledCount),
          isFull,
          isEnrolled
        });
      }
    }

    return Array.from(subjectMap.values()).map(sub => {
      const enrolledCohort = sub.cohorts.find((c: any) => c.isEnrolled);
      const vacantCohort = sub.cohorts.find((c: any) => !c.isFull);
      return {
        ...sub,
        isEnrolledInSubject: !!enrolledCohort,
        enrolledCohortName: enrolledCohort?.name || null,
        enrolledCohortId: enrolledCohort?.id || null,
        suggestedCohortId: vacantCohort?.id || (sub.cohorts[0]?.id || null)
      };
    });
  }

  @Post('student/enroll-all-branch-cohorts')
  async enrollAllBranchCohorts(@Req() req: any, @Body() body?: { studentId?: string }) {
    const targetUserId = body?.studentId || req.user?.id || req.user?.userId;
    const student = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, academicBranch: true, gradeLevel: true, curriculumType: true, firstName: true }
    });
    if (!student) throw new BadRequestException('المستخدم غير موجود');

    const branch = student.academicBranch || 'scientific';
    const grade = student.gradeLevel || 'grade_11';
    const curriculum = student.curriculumType || 'governmental';

    const courses = await this.prisma.course.findMany({
      where: {
        academicBranch: branch as any,
        gradeLevel: grade as any,
        curriculumType: curriculum as any,
        isActive: true
      },
      select: { id: true, subjectId: true, title: true }
    });

    let enrolledCount = 0;
    const enrolledSubjects: string[] = [];

    for (const course of courses) {
      const existingEnrollment = await this.prisma.cohortEnrollment.findFirst({
        where: {
          studentId: targetUserId,
          cohort: { courseId: course.id }
        }
      });

      if (!existingEnrollment) {
        const availableCohort = await this.prisma.cohort.findFirst({
          where: {
            courseId: course.id,
            status: 'active'
          },
          include: { enrollments: true },
          orderBy: { createdAt: 'asc' }
        });

        if (availableCohort && availableCohort.enrollments.length < (availableCohort.maxStudents || 30)) {
          await this.prisma.cohortEnrollment.create({
            data: {
              cohortId: availableCohort.id,
              studentId: targetUserId,
              status: 'enrolled' as any
            }
          });
          enrolledCount++;
          enrolledSubjects.push(course.title);
        }
      }
    }

    return {
      success: true,
      enrolledCount,
      enrolledSubjects,
      message: enrolledCount > 0 
        ? `تم تفويج الطالب بنجاح في ${enrolledCount} مادة دراسية جديدة (${enrolledSubjects.join('، ')})` 
        : 'أنت مفوّج بالفعل في جميع المواد الدراسية المتاحة لفرعك الدراسي.'
    };
  }

  @Post('student/enroll-cohort/:cohortId')
  async enrollSingleCohort(@Req() req: any, @Param('cohortId') cohortId: string) {
    const studentId = req.user?.id || req.user?.userId;
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: { enrollments: true }
    });
    if (!cohort) throw new NotFoundException('الفوج غير موجود');

    const maxCapacity = cohort.maxStudents || 30;
    if (cohort.enrollments.length >= maxCapacity) {
      throw new BadRequestException('الفوج مكتمل السعة حالياً');
    }

    const existing = await this.prisma.cohortEnrollment.findFirst({
      where: { cohortId, studentId }
    });
    if (existing) {
      return { success: true, message: 'أنت مسجل بالفعل في هذا الفوج' };
    }

    await this.prisma.cohortEnrollment.create({
      data: {
        cohortId,
        studentId,
        status: 'enrolled' as any
      }
    });

    return { success: true, message: `تم انضمامك بنجاح إلى فوج «${cohort.name}»!` };
  }

  @Get('student/available-exception-courses')
  async getAvailableExceptionCourses(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { academicBranch: true, gradeLevel: true, curriculumType: true }
    });
    if (!user) throw new UnauthorizedException();

    const otherBranch = user.academicBranch === 'scientific' ? 'literary' : 'scientific';
    const courses = await this.prisma.course.findMany({
      where: {
        academicBranch: otherBranch as any,
        isActive: true
      },
      include: {
        subject: { select: { id: true, nameAr: true, code: true, iconUrl: true } }
      },
      orderBy: { title: 'asc' }
    });
    return courses;
  }

  @Post('student/request-exception-course')
  async requestExceptionCourse(
    @Req() req: any,
    @Body() body: { courseId: string; reason?: string }
  ) {
    const userId = req.user?.id || req.user?.userId;
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, academicBranch: true }
    });
    if (!student) throw new UnauthorizedException();

    const course = await this.prisma.course.findUnique({
      where: { id: body.courseId },
      include: { subject: true }
    });
    if (!course) throw new NotFoundException('المقرر المطلوب غير موجود');

    // Find supervisors of this subject or admins
    const supervisors = await this.prisma.user.findMany({
      where: {
        OR: [
          { primaryRole: { in: ['admin', 'super_admin'] as any } },
          { supervisedSubjectId: course.subjectId }
        ],
        status: 'active'
      },
      select: { id: true }
    });

    const studentBranchLabel = student.academicBranch === 'scientific' ? 'علمي' : 'أدبي';
    const notifBody = `الطالب «${student.firstName} ${student.lastName}» (فرع: ${studentBranchLabel}) يرغب بالانضمام استثنائياً لمقرر «${course.title || course.subject.nameAr}». السبب: ${body.reason || 'رغبة خاصة في دراسة المادة'}`;

    for (const sup of supervisors) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: sup.id,
            title: `طلب استثناء أكاديمي: ${course.subject.nameAr}`,
            body: notifBody,
            type: 'enrollment',
            actionUrl: '/supervisor/cohorts'
          }
        });
      } catch (_) {}
    }

    return {
      success: true,
      message: 'تم إرسال طلبك الاستثنائي بنجاح إلى إدارة ومشرف المادة لمراجعته واعتماده!'
    };
  }

  @Get('supervisor/progress')
  async getSupervisorProgress(@Req() req: any) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
      const role = user?.primaryRole;
      const isSupervisor = ['subject_supervisor', 'supervisor'].includes(role || '');
      
      let subjectFilter: any = {};
      if (isSupervisor) {
        const supervisorSubjectIds = await this.getSupervisorSubjectIds(user?.id, user?.supervisedSubjectId);
        if (supervisorSubjectIds.length === 0) return [];
        subjectFilter = { subjectId: { in: supervisorSubjectIds } };
      } else if (role !== 'admin' && role !== 'super_admin') {
        return { error: 'Unauthorized' };
      }

      const courses = await this.prisma.course.findMany({
        where: subjectFilter,
        select: { id: true }
      });
      const courseIds = courses.map(c => c.id);

      if (isSupervisor && courseIds.length === 0) {
        return [];
      }

      const cohorts = await this.prisma.cohort.findMany({
        where: isSupervisor ? { courseId: { in: courseIds } } : (courseIds.length > 0 ? { courseId: { in: courseIds } } : {}),
        include: {
          instructors: true,
          sessions: {
            where: { lessonId: { not: null } }
          }
        }
      });

      const results = [];
      for (const cohort of cohorts) {
        const curriculumVersion = await this.prisma.curriculumVersion.findUnique({
          where: { id: cohort.curriculumVersionId },
          include: { units: { include: { lessons: true } } }
        });
        
        let totalLessons = 0;
        if (curriculumVersion) {
          curriculumVersion.units.forEach((u: any) => totalLessons += u.lessons.length);
        }

        const completedLessons = new Set(
          cohort.sessions
            .filter((s: any) => s.status === 'completed' || new Date(s.scheduledEndTime || s.scheduledStartTime) < new Date())
            .map((s: any) => s.lessonId)
        ).size;

        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        let teacherName = 'غير محدد';
        if (cohort.instructors.length > 0) {
          const teacher = await this.prisma.user.findUnique({
            where: { id: cohort.instructors[0].teacherId },
            select: { firstName: true, lastName: true }
          });
          if (teacher) {
            teacherName = `${teacher.firstName} ${teacher.lastName}`;
          }
        }

        results.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          teacherName,
          totalLessons,
          completedLessons,
          percentage
        });
      }

      return results;
    } catch (error) {
      console.error('Error in getSupervisorProgress:', error);
      throw error;
    }
  }

  @Post('cohorts')
  async createCohort(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    const { name, code, courseId, curriculumVersionId, studentIds, teacherId } = body;

    const assignedTeacherId = teacherId || userId;

    const cohort = await this.prisma.cohort.create({
      data: {
        name,
        code,
        courseId,
        curriculumVersionId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdById: userId,
        instructors: {
          create: [{ teacherId: assignedTeacherId, role: 'primary_teacher' }]
        }
      }
    });

    if (studentIds && studentIds.length > 0) {
      await this.prisma.cohortEnrollment.createMany({
        data: studentIds.map((id: string) => ({
          cohortId: cohort.id,
          studentId: id,
          status: 'active'
        }))
      });
    }

    return cohort;
  }
  @Get('cohorts/:id/progress')
  async getCohortProgress(@Param('id') id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { lessonId: { not: null } }
        }
      }
    });

    if (!cohort) return { units: [] };

    let curriculumVersion = cohort.curriculumVersionId ? await this.prisma.curriculumVersion.findUnique({
      where: { id: cohort.curriculumVersionId },
      include: {
        units: {
          include: {
            lessons: { orderBy: { orderIndex: 'asc' } }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    }) : null;

    // Self-healing fallback: if version is missing or has 0 units, find published version for the subject
    if (!curriculumVersion || curriculumVersion.units.length === 0) {
      if (cohort.courseId) {
        const course = await this.prisma.course.findUnique({ where: { id: cohort.courseId } });
        if (course?.subjectId) {
          const fallback = await this.prisma.curriculumVersion.findFirst({
            where: {
              course: { subjectId: course.subjectId },
              units: { some: {} }
            },
            include: {
              units: {
                include: {
                  lessons: { orderBy: { orderIndex: 'asc' } }
                },
                orderBy: { orderIndex: 'asc' }
              }
            }
          });
          if (fallback && fallback.units.length > 0) {
            curriculumVersion = fallback;
          }
        }
      }
    }

    if (!curriculumVersion || curriculumVersion.units.length === 0) return { units: [] };

    // Calculate progress
    const completedLessonIds = new Set(
      cohort.sessions
        .filter(s => s.status === 'completed' || new Date(s.scheduledStartTime) < new Date())
        .map(s => s.lessonId)
    );

    const progress = curriculumVersion.units.map(unit => {
      const lessons = unit.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        isCompleted: completedLessonIds.has(lesson.id)
      }));
      const isFullyCompleted = lessons.length > 0 && lessons.every(l => l.isCompleted);
      const isPartiallyCompleted = lessons.some(l => l.isCompleted) && !isFullyCompleted;

      return {
        id: unit.id,
        title: unit.title,
        status: isFullyCompleted ? 'completed' : isPartiallyCompleted ? 'in_progress' : 'pending',
        lessons
      };
    });

    return { 
      cohortId: cohort.id,
      cohortName: cohort.name,
      units: progress 
    };
  }

  @Get('cohorts/:id')
  async getCohortDetails(@Param('id') id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let cohort = isUuid ? await this.prisma.cohort.findUnique({
      where: { id },
      include: {
        enrollments: true,
        instructors: true,
        sessions: {
          orderBy: { scheduledStartTime: 'asc' },
          include: {
            attendances: true,
            lesson: { select: { id: true, title: true } }
          }
        }
      }
    }) : null;

    if (!cohort) {
      return { error: 'Cohort not found', cohort: null, students: [], sessions: [], assessments: [] };
    }

    const course = await this.prisma.course.findUnique({
      where: { id: cohort.courseId },
      include: { subject: true }
    });

    const instructorTeacherIds = cohort.instructors.map(i => i.teacherId);
    const teachers = await this.prisma.user.findMany({
      where: { id: { in: instructorTeacherIds } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    const studentIds = cohort.enrollments.map(e => e.studentId);
    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    const assessments = await this.prisma.assessment.findMany({
      where: { cohortId: cohort.id },
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: { select: { id: true, score: true, status: true } }
      }
    });

    const pastSessions = cohort.sessions.filter(s => s.status === 'completed' || new Date(s.scheduledStartTime) <= new Date());
    const pastSessionsCount = pastSessions.length;

    const studentStats = students.map(student => {
      const enrollment = cohort!.enrollments.find(e => e.studentId === student.id);
      
      const studentAttendances = cohort!.sessions.flatMap(s =>
        s.attendances.filter(a => a.studentId === student.id)
      );

      const presentCount = studentAttendances.filter(a =>
        a.status === 'present' || a.status === 'late' || a.status === 'absent_excused'
      ).length;

      let attendanceRate = 100;
      if (studentAttendances.length > 0) {
        attendanceRate = Math.round((presentCount / studentAttendances.length) * 100);
      } else if (pastSessionsCount > 0) {
        attendanceRate = 85;
      }

      let lastActivity = 'غير نشط';
      if (student.lastLoginAt) {
        const diffMs = Date.now() - new Date(student.lastLoginAt).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffHours < 1) lastActivity = 'الآن';
        else if (diffHours < 24) lastActivity = `قبل ${diffHours} ساعة`;
        else if (diffDays === 1) lastActivity = 'أمس';
        else lastActivity = `منذ ${diffDays} أيام`;
      } else if (student.createdAt) {
        lastActivity = 'اليوم';
      }

      const isActive = enrollment?.status === 'enrolled' || student.status === 'active';

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        status: isActive ? 'active' : 'pending',
        enrollmentStatus: enrollment?.status || 'enrolled',
        attendance: attendanceRate,
        attendedCount: presentCount,
        totalSessionsCount: cohort!.sessions.length,
        lastActivity,
        avatarUrl: student.avatarUrl
      };
    });

    const activeStudents = studentStats.filter(s => s.status === 'active');
    const avgAttendance = activeStudents.length > 0
      ? Math.round(activeStudents.reduce((acc, curr) => acc + curr.attendance, 0) / activeStudents.length)
      : 0;
    const atRiskStudents = activeStudents.filter(s => s.attendance < 70).length;
    const topStudents = [...activeStudents].sort((a, b) => b.attendance - a.attendance).slice(0, 3);

    return {
      cohort: {
        id: cohort.id,
        name: cohort.name,
        code: cohort.code,
        status: cohort.status,
        minStudents: cohort.minStudents,
        maxStudents: cohort.maxStudents,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        courseName: course?.title,
        subjectName: course?.subject?.nameAr,
        academicBranch: course?.academicBranch,
        instructors: teachers
      },
      students: studentStats,
      stats: {
        totalStudents: studentStats.length,
        activeStudentsCount: activeStudents.length,
        avgAttendance,
        atRiskStudentsCount: atRiskStudents,
        topStudents
      },
      sessions: cohort.sessions.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        scheduledStartTime: s.scheduledStartTime,
        scheduledEndTime: s.scheduledEndTime,
        jitsiRoomName: s.jitsiRoomName,
        lessonTitle: s.lesson?.title || s.title
      })),
      assessments: assessments.map(a => ({
        id: a.id,
        title: a.title,
        maxScore: a.maxScore,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        submissionsCount: a.submissions.length,
        gradedCount: a.submissions.filter(sub => sub.status === 'graded').length
      }))
    };
  }
  @Post('requests')
  async createCohortRequest(@Req() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.userId;
    return this.prisma.cohortRequest.create({
      data: {
        teacherId: userId,
        subjectId: body.subjectId,
        suggestedName: body.suggestedName,
        expectedStudents: parseInt(body.expectedStudents, 10),
        notes: body.notes,
        status: 'pending'
      }
    });
  }

  @Get('requests')
  async getCohortRequests(@Req() req: any) {
    const role = req.user?.primaryRole;
    const userId = req.user?.id || req.user?.userId;

    if (role === 'admin' || role === 'super_admin') {
      return this.prisma.cohortRequest.findMany({
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          subject: { select: { id: true, nameAr: true, code: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    const caller = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });
    const rawRoles = caller?.roles?.map(r => r.role as string) || [];
    const isSupervisor = role === 'subject_supervisor' || rawRoles.includes('subject_supervisor');
    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(caller?.id, caller?.supervisedSubjectId) : [];

    if (isSupervisor && supervisorSubjectIds.length > 0) {
      return this.prisma.cohortRequest.findMany({
        where: {
          OR: [
            { subjectId: { in: supervisorSubjectIds } },
            { teacherId: userId }
          ]
        },
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          subject: { select: { id: true, nameAr: true, code: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return this.prisma.cohortRequest.findMany({
      where: { teacherId: userId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, nameAr: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Patch('requests/:id/status')
  async updateCohortRequestStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      status: string;
      rejectionReason?: string;
      assignedTeacherId?: string;
      cohortName?: string;
      maxStudents?: number;
      studentIds?: string[];
    }
  ) {
    const callerId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';

    const request = await this.prisma.cohortRequest.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: {
          include: {
            courses: {
              where: { isActive: true },
              include: {
                versions: { where: { isDefault: true } }
              }
            }
          }
        }
      }
    });

    if (!request) {
      return { error: 'Request not found' };
    }

    if (body.status === 'rejected') {
      const updatedReq = await this.prisma.cohortRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: body.rejectionReason || 'تم رفض الطلب بناءً على التنسيق الإداري والأكاديمي'
        }
      });

      try {
        await this.prisma.notification.create({
          data: {
            userId: request.teacherId,
            title: 'تم رفض طلب فتح الفوج',
            body: `نعتذر، لم تتم الموافقة على طلب فتح فوج "${request.suggestedName}". السبب: ${body.rejectionReason || 'بناءً على توجيه الإدارة والتنسيق الأكاديمي.'}`,
            actionUrl: '/teacher/cohorts',
            type: 'system'
          }
        });
      } catch (_) {}

      return updatedReq;
    }

    if (body.status === 'approved') {
      // 1. Resolve course and curriculum version
      let course: any = request.subject.courses?.[0];
      if (!course) {
        course = await this.prisma.course.findFirst({
          where: { subjectId: request.subjectId },
          include: { versions: true }
        });
      }

      if (!course) {
        course = await this.prisma.course.create({
          data: {
            subjectId: request.subjectId,
            code: `${(request.subject.code || 'SUB').toUpperCase()}-AUTO-${Date.now().toString().slice(-4)}`,
            title: `منهاج ${request.subject.nameAr}`,
            slug: `course-${Date.now()}`,
            curriculumType: request.subject.curriculumType || 'governmental',
            academicBranch: 'scientific',
            gradeLevel: 'grade_11',
            academicYear: '2024-2025'
          },
          include: { versions: true }
        });
      }

      let versionId = course.versions?.[0]?.id;
      if (!versionId) {
        const newVersion = await this.prisma.curriculumVersion.create({
          data: {
            courseId: course.id,
            versionTag: 'v1.0',
            isDefault: true,
            status: 'published'
          }
        });
        versionId = newVersion.id;
      }

      // 2. The primary teacher: Defaults directly to the requesting teacher!
      const targetTeacherId = body.assignedTeacherId || request.teacherId;
      const finalCohortName = body.cohortName?.trim() || request.suggestedName;
      const finalMaxStudents = body.maxStudents || request.expectedStudents || 20;

      const cleanSubCode = (request.subject.code || 'COH').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const code = `COH-${cleanSubCode}-${Date.now().toString().slice(-4)}`;

      // 3. Create real cohort and assign teacher
      const cohort = await this.prisma.cohort.create({
        data: {
          name: finalCohortName,
          code,
          courseId: course.id,
          curriculumVersionId: versionId,
          status: 'active',
          minStudents: 3,
          maxStudents: finalMaxStudents,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdById: callerId,
          instructors: {
            create: [
              {
                teacherId: targetTeacherId,
                role: 'primary_teacher',
                assignedById: callerId
              }
            ]
          }
        }
      });

      // 4. Enroll any provided students
      if (body.studentIds && body.studentIds.length > 0) {
        await this.prisma.cohortEnrollment.createMany({
          data: body.studentIds.map(stId => ({
            cohortId: cohort.id,
            studentId: stId,
            status: 'enrolled'
          }))
        });
      }

      // 5. Update request status to approved
      const updatedReq = await this.prisma.cohortRequest.update({
        where: { id },
        data: {
          status: 'approved'
        }
      });

      // 6. Send congratulations and assignment notifications
      const isAssignedToRequester = targetTeacherId === request.teacherId;
      try {
        await this.prisma.notification.create({
          data: {
            userId: request.teacherId,
            title: 'تم قبول طلب فتح الفوج وإسناده لك رسمياً 🎉',
            body: isAssignedToRequester
              ? `تم اعتماد طلبك رسمياً وتأسيس فوج "${cohort.name}"، وتم إسناد الفوج إليك كأستاذ رئيسي للفوج. يمكنك الآن بدء جدولة الحصص ورصد الطلاب.`
              : `تم اعتماد طلبك وتأسيس فوج "${cohort.name}" بنجاح، وتم إسناد التدريس للأستاذ البديل بالتنسيق مع الإدارة.`,
            actionUrl: '/teacher/cohorts',
            type: 'system'
          }
        });

        if (!isAssignedToRequester) {
          await this.prisma.notification.create({
            data: {
              userId: targetTeacherId,
              title: 'إسناد فوج دراسي جديد إليك',
              body: `تم إسناد الفوج الجديد "${cohort.name}" في مادة ${request.subject.nameAr} إليك للتدريس.`,
              actionUrl: '/teacher/cohorts',
              type: 'system'
            }
          });
        }
      } catch (_) {}

      // 7. Activity Log
      try {
        await this.prisma.activityLog.create({
          data: {
            userId: callerId,
            action: 'APPROVE_COHORT_REQUEST',
            details: `الموافقة على طلب فتح الفوج "${cohort.name}" وإسناده للأستاذ المعني (${targetTeacherId})`
          }
        });
      } catch (_) {}

      return {
        ...updatedReq,
        cohort,
        assignedTeacherId: targetTeacherId,
        message: `تم فتح الفوج "${cohort.name}" بنجاح وإسناده للأستاذ`
      };
    }

    return this.prisma.cohortRequest.update({
      where: { id },
      data: { status: body.status as any }
    });
  }

  
  @Patch('cohorts/:id')
  async updateCohort(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const { name, code, teacherId, studentIds } = body;

    const cohort = await this.prisma.cohort.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
      }
    });

    if (teacherId) {
      const cohortData = await this.prisma.cohort.findUnique({
        where: { id },
        select: { courseId: true }
      });
      if (cohortData?.courseId) {
        const course = await this.prisma.course.findUnique({
          where: { id: cohortData.courseId },
          select: { subjectId: true }
        });
        const teacher = await this.prisma.user.findUnique({
          where: { id: teacherId },
          select: { supervisedSubjectId: true }
        });
        const teacherSubjects = await this.getSupervisorSubjectIds(teacherId, teacher?.supervisedSubjectId);
        if (course?.subjectId && teacherSubjects.length > 0 && !teacherSubjects.includes(course.subjectId)) {
          throw new BadRequestException('لا يمكن إسناد أستاذ لمادة مختلفة عن مادة هذا الفوج الدراسي');
        }
      }

      await this.prisma.cohortInstructor.deleteMany({ where: { cohortId: id } });
      await this.prisma.cohortInstructor.create({
        data: {
          cohortId: id,
          teacherId,
          role: 'primary_teacher'
        }
      });
    }

    if (studentIds && Array.isArray(studentIds)) {
      await this.prisma.cohortEnrollment.deleteMany({ where: { cohortId: id } });
      if (studentIds.length > 0) {
        await this.prisma.cohortEnrollment.createMany({
          data: studentIds.map((studentId: string) => ({
            cohortId: id,
            studentId,
            status: 'enrolled'
          }))
        });
      }
    }

    return cohort;
  }

  @Delete('cohorts/:id')
  async deleteCohort(@Req() req: any, @Param('id') id: string) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    // Prisma cascade or manual delete
    await this.prisma.cohortInstructor.deleteMany({ where: { cohortId: id } });
    await this.prisma.cohortEnrollment.deleteMany({ where: { cohortId: id } });
    await this.prisma.session.deleteMany({ where: { cohortId: id } });
    await this.prisma.assessment.deleteMany({ where: { cohortId: id } });
    
    return this.prisma.cohort.delete({ where: { id } });
  }

  // ==========================================
  // SUPERVISOR COHORT MANAGEMENT (DELEGATED)
  // ==========================================

  @Get('supervisor/delegated/courses')
  async getDelegatedCourses(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      return [];
    }

    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);
    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(user.id, user.supervisedSubjectId) : [];

    let activeSubjectId: string | null = null;
    if (isSupervisor) {
      if (querySubjectId && supervisorSubjectIds.includes(querySubjectId)) {
        activeSubjectId = querySubjectId;
      } else if (user.supervisedSubjectId && supervisorSubjectIds.includes(user.supervisedSubjectId)) {
        activeSubjectId = user.supervisedSubjectId;
      } else {
        activeSubjectId = supervisorSubjectIds[0] || null;
      }
    } else {
      activeSubjectId = querySubjectId || user.supervisedSubjectId || null;
    }

    let whereClause: any = {};
    if (activeSubjectId) {
      whereClause = { subjectId: activeSubjectId };
    } else if (isSupervisor) {
      if (supervisorSubjectIds.length > 0) {
        whereClause = { subjectId: { in: supervisorSubjectIds } };
      } else {
        return [];
      }
    }

    return this.prisma.course.findMany({
      where: whereClause,
      include: {
        subject: { select: { id: true, nameAr: true, code: true } },
        versions: { where: { isDefault: true }, select: { id: true } }
      }
    });
  }

  @Get('supervisor/delegated/teachers')
  async getDelegatedTeachers(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      return [];
    }

    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);
    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(user.id, user.supervisedSubjectId) : [];

    let activeSubjectId: string | null = null;
    if (isSupervisor) {
      if (querySubjectId && supervisorSubjectIds.includes(querySubjectId)) {
        activeSubjectId = querySubjectId;
      } else if (user.supervisedSubjectId && supervisorSubjectIds.includes(user.supervisedSubjectId)) {
        activeSubjectId = user.supervisedSubjectId;
      } else {
        activeSubjectId = supervisorSubjectIds[0] || null;
      }
    } else {
      activeSubjectId = querySubjectId || user.supervisedSubjectId || null;
    }

    const roleCondition = {
      OR: [
        { primaryRole: { in: ['teacher', 'subject_supervisor'] as any } },
        { roles: { some: { role: { in: ['teacher', 'subject_supervisor'] as any } } } }
      ]
    };

    let whereClause: any = {
      status: 'active',
      ...roleCondition
    };

    if (activeSubjectId) {
      // Also include teachers who are assigned to cohorts of this subject even if their supervisedSubjectId is null
      const subjectCourses = await this.prisma.course.findMany({
        where: { subjectId: activeSubjectId },
        select: { id: true }
      });
      const subjectCohorts = await this.prisma.cohort.findMany({
        where: { courseId: { in: subjectCourses.map(c => c.id) } },
        select: { id: true }
      });
      const cohortInstructors = await this.prisma.cohortInstructor.findMany({
        where: { cohortId: { in: subjectCohorts.map(c => c.id) } },
        select: { teacherId: true }
      });
      const instructorIdsInSubject = cohortInstructors.map(i => i.teacherId);

      // Also include teachers assigned via supervisor_subjects table
      let supervisorSubjectUserIds: string[] = [];
      try {
        const assignedSubjectUsers: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT user_id FROM users.supervisor_subjects WHERE subject_id = $1::uuid`,
          activeSubjectId
        );
        supervisorSubjectUserIds = assignedSubjectUsers.map(r => r.user_id);
      } catch (_) {}

      whereClause = {
        status: 'active',
        AND: [
          roleCondition,
          {
            OR: [
              // Teachers explicitly assigned to this subject
              { supervisedSubjectId: activeSubjectId },
              // Teachers assigned via supervisor_subjects
              ...(supervisorSubjectUserIds.length > 0 ? [{ id: { in: supervisorSubjectUserIds } }] : []),
              // Teachers who teach cohorts of this subject (even if supervisedSubjectId is null/different)
              ...(instructorIdsInSubject.length > 0 ? [{ id: { in: instructorIdsInSubject } }] : [])
            ]
          }
        ]
      };
    } else if (isSupervisor) {
      if (supervisorSubjectIds.length > 0) {
        let allSupervisorSubjectUserIds: string[] = [];
        try {
          const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT user_id FROM users.supervisor_subjects WHERE subject_id = ANY($1::uuid[])`,
            supervisorSubjectIds
          );
          allSupervisorSubjectUserIds = rows.map(r => r.user_id);
        } catch (_) {}

        whereClause = {
          status: 'active',
          AND: [
            roleCondition,
            {
              OR: [
                { supervisedSubjectId: { in: supervisorSubjectIds } },
                ...(allSupervisorSubjectUserIds.length > 0 ? [{ id: { in: allSupervisorSubjectUserIds } }] : [])
              ]
            }
          ]
        };
      } else {
        return [];
      }
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, primaryRole: true }
    });
  }

  @Get('supervisor/delegated/students')
  async getDelegatedStudents(@Req() req: any, @Query('branch') branch?: string, @Query('curriculum') curriculum?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      return [];
    }

    return this.prisma.user.findMany({
      where: { primaryRole: 'student', status: 'active' },
      orderBy: [
        { firstName: 'asc' }
      ],
      select: { id: true, firstName: true, lastName: true, academicBranch: true, curriculumType: true, gradeLevel: true, email: true, phone: true, lastLoginAt: true, createdAt: true }
    });
  }

  @Get('supervisor/delegated/cohorts-detailed')
  async getDelegatedCohortsDetailed(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user.primaryRole);
    const supervisorSubjectIds = isSupervisor ? await this.getSupervisorSubjectIds(user.id, user.supervisedSubjectId) : [];

    let activeSubjectId: string | null = null;
    if (isSupervisor) {
      if (querySubjectId && supervisorSubjectIds.includes(querySubjectId)) {
        activeSubjectId = querySubjectId;
      } else if (user.supervisedSubjectId && supervisorSubjectIds.includes(user.supervisedSubjectId)) {
        activeSubjectId = user.supervisedSubjectId;
      } else {
        activeSubjectId = supervisorSubjectIds[0] || null;
      }
    } else {
      activeSubjectId = querySubjectId || user.supervisedSubjectId || null;
    }

    let courseFilter: any = {};
    if (activeSubjectId) {
      courseFilter = { subjectId: activeSubjectId };
    } else if (isSupervisor) {
      if (supervisorSubjectIds.length > 0) {
        courseFilter = { subjectId: { in: supervisorSubjectIds } };
      } else {
        return [];
      }
    }

    const courses = await this.prisma.course.findMany({
      where: courseFilter,
      include: {
        subject: { select: { id: true, nameAr: true, code: true } }
      }
    });
    const courseIds = courses.map(c => c.id);
    const courseMap = new Map(courses.map(c => [c.id, c]));

    if (isSupervisor && courseIds.length === 0) {
      return [];
    }

    const cohorts = await this.prisma.cohort.findMany({
      where: isSupervisor ? { courseId: { in: courseIds } } : (courseIds.length > 0 ? { courseId: { in: courseIds } } : undefined),
      orderBy: { createdAt: 'desc' },
      include: {
        instructors: true,
        enrollments: true
      }
    });

    const teacherIds = [...new Set(cohorts.flatMap(c => c.instructors.map(i => i.teacherId)))];
    const studentIds = [...new Set(cohorts.flatMap(c => c.enrollments.map(e => e.studentId)))];

    const [teachers, students] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, avatarUrl: true, lastLoginAt: true, createdAt: true }
      }),
      this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, academicBranch: true, curriculumType: true, gradeLevel: true, lastLoginAt: true, createdAt: true }
      })
    ]);

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const studentMap = new Map(students.map(s => [s.id, s]));

    const detailedCohorts = cohorts.map(cohort => {
      const course = courseMap.get(cohort.courseId);
      const instructor = cohort.instructors[0] ? teacherMap.get(cohort.instructors[0].teacherId) : null;
      const enrolledStudents = cohort.enrollments
        .map(enr => {
          const st = studentMap.get(enr.studentId);
          if (!st) return null;
          return {
            ...st,
            enrollmentStatus: enr.status
          };
        })
        .filter(Boolean);

      const maxCapacity = cohort.maxStudents || 12;
      const enrolledCount = enrolledStudents.length;
      const availableSeats = Math.max(0, maxCapacity - enrolledCount);
      const isTeacherVacant = !instructor || instructor.status !== 'active';

      let capacityStatus = 'available';
      if (enrolledCount >= maxCapacity) {
        capacityStatus = 'full';
      } else if (isTeacherVacant) {
        capacityStatus = 'teacher_vacant';
      } else if (enrolledCount < (cohort.minStudents || 3)) {
        capacityStatus = 'under_minimum';
      }

      return {
        id: cohort.id,
        name: cohort.name,
        code: cohort.code,
        status: cohort.status,
        minStudents: cohort.minStudents || 3,
        maxStudents: maxCapacity,
        enrolledCount,
        availableSeats,
        capacityStatus,
        isTeacherVacant,
        course: {
          id: course?.id,
          title: course?.title,
          code: course?.code,
          curriculumType: course?.curriculumType,
          academicBranch: course?.academicBranch,
          gradeLevel: course?.gradeLevel,
          subject: course?.subject
        },
        teacher: instructor || null,
        enrolledStudents
      };
    });

    const allActiveStudents = await this.prisma.user.findMany({
      where: { primaryRole: 'student', status: 'active' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, academicBranch: true, curriculumType: true, gradeLevel: true, lastLoginAt: true, createdAt: true }
    });

    const enrolledStudentIdSet = new Set(studentIds);
    const unassignedStudents = allActiveStudents.filter(s => !enrolledStudentIdSet.has(s.id));

    return {
      cohorts: detailedCohorts,
      unassignedStudents,
      summary: {
        totalCohorts: detailedCohorts.length,
        totalEnrolledStudents: studentIds.length,
        totalAvailableSeats: detailedCohorts.reduce((acc, c) => acc + c.availableSeats, 0),
        teacherVacantCount: detailedCohorts.filter(c => c.isTeacherVacant).length,
        unassignedStudentsCount: unassignedStudents.length
      }
    };
  }

  @Post('supervisor/cohorts/:cohortId/enroll-student')
  async enrollStudentInCohort(
    @Req() req: any,
    @Param('cohortId') cohortId: string,
    @Body() body: { studentId: string; notes?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const { studentId } = body;
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new Error('Cohort not found');

    const existing = await this.prisma.cohortEnrollment.findFirst({
      where: { cohortId, studentId }
    });
    if (existing) {
      return { ok: true, message: 'الطالب مسجل بالفعل في هذا الفوج' };
    }

    await this.prisma.cohortEnrollment.create({
      data: {
        cohortId,
        studentId,
        status: 'enrolled' as any
      }
    });

    try {
      await this.prisma.notification.create({
        data: {
          userId: studentId,
          title: `تم إسنادك إلى فوج جديد: ${cohort.name}`,
          body: `قام المشرف المنسق بضمك إلى فوج ${cohort.name}. يمكنك متابعة جدول حصصك الآن.`,
          type: 'enrollment',
          actionUrl: '/student/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, cohortId, studentId };
  }

  @Post('supervisor/transfer-student')
  async transferStudentBetweenCohorts(
    @Req() req: any,
    @Body() body: { studentId: string; fromCohortId: string; toCohortId: string; reason?: string }
  ) {
    const supervisorId = req.user.id || req.user.userId;
    const { studentId, fromCohortId, toCohortId, reason = 'نقل وتنسيق إشرافي' } = body;

    await this.prisma.cohortEnrollment.deleteMany({
      where: { cohortId: fromCohortId, studentId }
    });

    const existing = await this.prisma.cohortEnrollment.findFirst({
      where: { cohortId: toCohortId, studentId }
    });
    if (!existing) {
      await this.prisma.cohortEnrollment.create({
        data: {
          cohortId: toCohortId,
          studentId,
          status: 'enrolled' as any
        }
      });
    }

    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO users.student_cohort_transfers (supervisor_id, student_id, from_cohort_id, to_cohort_id, reason)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5)
      `, supervisorId, studentId, fromCohortId, toCohortId, reason);
    } catch (_) {}

    const toCohort = await this.prisma.cohort.findUnique({ where: { id: toCohortId } });
    try {
      await this.prisma.notification.create({
        data: {
          userId: studentId,
          title: `تم تغيير فوجك الدراسي إلى: ${toCohort?.name}`,
          body: `قام المشرف المنسق بنقلك إلى فوج ${toCohort?.name}. السبب: ${reason}`,
          type: 'enrollment',
          actionUrl: '/student/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, studentId, toCohortId };
  }

  @Delete('supervisor/cohorts/:cohortId/students/:studentId')
  async removeStudentFromCohort(
    @Req() req: any,
    @Param('cohortId') cohortId: string,
    @Param('studentId') studentId: string
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    await this.prisma.cohortEnrollment.deleteMany({
      where: { cohortId, studentId }
    });

    return { ok: true, cohortId, studentId };
  }

  @Post('supervisor/cohorts/:cohortId/assign-teacher')
  async assignTeacherToCohort(
    @Req() req: any,
    @Param('cohortId') cohortId: string,
    @Body() body: { teacherId: string; reason?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const { teacherId } = body;
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (cohort?.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: cohort.courseId },
        select: { subjectId: true }
      });
      const teacher = await this.prisma.user.findUnique({
        where: { id: teacherId },
        select: { supervisedSubjectId: true }
      });
      const teacherSubjects = await this.getSupervisorSubjectIds(teacherId, teacher?.supervisedSubjectId);
      if (course?.subjectId && teacherSubjects.length > 0 && !teacherSubjects.includes(course.subjectId)) {
        throw new BadRequestException('لا يمكن إسناد أستاذ لمادة مختلفة عن مادة هذا الفوج الدراسي');
      }
    }

    await this.prisma.cohortInstructor.deleteMany({ where: { cohortId } });
    await this.prisma.cohortInstructor.create({
      data: {
        cohortId,
        teacherId,
        role: 'primary_teacher'
      }
    });

    try {
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `تم إسناد فوج دراسي جديد لك: ${cohort?.name}`,
          body: `قام المشرف المنسق بتعيينك معلماً رئيسياً لفوج ${cohort?.name}.`,
          type: 'system',
          actionUrl: '/teacher/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, cohortId, teacherId };
  }

  @Post('supervisor/cohorts/:fromCohortId/bulk-transfer')
  async bulkTransferCohortStudents(
    @Req() req: any,
    @Param('fromCohortId') fromCohortId: string,
    @Body() body: { toCohortId: string; studentIds?: string[]; reason?: string; archiveOldCohort?: boolean }
  ) {
    const supervisorId = req.user.id || req.user.userId;
    const { toCohortId, studentIds, reason = 'معالجة شغور أستاذ وضم الطلبة', archiveOldCohort = false } = body;

    const fromEnrollments = await this.prisma.cohortEnrollment.findMany({
      where: { cohortId: fromCohortId }
    });

    const targetStudentIds = studentIds && studentIds.length > 0 
      ? studentIds 
      : fromEnrollments.map(e => e.studentId);

    await this.prisma.cohortEnrollment.deleteMany({
      where: {
        cohortId: fromCohortId,
        studentId: { in: targetStudentIds }
      }
    });

    for (const sId of targetStudentIds) {
      const existing = await this.prisma.cohortEnrollment.findFirst({
        where: { cohortId: toCohortId, studentId: sId }
      });
      if (!existing) {
        await this.prisma.cohortEnrollment.create({
          data: {
            cohortId: toCohortId,
            studentId: sId,
            status: 'enrolled' as any
          }
        });
      }

      try {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO users.student_cohort_transfers (supervisor_id, student_id, from_cohort_id, to_cohort_id, reason)
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5)
        `, supervisorId, sId, fromCohortId, toCohortId, reason);
      } catch (_) {}
    }

    if (archiveOldCohort) {
      await this.prisma.cohort.update({
        where: { id: fromCohortId },
        data: { status: 'suspended' as any }
      });
    }

    return { ok: true, transferredCount: targetStudentIds.length, toCohortId };
  }

  @Post('supervisor/delegated/cohorts')
  async createDelegatedCohort(@Req() req: any, @Body() body: { name: string, courseId: string, teacherId?: string, studentIds?: string[], code?: string, maxStudents?: number }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    // Find default curriculum version for course
    const course = await this.prisma.course.findUnique({
      where: { id: body.courseId },
      include: { versions: { where: { isDefault: true } } }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const versionId = course.versions[0]?.id;
    if (!versionId) throw new Error('Course has no default curriculum version');

    // Create Cohort
    const cohortCode = body.code?.trim() || ('COH-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const maxCapacity = body.maxStudents || 25;
    
    const cohort = await this.prisma.cohort.create({
      data: {
        name: body.name,
        code: cohortCode,
        courseId: body.courseId,
        curriculumVersionId: versionId,
        status: 'active',
        maxStudents: maxCapacity,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        createdById: user.id
      }
    });

    // Assign Teacher
    if (body.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: body.teacherId },
        select: { supervisedSubjectId: true }
      });
      const teacherSubjects = await this.getSupervisorSubjectIds(body.teacherId, teacher?.supervisedSubjectId);
      if (course?.subjectId && teacherSubjects.length > 0 && !teacherSubjects.includes(course.subjectId)) {
        throw new BadRequestException('لا يمكن إسناد أستاذ لمادة مختلفة عن مادة هذا الفوج الدراسي');
      }

      await this.prisma.cohortInstructor.create({
        data: {
          cohortId: cohort.id,
          teacherId: body.teacherId,
          role: 'primary_teacher'
        }
      });
    }

    // Assign Students
    if (body.studentIds && body.studentIds.length > 0) {
      const enrollments = body.studentIds.map(studentId => ({
        cohortId: cohort.id,
        studentId: studentId,
        status: 'enrolled' as any
      }));
      await this.prisma.cohortEnrollment.createMany({
        data: enrollments
      });
    }

    return { success: true, cohortId: cohort.id };
  }

  @Get('analytics/reports')
  async getAnalyticsReports(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(role)) {
      throw new Error('Unauthorized');
    }

    const isSupervisor = role === 'subject_supervisor' || role === 'supervisor';
    let supervisedSubjectId: string | null = null;
    let supervisedSubjectName: string | null = null;

    if (role === 'subject_supervisor') {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        include: { supervisedSubject: true }
      });
      supervisedSubjectId = user?.supervisedSubjectId || null;
      supervisedSubjectName = user?.supervisedSubject?.nameAr || null;
    }

    const courses = await this.prisma.course.findMany({
      select: { id: true, title: true, curriculumType: true, subjectId: true }
    });

    const cohorts = await this.prisma.cohort.findMany({
      include: {
        enrollments: { select: { studentId: true } },
        instructors: { select: { teacherId: true } }
      }
    });

    const courseMap = new Map(courses.map(c => [c.id, c]));

    let governmentalCohortsCount = 0;
    let azhariCohortsCount = 0;
    let otherCurriculumCohortsCount = 0;

    let governmentalStudentsCount = 0;
    let azhariStudentsCount = 0;

    cohorts.forEach(coh => {
      const course = courseMap.get(coh.courseId);
      const studentCount = coh.enrollments.length;
      if (course?.curriculumType === 'governmental') {
        governmentalCohortsCount++;
        governmentalStudentsCount += studentCount;
      } else if (course?.curriculumType === 'azhari') {
        azhariCohortsCount++;
        azhariStudentsCount += studentCount;
      } else {
        otherCurriculumCohortsCount++;
      }
    });

    const totalCourses = courses.length;
    const governmentalCoursesCount = courses.filter(c => c.curriculumType === 'governmental').length;
    const azhariCoursesCount = courses.filter(c => c.curriculumType === 'azhari').length;

    const allUsers = await this.prisma.user.findMany({
      select: {
        id: true,
        primaryRole: true,
        status: true,
        nationality: true,
        curriculumType: true,
        academicBranch: true,
        gradeLevel: true
      }
    });

    const teachers = allUsers.filter(u => u.primaryRole === 'teacher');
    const students = allUsers.filter(u => u.primaryRole === 'student');
    const supervisors = allUsers.filter(u => u.primaryRole === 'subject_supervisor' || (u.primaryRole as string) === 'supervisor');

    const calculateNationalities = (userList: any[]) => {
      const map: Record<string, number> = {};
      userList.forEach(u => {
        const nat = u.nationality?.trim() || 'غير محدد';
        map[nat] = (map[nat] || 0) + 1;
      });
      const total = userList.length || 1;
      return Object.entries(map).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      })).sort((a, b) => b.count - a.count);
    };

    const overallNationalities = calculateNationalities(allUsers);
    const studentNationalities = calculateNationalities(students);
    const teacherNationalities = calculateNationalities(teachers);

    const grade11Students = students.filter(s => s.gradeLevel === 'grade_11').length;
    const grade12Students = students.filter(s => s.gradeLevel === 'grade_12').length;

    const totalCohorts = cohorts.length;
    const activeCohorts = cohorts.filter(c => c.status === 'active' || (c.status as any) === 'in_progress').length;
    const totalEnrolledStudents = cohorts.reduce((acc, c) => acc + c.enrollments.length, 0);
    const totalMaxCapacity = cohorts.reduce((acc, c) => acc + (c.maxStudents || 12), 0);
    const averageStudentsPerCohort = totalCohorts > 0 ? (totalEnrolledStudents / totalCohorts).toFixed(1) : '0';
    const capacitySaturationRate = totalMaxCapacity > 0 ? Math.round((totalEnrolledStudents / totalMaxCapacity) * 100) : 0;

    const totalSessions = await this.prisma.session.count();
    const completedSessions = await this.prisma.session.count({ where: { status: 'completed' } });
    const scheduledSessions = await this.prisma.session.count({ where: { status: 'scheduled' } });
    const cancelledSessions = await this.prisma.session.count({ where: { status: 'cancelled' } });

    const attendances = await this.prisma.sessionAttendance.findMany({
      select: { status: true }
    });
    const presentAttendances = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalAttendanceMarks = attendances.length || 1;
    const studentAttendanceRate = attendances.length > 0 ? Math.round((presentAttendances / totalAttendanceMarks) * 100) : 95;

    const recommendations = [];

    if (studentAttendanceRate < 85) {
      recommendations.push({
        type: 'pedagogical',
        level: 'high',
        title: 'انخفاض في نسبة الحضور العام للجلسات',
        description: `نسبة الحضور الحالية بلغت ${studentAttendanceRate}%. يُوصى المشرفون بتكثيف المتابعة مع الأساتذة ومراجعة أسباب تغيب الطلاب المتكررة، وتنظيم جلسات دعم تعويضية.`
      });
    } else {
      recommendations.push({
        type: 'pedagogical',
        level: 'info',
        title: 'استقرار الالتزام الصفي والتربوي',
        description: `نسبة الحضور المباشر ممتازة (${studentAttendanceRate}%). يُوصى بتعزيز التفاعل عبر الأنشطة التكوينية وتكليف الطلاب بمهام إثرائية للمحافظة على هذا المستوى.`
      });
    }

    recommendations.push({
      type: 'pedagogical',
      level: 'medium',
      title: 'التوزيع الفصلي المتوازن للمنهاج',
      description: 'التأكد من التزام الأساتذة بالخطة الشهرية للفصلين (4 أشهر لكل فصل)، ومراجعة استيفاء الوحدات التدريسية قبل بدء فترات الامتحانات في شهري ديسمبر ومايو.'
    });

    if (capacitySaturationRate > 85) {
      recommendations.push({
        type: 'administrative',
        level: 'high',
        title: 'اقتراب الطاقة الاستيعابية للأفواج من الحد الأقصى',
        description: `بلغت نسبة إشغال الأفواج ${capacitySaturationRate}%. يُنصح الإدارة بفتح أفواج دراسية جديدة لتجنب الاكتظاظ وضمان جودة المتابعة الفردية.`
      });
    } else if (capacitySaturationRate < 40 && totalCohorts > 0) {
      recommendations.push({
        type: 'administrative',
        level: 'medium',
        title: 'فرصة لضم وتوسيع التسجيل في الأفواج القائمة',
        description: `نسبة استيعاب الأفواج الحالية ${capacitySaturationRate}% فقط. يمكن للإدارة قبول المزيد من الطلاب المسجلين دون الحاجة لفتح أفواج إضافية.`
      });
    }

    const unassignedCohorts = cohorts.filter(c => c.instructors.length === 0).length;
    if (unassignedCohorts > 0) {
      recommendations.push({
        type: 'administrative',
        level: 'high',
        title: `تنبيه إسناد: يوجد ${unassignedCohorts} أفواج بدون معلم رئيسي`,
        description: 'يُرجى من إدارة المنظمة والمشرفين إتمام الإسناد الأكاديمي لهذه الأفواج لضمان بدء الحصص في مواعيدها.'
      });
    }

    const subjectsWithoutSupervisor = await this.prisma.subject.count({
      where: { supervisors: { none: {} } }
    });
    if (subjectsWithoutSupervisor > 0) {
      recommendations.push({
        type: 'administrative',
        level: 'medium',
        title: `مواد دراسية بحاجة لإسناد إشرافي (${subjectsWithoutSupervisor} مواد)`,
        description: 'يُنصح بتعيين مشرفين متخصصين للمواد المتبقية لضمان توجيه وتقييم المعلمين وفق المعايير المعتمدة.'
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      scope: {
        role,
        isSupervisor,
        supervisedSubjectId,
        supervisedSubjectName
      },
      curriculum: {
        totalCourses,
        governmental: {
          coursesCount: governmentalCoursesCount,
          cohortsCount: governmentalCohortsCount,
          studentsCount: governmentalStudentsCount,
          percentage: totalCohorts > 0 ? Math.round((governmentalCohortsCount / totalCohorts) * 100) : 100
        },
        azhari: {
          coursesCount: azhariCoursesCount,
          cohortsCount: azhariCohortsCount,
          studentsCount: azhariStudentsCount,
          percentage: totalCohorts > 0 ? Math.round((azhariCohortsCount / totalCohorts) * 100) : 0
        }
      },
      gradeLevels: {
        grade11: {
          count: grade11Students,
          percentage: students.length > 0 ? Math.round((grade11Students / students.length) * 100) : 0
        },
        grade12: {
          count: grade12Students,
          percentage: students.length > 0 ? Math.round((grade12Students / students.length) * 100) : 0
        }
      },
      nationalities: {
        overall: overallNationalities,
        students: studentNationalities,
        teachers: teacherNationalities
      },
      cohorts: {
        total: totalCohorts,
        active: activeCohorts,
        totalEnrolledStudents,
        totalMaxCapacity,
        averageStudentsPerCohort,
        capacitySaturationRate,
        unassignedCohorts
      },
      users: {
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalSupervisors: supervisors.length,
        teacherToStudentRatio: teachers.length > 0 ? `1 : ${Math.round(students.length / teachers.length)}` : '0'
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        scheduled: scheduledSessions,
        cancelled: cancelledSessions,
        attendanceRate: studentAttendanceRate
      },
      recommendations
    };
  }
}
