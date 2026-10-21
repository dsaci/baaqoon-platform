/**
 * Baaqoon Educational Platform - Email HTML Templates
 * Fully responsive, RTL-oriented, inlined CSS for maximum client compatibility (Gmail, Outlook, Apple Mail).
 * Strictly emoji-free to prevent any character encoding or question mark corruption (?) on email gateways.
 */

/**
 * Strips all Unicode emojis, surrogate pairs, and replacement characters from any text string.
 * Guarantees 100% clean, pristine Arabic typography across all mail clients.
 */
export function stripEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Resolves a bulletproof absolute frontend URL, strictly guarding against wildcard '*' or malformed paths.
 */
export function getSafeFrontendUrl(rawUrl?: string): string {
  const envUrl = process.env.FRONTEND_URL?.trim();
  const base = (envUrl && envUrl !== '*' && envUrl.startsWith('http'))
    ? envUrl.replace(/\/$/, '')
    : 'https://baaqoon-platform.vercel.app';
  if (!rawUrl || rawUrl === '*' || !rawUrl.trim()) {
    return `${base}/login`;
  }
  const clean = rawUrl.trim();
  if (clean.startsWith('http')) return clean;
  return `${base}${clean.startsWith('/') ? clean : '/' + clean}`;
}

export interface VolunteerApprovedEmailData {
  fullName: string;
  email: string;
  assignedSubject?: string;
  initialPassword?: string;
  loginUrl: string;
}

export interface VolunteerRejectedEmailData {
  fullName: string;
  reason?: string;
  supportEmail?: string;
}

export interface VolunteerApplicationReceivedEmailData {
  fullName: string;
  email: string;
  trackingUrl: string;
  subjects?: string[];
}

export interface InactiveUserNudgeEmailData {
  fullName: string;
  email: string;
  role: string;
  customMessage: string;
  lastLoginAt?: Date | string | null;
  loginUrl: string;
}

export interface SupervisorClarificationEmailData {
  teacherName: string;
  email: string;
  supervisorName: string;
  subjectName?: string;
  title: string;
  content: string;
  isUrgent?: boolean;
  loginUrl: string;
}

export interface ImportantNotificationEmailData {
  recipientName: string;
  email: string;
  role?: string;
  title: string;
  body: string;
  actionUrl?: string;
  isUrgent?: boolean;
  senderName?: string;
}

/**
 * Base wrapper for all Baaqoon emails with unified branding, header, and footer.
 */
