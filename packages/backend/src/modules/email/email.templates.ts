/**
 * Baaqoon Educational Platform - Email HTML Templates
 * Fully responsive, RTL-oriented, inlined CSS for maximum client compatibility (Gmail, Outlook, Apple Mail).
 */

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

/**
 * Base wrapper for all Baaqoon emails with unified branding, header, and footer.
 */
function getEmailWrapper(content: string, previewText: string = ''): string {
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
      background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%);
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
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .badge-success {
      background-color: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .credentials-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-right: 4px solid #059669;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .terms-box {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-right: 4px solid #f59e0b;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
      color: #ffffff !important;
      font-weight: bold;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
      margin: 16px 0;
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
    ${previewText}
  </span>

  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div style="font-size: 28px; margin-bottom: 6px;">🇵🇸</div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">منصة باقون التعليمية</h1>
      <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9; font-weight: 500;">
        مبادرة تطوعية لدعم وإسناد طلبة فلسطين وقطاع غزة
      </p>
    </div>

    <!-- Content -->
    <div class="content">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 8px; font-weight: bold; color: #334155;">
        «غزة باقية.. والعلم سلاحنا الذي لا يُهزم» 🕊️
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
  const subject = `🎉 مبارك قبولكم واعتمادكم رسمياً في منصة باقون التعليمية | أ. ${data.fullName}`;
  
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #dcfce7; color: #166534; border: 1px solid #86efac; font-size: 13px;">
        ✅ تم اعتماد ملفكم الأكاديمي بنجاح
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        أهلاً وسهلاً بكم أستاذنا الفاضل: ${data.fullName}
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        يسعدنا انضمامكم إلى كوكبة الأساتذة المتطوعين لخدمة وتعليم طلبة غزة الأبرار
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
      <strong style="color: #065f46; font-size: 14px;">📚 المادة المقررة لتدريسها:</strong>
      <span style="font-weight: 900; color: #047857; margin-right: 6px; font-size: 15px;">${data.assignedSubject}</span>
    </div>
    ` : ''}

    <div class="credentials-box">
      <h3 style="margin: 0 0 12px; font-size: 15px; color: #065f46; font-weight: 800;">
        🔐 بيانات الدخول المبدئية إلى حسابكم الأكاديمي:
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
        🛡️ تذكير بالشروط والتعهد الأكاديمي التطوعي:
      </h4>
      <ul style="margin: 0; padding-right: 20px; line-height: 1.7;">
        <li><strong>التطوع خالص لوجه الله:</strong> التدريس تطوعي بالكامل في سبيل الله وإسناداً لأهلنا، ولا يترتب عليه أي مقابل مالي، مع إتاحة الدعم في إطار الدورات والتكوين الأكاديمي المستمر.</li>
        <li><strong>خصوصية الطلبة:</strong> يُمنع منعاً باتاً تصوير الطلبة أو تسجيل الحصص المباشرة أو نشر صورهم حفاظاً على أمانهم وكرامتهم.</li>
        <li><strong>بنك الدروس المسجلة:</strong> يُتاح للأستاذ إعداد شروحات مسجلة منفردة بدقة HD لإثرائها في المنصة لمساعدة الطلاب الذين يعانون من انقطاع الكهرباء والإنترنت.</li>
        <li><strong>الالتزام بالمواعيد:</strong> إعلام مشرف المادة مسبقاً في حال طرأ أي ظرف يحول دون إعطاء الحصة المجدولة لترتيب البديل.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" class="btn" target="_blank">
        🚀 الدخول إلى حسابك في المنصة والبدء
      </a>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
        أو انسخ الرابط المباشر: <span style="direction: ltr; display: inline-block;">${data.loginUrl}</span>
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
  const subject = `بشأن طلب التطوع في منصة باقون التعليمية | أ. ${data.fullName}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 13px;">
        📋 إشعار مآل دراسة ملف التطوع
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        الأستاذ الفاضل: ${data.fullName}
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
        💡 ملاحظة المشرف الأكاديمي:
      </h4>
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
        ${data.reason}
      </p>
    </div>
    ` : ''}

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #166534; font-size: 14px; line-height: 1.7;">
      <strong>🌱 ملفكم محفوظ في بنك الكفاءات الاحتياطي:</strong>
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
  const subject = `استلام طلب التطوع والتدريس بنجاح | منصة باقون`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 13px;">
        📬 تم استلام طلبكم بنجاح
      </span>
      <h2 style="margin: 10px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">
        أهلاً بك أ. ${data.fullName}
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
      <strong style="color: #334155; font-size: 13px;">📚 المواد المختارة للتدريس:</strong>
      <span style="font-weight: bold; color: #059669; margin-right: 6px;">${data.subjects.join('، ')}</span>
    </div>
    ` : ''}

    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px; font-size: 14px; color: #0f172a; font-weight: 800;">
        ⏳ مراحل دراسة الملف واعتماد الحساب:
      </h4>
      <ol style="margin: 0; padding-right: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
        <li>مراجعة التخصص والخبرة من قبل <strong>المشرف الأكاديمي للمادة</strong>.</li>
        <li>الاعتماد النهائي وإسناد الأفواج من قبل <strong>إدارة المنصة</strong>.</li>
        <li>إشعاركم فوراً بالقرار الرسمي وتفعيل الحساب وتزويدكم ببيانات الدخول عبر البريد الإلكتروني.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.trackingUrl}" class="btn" target="_blank">
        🔍 الاستعلام عن حالة الملف من البوابة
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