function getEmailWrapper(content: string, previewText: string = ''): string {
  const safeContent = stripEmojis(content);
  const safePreview = stripEmojis(previewText);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>منصة باقون التعليمية</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      text-decoration: none;
    }
    .email-container {
      max-width: 600px;
      margin: 24px auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1F2A18 0%, #394C2A 60%, #4a6337 100%);
      padding: 36px 30px;
      text-align: center;
      color: #ffffff;
    }
    .content {
      padding: 36px 30px;
      line-height: 1.8;
      font-size: 15px;
      color: #334155;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .credentials-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-right: 4px solid #394C2A;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .terms-box {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-right: 4px solid #c9b48a;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #1F2A18 0%, #394C2A 100%);
      color: #ffffff !important;
      font-weight: bold;
      font-size: 15px;
      padding: 14px 34px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(31, 42, 24, 0.25);
      margin: 16px 0;
      border: 1px solid #c9b48a;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- Preheader text for inbox preview -->
  <span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${safePreview}
  </span>

  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div style="display: inline-block; padding: 4px 16px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; color: #c9b48a; letter-spacing: 0.5px;">
        دولة فلسطين • قطاع غزة
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">منصة باقون التعليمية</h1>
      <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95; font-weight: 500; color: #f1f5f9;">
        مبادرة تطوعية لدعم وإسناد طلبة فلسطين وقطاع غزة
      </p>
    </div>

    <!-- Content -->
    <div class="content">
      ${safeContent}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 8px; font-weight: bold; color: #1F2A18; font-size: 13px;">
        «غزة باقية.. والعلم سلاحنا الذي لا يُهزم»
      </p>
      <p style="margin: 0 0 8px;">
        هذه الرسالة آلية من نظام منصة باقون، يُرجى عدم الرد عليها مباشرة.
      </p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        جميع الحقوق محفوظة © لمنصة باقون التعليمية 2026
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Volunteer Approved Email Template
 */
export function getVolunteerApprovedEmailTemplate(data: VolunteerApprovedEmailData): { subject: string; html: string } {
  const cleanName = stripEmojis(data.fullName);
  const subject = `[اعتماد ملف] مبارك قبولكم واعتمادكم رسمياً في منصة باقون التعليمية | أ. ${cleanName}`;
  const loginUrl = getSafeFrontendUrl(data.loginUrl);

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #dcfce7; color: #166534; border: 1px solid #86efac; font-size: 13px;">
        تم اعتماد ملفكم الأكاديمي بنجاح
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        الأستاذ الفاضل: ${cleanName}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        أهلاً ومرحباً بكم ضمن الهيئة التدريسية المعتمدة لمنصة باقون
      </p>
    </div>

    <p>
      السلام عليكم ورحمة الله وبركاته،
    </p>
    <p>
      نحمد الله على توفيقه، ويسر إدارة <strong>منصة باقون التعليمية</strong> والمشرفين الأكاديميين إبلاغكم بأنه قد تم دراسة ملفكم واعتمادكم رسمياً كـ <strong>أستاذ معتمد</strong> ضمن الهيئة التعليمية للمنصة.
    </p>

    ${data.assignedSubject ? `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin: 18px 0;">
      <strong style="color: #065f46; font-size: 14px;">المادة المقررة لتدريسها:</strong>
      <span style="font-weight: 900; color: #047857; margin-right: 6px; font-size: 15px;">${stripEmojis(data.assignedSubject)}</span>
    </div>
    ` : ''}

    <div class="credentials-box">
      <h3 style="margin: 0 0 12px; font-size: 15px; color: #065f46; font-weight: 800;">
        بيانات الدخول المبدئية إلى حسابكم الأكاديمي:
      </h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;">البريد الإلكتروني:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0f172a; direction: ltr; text-align: right;">${data.email}</td>
        </tr>
        ${data.initialPassword ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b;">كلمة المرور المؤقتة:</td>
          <td style="padding: 6px 0; font-weight: 900; font-family: monospace; color: #059669; font-size: 16px; direction: ltr; text-align: right;">${data.initialPassword}</td>
        </tr>
        ` : `
        <tr>
          <td style="padding: 6px 0; color: #64748b;">كلمة المرور:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">يمكنكم تعيينها أو الدخول بكلمة المرور المعتمدة لديكم.</td>
        </tr>
        `}
      </table>
      <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
        * سيُطلب منكم تغيير كلمة المرور عند أول تسجيل دخول لضمان أمان حسابكم.
      </p>
    </div>

    <!-- Terms and Pledges Reminder -->
    <div class="terms-box">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #b45309; font-weight: 800;">
        تذكير بالشروط والتعهد الأكاديمي التطوعي:
      </h4>
      <ul style="margin: 0; padding-right: 20px; line-height: 1.7;">
        <li><strong>التطوع خالص لوجه الله:</strong> التدريس تطوعي بالكامل في سبيل الله وإسناداً لأهلنا، ولا يترتب عليه أي مقابل مالي، مع إتاحة الدعم في إطار الدورات والتكوين الأكاديمي المستمر.</li>
        <li><strong>خصوصية الطلبة:</strong> يُمنع منعاً باتاً تصوير الطلبة أو تسجيل الحصص المباشرة أو نشر صورهم حفاظاً على أمانهم وكرامتهم.</li>
        <li><strong>بنك الدروس المسجلة:</strong> يُتاح للأستاذ إعداد شروحات مسجلة منفردة بدقة HD لإثرائها في المنصة لمساعدة الطلاب الذين يعانون من انقطاع الكهرباء والإنترنت.</li>
        <li><strong>الالتزام بالمواعيد:</strong> إعلام مشرف المادة مسبقاً في حال طرأ أي ظرف يحول دون إعطاء الحصة المجدولة لترتيب البديل.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" class="btn" target="_blank">
        الدخول إلى حسابك في المنصة والبدء &larr;
      </a>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
        أو انسخ الرابط المباشر: <span style="direction: ltr; display: inline-block;">${loginUrl}</span>
      </div>
    </div>

    <p style="margin-top: 24px; font-weight: bold; color: #0f172a;">
      جزاكم الله خير الجزاء على عطائكم النبيل، ونفع بكم وبجهدكم أبناءنا وبناتنا في غزة وفلسطين.
    </p>
  `;

  return {
    subject,
    html: getEmailWrapper(content, `تم قبول واعتماد ملفكم الأكاديمي في منصة باقون التعليمية. إليكم بيانات الحساب ورابط الدخول.`),
  };
}

/**
 * 2. Volunteer Rejected Email Template
 */
export function getVolunteerRejectedEmailTemplate(data: VolunteerRejectedEmailData): { subject: string; html: string } {
  const cleanName = stripEmojis(data.fullName);
  const subject = `[إفادة ملف التطوع] بشأن طلب التطوع في منصة باقون التعليمية | أ. ${cleanName}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 13px;">
        إشعار مآل دراسة ملف التطوع
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        الأستاذ الفاضل: ${cleanName}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        خالص الشكر والتقدير لمبادرتكم الكريمة ورغبتكم في مساندة طلبة غزة
      </p>
    </div>

    <p>
      السلام عليكم ورحمة الله وبركاته،
    </p>
    <p>
      تتقدم إليكم إدارة <strong>منصة باقون التعليمية</strong> بخالص الشكر وعظيم الامتنان لمبادرتكم الإنسانية والوطنية النبيلة واستعدادكم للعطاء وتقديم وقتكم وخبرتكم إسناداً لطلبة فلسطين وقطاع غزة.
    </p>
    <p>
      نود إفادتكم بأنه بعد دراسة الملفات المتقدمة من قبل اللجان الأكاديمية المختصة، ونظراً لاكتمال النصاب المطلوب من الأساتذة في تخصصكم للأفواج التعليمية المفتوحة حالياً، فإننا نعتذر عن عدم إمكانية اعتماد تكليفكم الدراسي في هذه المرحلة.
    </p>

    ${data.reason ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-right: 4px solid #64748b; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 6px; font-size: 14px; color: #334155; font-weight: 800;">
        ملاحظة المشرف الأكاديمي:
      </h4>
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
        ${stripEmojis(data.reason)}
      </p>
    </div>
    ` : ''}

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #166534; font-size: 14px; line-height: 1.7;">
      <strong>ملفكم محفوظ في بنك الكفاءات الاحتياطي:</strong>
      <br>
      لقد تم حفظ سيرتكم وبياناتكم بكل عناية في قاعدة بيانات الكفاءات التعليمية للمنصة، وسيكون ملفكم على رأس الأولويات عند فتح أفواج دراسية جديدة أو التوسع في المواد خلال المراحل القادمة بإذن الله.
    </div>

    <p style="margin-top: 24px; color: #334155;">
      شكر الله سعيكم، وتقبل منكم نيتكم الصادقة وجهدكم الطيب، ونسأل الله أن يبارك فيكم وفي علمكم.
    </p>
  `;

  return {
    subject,
    html: getEmailWrapper(content, `إفادة بشأن مآل دراسة ملف التطوع في منصة باقون التعليمية.`),
  };
}

/**
 * 3. Volunteer Application Received Email Template
 */
export function getVolunteerApplicationReceivedEmailTemplate(data: VolunteerApplicationReceivedEmailData): { subject: string; html: string } {
  const cleanName = stripEmojis(data.fullName);
  const subject = `[تأكيد الاستلام] استلام طلب التطوع والتدريس بنجاح | منصة باقون`;
  const trackingUrl = getSafeFrontendUrl(data.trackingUrl);

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 13px;">
        تم استلام طلبكم بنجاح
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        أهلاً بك أ. ${cleanName}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        شكراً لمبادرتك النبيلة في التطوع لتعليم طلبة غزة
      </p>
    </div>

    <p>
      السلام عليكم ورحمة الله وبركاته،
    </p>
    <p>
      تم بنجاح تسجيل طلب تطوعكم لدى <strong>منصة باقون التعليمية</strong> لتدريس طلبة قطاع غزة وفق المنهاج المعتمد.
    </p>

    ${data.subjects && data.subjects.length > 0 ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin: 18px 0;">
      <strong style="color: #334155; font-size: 13px;">المواد المختارة للتدريس:</strong>
      <span style="font-weight: bold; color: #059669; margin-right: 6px;">${data.subjects.map(s => stripEmojis(s)).join('، ')}</span>
    </div>
    ` : ''}

    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px; font-size: 14px; color: #0f172a; font-weight: 800;">
        مراحل دراسة الملف واعتماد الحساب:
      </h4>
      <ol style="margin: 0; padding-right: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
        <li>مراجعة التخصص والخبرة من قبل <strong>المشرف الأكاديمي للمادة</strong>.</li>
        <li>الاعتماد النهائي وإسناد الأفواج من قبل <strong>إدارة المنصة</strong>.</li>
        <li>إشعاركم فوراً بالقرار الرسمي وتفعيل الحساب وتزويدكم ببيانات الدخول عبر البريد الإلكتروني.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${trackingUrl}" class="btn" target="_blank">
        الاستعلام عن حالة الملف من البوابة &larr;
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      نسأل الله أن يبارك في مسعاكم ويجعل عملكم في ميزان حسناتكم.
    </p>
  `;

  return {
    subject,
    html: getEmailWrapper(content, `تم استلام طلب تطوعكم في منصة باقون وهو قيد المراجعة والتدقيق.`),
  };
}

/**
 * 4. Inactive User Nudge Email Template (تنبيه المتابعة والغياب للمستخدم الخامل)
 */
export function getInactiveUserNudgeEmailTemplate(data: InactiveUserNudgeEmailData): { subject: string; html: string } {
  const isStudent = data.role === 'student';
  const isTeacher = data.role === 'teacher';

  const cleanName = stripEmojis(data.fullName);
  const roleTitle = isStudent ? 'الطالب العزيز' : isTeacher ? 'الأستاذ الفاضل' : 'الأخ/الأخت الفاضل(ة)';
  const subject = `[تنبيه متابعة] اطمئنان ومتابعة من منصة باقون التعليمية | ${roleTitle} ${cleanName}`;
  const loginUrl = getSafeFrontendUrl(data.loginUrl);

  const lastLoginFormatted = data.lastLoginAt
    ? new Date(data.lastLoginAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'لم يتم تسجيل الدخول مسبقاً';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 13px;">
        تنبيه متابعة واطمئنان
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        ${roleTitle}: ${cleanName}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        نفتقد وجودك وتفاعلك معنا في منصة باقون التعليمية
      </p>
    </div>

    <p>
      السلام عليكم ورحمة الله وبركاته،
    </p>
    <p>
      تحية طيبة ملؤها التقدير والاعتزاز بك في رحاب <strong>منصة باقون التعليمية</strong>.
    </p>

    <!-- Admin Message Box -->
    <div style="background-color: #FAF7F2; border: 1px solid #e2d9cc; border-right: 5px solid #394C2A; border-radius: 14px; padding: 20px 22px; margin: 24px 0;">
      <div style="font-weight: 800; color: #1F2A18; font-size: 14px; margin-bottom: 10px;">
        نص التنبيه ورسالة المتابعة:
      </div>
      <div style="font-size: 15px; color: #334155; line-height: 1.8; white-space: pre-line; font-weight: 500;">
        ${stripEmojis(data.customMessage)}
      </div>
    </div>

    ${isStudent ? `
    <p style="color: #334155; line-height: 1.8;">
      نود تذكيرك بأننا هنا لنقف بجانبك خطوة بخطوة في مسيرتك الدراسية رغم كل الظروف والتحديات في قطاع غزة وفلسطين. <strong>أساتذتك وزملاؤك بانتظارك</strong>، وحصصك الدراسية والتكليفات المدرسية وبنك الدروس المسجلة متاحة لك باستمرار لمساعدتك على التفوق وتحقيق حلمك.
    </p>
    ` : isTeacher ? `
    <p style="color: #334155; line-height: 1.8;">
      نثمن عالياً دوركم العظيم ورسالتكم الإنسانية السامية في تعليم وإسناد طلبة فلسطين وقطاع غزة. <strong>طلابكم بحاجة إلى وجودكم وتوجيهكم المستمر</strong> لاستكمال مسيرتهم التعليمية بثبات وأمل. نرجو منكم تسجيل الدخول ومتابعة الأفواج والخطط الأكاديمية.
    </p>
    ` : `
    <p style="color: #334155; line-height: 1.8;">
      نلفت عنايتكم إلى أهمية المتابعة المستمرة لمهامكم على المنصة لدعم سير العملية التعليمية.
    </p>
    `}

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; width: 140px;">البريد المسجل:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #0f172a; direction: ltr; text-align: right;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">الصفة في المنصة:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #059669;">${isStudent ? 'طالب' : isTeacher ? 'أستاذ متطوع' : data.role}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">آخر تسجيل دخول:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #64748b;">${lastLoginFormatted}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" class="btn" target="_blank">
        تسجيل الدخول إلى المنصة واستئناف النشاط &larr;
      </a>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
        أو عبر الرابط المباشر: <span style="direction: ltr; display: inline-block;">${loginUrl}</span>
      </div>
    </div>

    <p style="margin-top: 24px; font-size: 13px; color: #64748b; text-align: center;">
      معاً نبني الأمل ونواصل مسيرة العلم لأبناء شعبنا.
    </p>
  `;

  return {
    subject,
    html: getEmailWrapper(content, `تنبيه متابعة واطمئنان من منصة باقون: ${stripEmojis(data.customMessage).slice(0, 80)}...`),
  };
}

/**
 * 5. Supervisor Clarification & Direct Directive Email Template
 */
export function getSupervisorClarificationEmailTemplate(data: SupervisorClarificationEmailData): { subject: string; html: string } {
  const cleanTeacher = stripEmojis(data.teacherName);
  const cleanTitle = stripEmojis(data.title);
  const subject = `[${data.isUrgent ? 'تنبيه إشرافي عاجل' : 'توجيه إشرافي'}] ${cleanTitle} | أ. ${cleanTeacher}`;
  const loginUrl = getSafeFrontendUrl(data.loginUrl);

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: ${data.isUrgent ? '#fee2e2' : '#ecfdf5'}; color: ${data.isUrgent ? '#991b1b' : '#065f46'}; border: 1px solid ${data.isUrgent ? '#fca5a5' : '#a7f3d0'}; font-size: 13px;">
        ${data.isUrgent ? 'إشعار إشرافي عاجل وذو أولوية' : 'توجيه واستفسار إشرافي'}
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        الأستاذ الفاضل: ${cleanTeacher}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        من المشرف الأكاديمي: <strong>${stripEmojis(data.supervisorName)}</strong> ${data.subjectName ? `(مادة ${stripEmojis(data.subjectName)})` : ''}
      </p>
    </div>

    <p>
      السلام عليكم ورحمة الله وبركاته،
    </p>
    <p>
      يوجه إليكم المشرف الأكاديمي لمادتكم التوجيه/الاستفسار التالي لمتابعة سير الحصص والعملية التعليمية:
    </p>

    <!-- Message Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-right: 5px solid ${data.isUrgent ? '#ef4444' : '#059669'}; border-radius: 14px; padding: 20px 22px; margin: 24px 0;">
      <div style="font-weight: 800; color: #0f172a; font-size: 15px; margin-bottom: 8px;">
        ${cleanTitle}
      </div>
      <div style="font-size: 14px; color: #334155; line-height: 1.8; white-space: pre-line;">
        ${stripEmojis(data.content)}
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" class="btn" target="_blank">
        فتح بوابة الأستاذ والمتابعة &larr;
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center;">
      نسأل الله لكم التوفيق والسداد في أداء رسالتكم التعليمية النبيلة.
    </p>
  `;

  return {
    subject,
    html: getEmailWrapper(content, `${cleanTitle}: ${stripEmojis(data.content).slice(0, 80)}...`),
  };
}

/**
 * 6. Important Notification & Urgent Announcement Email Template (إشعار وتعميم رسمي هام)
 */
export function getImportantNotificationEmailTemplate(data: ImportantNotificationEmailData): { subject: string; html: string } {
  const isStudent = data.role === 'student';
  const isTeacher = data.role === 'teacher';
  const isSupervisor = data.role === 'subject_supervisor' || data.role === 'supervisor';

  const roleTitle = isStudent
    ? 'الطالب(ة) العزيز(ة)'
    : isTeacher
    ? 'الأستاذ(ة) الفاضل(ة)'
    : isSupervisor
    ? 'المشرف الأكاديمي الفاضل'
    : 'الأخ/الأخت الفاضل(ة)';

  const cleanTitle = stripEmojis(data.title);
  const cleanRecipient = stripEmojis(data.recipientName);
  const cleanBody = stripEmojis(data.body);

  const urgencyPrefix = data.isUrgent ? 'إشعار رسمي عاجل: ' : 'إشعار وتعميم هام: ';
  const subject = `[${data.isUrgent ? 'عاجل' : 'تعميم'}] ${urgencyPrefix}${cleanTitle} | منصة باقون التعليمية`;

  const loginUrl = getSafeFrontendUrl(data.actionUrl);

  const senderDisplay = data.senderName
    ? `من: <strong>${stripEmojis(data.senderName)}</strong>`
    : `من: <strong>إدارة منصة باقون التعليمية</strong>`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: ${data.isUrgent ? '#fee2e2' : '#fef3c7'}; color: ${data.isUrgent ? '#991b1b' : '#92400e'}; border: 1px solid ${data.isUrgent ? '#fca5a5' : '#fde68a'}; font-size: 13px; font-weight: 800;">
        ${data.isUrgent ? 'إشعار رسمي هام وعاجل' : 'إشعار وتعميم رسمي هام'}
      </span>
      <h2 style="margin: 12px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        ${roleTitle}: ${cleanRecipient}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 13px;">
        ${senderDisplay}
      </p>
    </div>

    <p>
      السلام عليكم ورحمة الله وبركاته،
    </p>
    <p>
      نلفت عنايتكم الكريمة في <strong>منصة باقون التعليمية</strong> إلى الإشعار والتعميم الهام التالي:
    </p>

    <!-- Important Notice Box -->
    <div style="background-color: #FAF7F2; border: 1px solid #e2d9cc; border-right: 6px solid ${data.isUrgent ? '#dc2626' : '#394C2A'}; border-radius: 14px; padding: 22px 24px; margin: 24px 0;">
      <div style="font-weight: 900; color: ${data.isUrgent ? '#991b1b' : '#1F2A18'}; font-size: 16px; margin-bottom: 12px;">
        ${cleanTitle}
      </div>
      <div style="font-size: 15px; color: #334155; line-height: 1.85; white-space: pre-line; font-weight: 500;">
        ${cleanBody}
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" class="btn" target="_blank">
        الانتقال إلى المنصة ومتابعة الإشعار &larr;
      </a>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
        رابط الوصول المباشر: <span style="direction: ltr; display: inline-block;">${loginUrl}</span>
      </div>
    </div>

    <p style="margin-top: 24px; font-size: 13px; color: #64748b; text-align: center;">
      معاً نحو تعليم رائد ومستقبل مشرق لأبناء فلسطين.
    </p>
  `;

  return {
    subject,
    html: getEmailWrapper(content, `${cleanTitle}: ${cleanBody.slice(0, 80)}...`),
  };
}
