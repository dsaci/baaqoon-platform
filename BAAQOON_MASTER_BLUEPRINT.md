# 🌿 المخطط الموسوعي والتوثيق الشامل لمنصة باقون التعليمية
# Baaqoon Educational Platform — Master Technical & Architectural Blueprint
> **الوثيقة المرجعية الشاملة لكافة مكونات المنظومة (Backend, Frontend, Database, DevOps, Operations)**  
> **الإصدار:** 2.4.0 — الإنتاج الحي | **تاريخ التحديث:** أكتوبر 2026

---

## فهرس المحتويات
1. [الرؤية والرسالة والسياق التعليمي والوطني](#1-الرؤية-والرسالة-والسياق-التعليمي-والوطني)
2. [المعمارية الشاملة وحزمة التقنيات (Full Tech Stack)](#2-المعمارية-الشاملة-وحزمة-التقنيات-full-tech-stack)
3. [هيكلية مستودع الكود (Monorepo Architecture)](#3-هيكلية-مستودع-الكود-monorepo-architecture)
4. [مخطط ونموذج قاعدة البيانات بالكامل (Complete Database Schema)](#4-مخطط-ونموذج-قاعدة-البيانات-بالكامل-complete-database-schema)
5. [نموذج الصلاحيات والأمان (RBAC, Multi-Role & Security Gates)](#5-نموذج-الصلاحيات-والأمان-rbac-multi-role--security-gates)
6. [محرك المناهج والأفواج والعمليات الأكاديمية (Academic Engine)](#6-محرك-المناهج-والأفواج-والعمليات-الأكاديمية-academic-engine)
7. [بوابة المعلمين المتطوعين ودورة حياة الاعتماد (Volunteer Portal)](#7-بوابة-المعلمين-المتطوعين-ودورة-حياة-الاعتماد-volunteer-portal)
8. [بوابة المراسلات والبريد الإلكتروني (Email Delivery & GAS Gateway)](#8-بوابة-المراسلات-والبريد-الإلكتروني-email-delivery--gas-gateway)
9. [دليل مسارات واجهات البرمجة الخلفية (Complete REST API Reference)](#9-دليل-مسارات-واجهات-البرمجة-الخلفية-complete-rest-api-reference)
10. [دليل واجهات وصفحات المستخدم الأمامية (Frontend Pages & UI Map)](#10-دليل-واجهات-وصفحات-المستخدم-الأمامية-frontend-pages--ui-map)
11. [الأرقام التشغيلية الحية للنظام (Live Operational Metrics)](#11-الأرقام-التشغيلية-الحية-للنظام-live-operational-metrics)
12. [معايير التطوير البرمجي والهوية البصرية (Dev Standards & Brand Guidelines)](#12-معايير-التطوير-البرمجي-والهوية-البصرية-dev-standards--brand-guidelines)
13. [البنية التحتية والنشر والمتغيرات البيئية (DevOps & Environment Variables)](#13-البنية-التحتية-والنشر-والمتغيرات-البيئية-devops--environment-variables)
14. [خارطة الطريق المستقبلية (Future Roadmap)](#14-خارطة-الطريق-المستقبلية-future-roadmap)

---

## 1. الرؤية والرسالة والسياق التعليمي والوطني

### 1.1 من نحن؟
**منصة باقون التعليمية** مبادرة تطوعية إنسانية وأكاديمية تأسست لإسناد وتمكين طلبة فلسطين عموماً وقطاع غزة خصوصاً، لضمان استمرار حقهم الإنساني والطبيعي في التعليم ومكافحة الانقطاع القسري عن المدارس الناتج عن الحرب وتدمير المنشآت التعليمية.

### 1.2 الفئات والمسارات الأكاديمية المدعومة:
1. **الثانوية العامة الفلسطينية (التوجيهي):**
   - **الفرع العلمي:** الفيزياء، الكيمياء، العلوم الحياتية (الأحياء)، الرياضيات، اللغة العربية، اللغة الإنجليزية، التربية الإسلامية.
   - **الفرع الأدبي:** التاريخ، الجغرافيا، الرياضيات، اللغة العربية، اللغة الإنجليزية، الثقافة العلمية.
   - **الفرع الشرعي / الأزهري:** الفقه، أصول الفقه، الحديث الشريف، التفسير، النحو والصرف، البلاغة.
2. **الصفوف الانتقالية:** الصف الحادي عشر والصف العاشر لدعم التأسيس الأكاديمي.
3. **الكادر التعليمي:** نخبة من الأساتذة والمشرفين المتطوعين من فلسطين والجزائر ومصر والأردن ومختلف الدول العربية ودول الاغتراب.

### 1.3 محددات البيئة الميدانية:
* **الاتصال الضعيف والمتقطع:** تصميم منخفض استهلاك البيانات (`Low-Bandwidth Optimization`).
* **شاشات الهواتف والأجهزة اللوحية:** واجهات متجاوبة بالكامل بنظام الهاتف أولاً (`Mobile-First Responsive Design`).
* **مرونة الوصول:** إمكانية الدخول بالبريد الإلكتروني أو برقم الهاتف الدولي الموثق مع مفتاح الدولة.

---

## 2. المعمارية الشاملة وحزمة التقنيات (Full Tech Stack)

```mermaid
flowchart TB
    subgraph ClientLayer["واجهات المستخدم (Client Layer)"]
        BrowserStudent["واجهة الطالب (React + Vite)"]
        BrowserTeacher["واجهة المعلم (React + Vite)"]
        BrowserSupervisor["واجهة المشرف (React + Vite)"]
        BrowserAdmin["لوحة الإدارة الشاملة (React + Vite)"]
    end

    subgraph CDNLayer["طبقة التوزيع والتوجيه"]
        VercelCDN["Vercel Global Edge Network\n(baaqoon-platform.vercel.app)"]
    end

    subgraph APILayer["خادم التطبيقات (Backend Application Layer)"]
        NestApp["NestJS 10 Application Server\n(Hosted on Render / Linux Node 20)"]
        Guards["Auth Guards & Roles Guard (JWT)"]
        Services["Domain Services (Auth, Curriculum, Cohorts, Attendance, Volunteer, Email)"]
    end

    subgraph DataLayer["طبقة البيانات والخدمات السحابية"]
        SupabaseDB[("PostgreSQL Database\n(Hosted on Supabase with PgBouncer)")]
        PrismaORM["Prisma ORM 5.22\n(Connection Pooling + Type Safety)"]
    end

    subgraph IntegrationLayer["طبقة التكامل الخارجي (Integrations)"]
        GAS["Google Apps Script Gateway (Mail Relay)"]
        Gmail["Google Workspace Mail Engine"]
        CloudinaryDrive["Storage / Media Services"]
    end

    ClientLayer -->|HTTPS / WSS| VercelCDN
    VercelCDN -->|REST API Requests / JWT| NestApp
    NestApp --> Guards --> Services
    Services --> PrismaORM --> SupabaseDB
    Services -->|Async HTTP Webhook| GAS --> Gmail
```

---

## 3. هيكلية مستودع الكود (Monorepo Architecture)

```
baaqoon/
├── package.json                          # إعدادات مساحة العمل وإدارة الحزم
├── packages/
│   ├── backend/                          # خادم NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma             # مخطط قاعدة البيانات والنماذج العلائقية
│   │   ├── src/
│   │   │   ├── main.ts                   # نقطة الدخول، إعداد CORS، و Global Pipes
│   │   │   ├── app.module.ts             # الموديول الجذري وتجميع كافة الوحدات
│   │   │   ├── common/                   # الأدوات المشتركة والـ Guards والـ Interceptors
│   │   │   │   ├── guards/               # JwtAuthGuard, RolesGuard
│   │   │   │   ├── decorators/           # @Roles, @CurrentUser
│   │   │   │   └── filters/              # Global Exception Filter
│   │   │   └── modules/                  # الوحدات الوظيفية المستقلة
│   │   │       ├── auth/                 # المصادقة، إدارة المستخدمين، وبوابة المتطوعين
│   │   │       ├── curriculum/           # المواد، المقررات، المناهج، والدروس المسجلة
│   │   │       ├── groups/               # الأفواج، تفويج الطلاب، وتعيين المعلمين
│   │   │       ├── scheduling/           # الحصص، الجداول، ورصد الحضور والغياب
│   │   │       ├── assessments/          # الواجبات، بنك الأسئلة، وتصحيح المهام
│   │   │       ├── chat/                 # الرسائل المباشرة وغرف المحادثة
│   │   │       ├── notifications/        # نظام الإشعارات الفورية
│   │   │       └── email/                # محرك البريد وتكامل Google Script
│   └── frontend/                         # تطبيق الويب (React 18 + Vite)
│       ├── index.html                    # نقطة البداية للمتصفح
│       ├── vite.config.ts                # إعدادات Vite ومسارات التحزيم
│       ├── tailwind.config.js            # تخصيص ألوان باقون والسمات الداكنة
│       └── src/
│           ├── main.tsx                  # تشغيل التطبيق وتغليف الموفرات (Providers)
│           ├── App.tsx                   # شجرة التوجيه والمسارات المحمية
│           ├── assets/                   # الشعارات والصور الرسمية
│           ├── components/
│           │   ├── layout/               # DashboardLayout, Navbar, Sidebar
│           │   ├── shared/               # ForceChangePasswordGate, CompleteContactModal
│           │   ├── tour/                 # الدليل التفاعلي الحي (AppTour)
│           │   └── guide/                # دليل المنصة الشامل المنبثق
│           ├── features/                 # وحدات الميزات مقسمة حسب الأدوار
│           │   ├── admin/                # إدارة الموارد، الاستمارات، وسجلات النشاط
│           │   ├── auth/                 # صفحات الدخول والتسجيل وبوابة التطوع
│           │   ├── supervisor/           # فضاء المشرف، متابعة المعلمين، والأفواج
│           │   ├── teacher/              # فضاء المعلم، تحضير الدروس، وإسناد المهام
│           │   ├── student/              # فضاء الطالب، الواجبات، والمكتبة الرقمية
│           │   ├── curriculum/           # توزيع المناهج والدروس المسجلة
│           │   ├── scheduling/           # الجداول الأسبوعية ورصد الحضور
│           │   └── landing/              # الصفحة التعريفية الرئيسية
│           ├── store/                    # مخازن الحالة (Zustand: useAuthStore)
│           ├── services/                 # دوال الاتصال بـ Axios
│           └── locales/                  # ملفات الترجمة (ar.json / en.json)
└── scratch/                              # سكريبتات العمليات، الصيانة، والتحليلات
```

---

## 4. مخطط ونموذج قاعدة البيانات بالكامل (Complete Database Schema)

يعتمد النظام على `PostgreSQL` عبر `Prisma ORM 5.22` مقسماً على مخططات (`users`, `curriculum`, `groups`, `scheduling`, `assessments`, `chat`, `notifications`, `public`):

### 4.1 التعدادات الأساسية (Enums):
* **`UserRole`:** `super_admin`, `admin`, `subject_supervisor`, `teacher`, `student`, `tech_support`.
* **`UserStatus`:** `active`, `suspended`, `pending`.
* **`AcademicBranch`:** `scientific` (علمي), `literary` (أدبي), `sharia` (شرعي / أزهري), `vocational` (مهني), `general` (عام).
* **`CurriculumType`:** `palestinian` (المنهاج الفلسطيني), `azhari` (المنهاج الأزهري).
* **`GradeLevel`:** `grade_10`, `grade_11`, `grade_12_tawjihi`.
* **`CohortStatus`:** `forming`, `active`, `paused`, `completed`, `cancelled`.
* **`AttendanceStatus`:** `present` (حاضر), `absent` (غائب), `late` (متأخر), `excused` (معذور).
* **`ApplicationStatus`:** `pending`, `reviewed`, `approved`, `rejected`, `converted`.

### 4.2 النماذج والعلاقات الرئيسية:

```mermaid
erDiagram
    User ||--o{ UserRoleAssignment : has_roles
    User ||--o{ CohortInstructor : teaches
    User ||--o{ CohortEnrollment : enrolled_in
    User ||--o{ SessionAttendance : attends
    User ||--o{ ActivityLog : generates
    User ||--o{ Notification : receives
    User ||--o{ VolunteerApplication : converted_from
    
    Subject ||--o{ Course : contains
    Subject ||--o{ Cohort : categorizes
    Subject ||--o{ SyllabusDistribution : outlines
    
    Cohort ||--o{ CohortInstructor : assigned_teachers
    Cohort ||--o{ CohortEnrollment : roster_students
    Cohort ||--o{ Session : conducts
    Cohort ||--o{ Assessment : assigns

    Session ||--o{ SessionAttendance : records
    Assessment ||--o{ AssessmentSubmission : submits
    AssessmentSubmission ||--o{ SubmissionAttachment : attaches
```

---

## 5. نموذج الصلاحيات والأمان (RBAC, Multi-Role & Security Gates)

### 5.1 ميزة الدور المزدوج (Dual-Role Architecture):
* في النظام التعليمي، يوجد أساتذة متميزون يدرسون حصصاً وفي الوقت ذاته يشرفون على المادة ككل.
* يدعم النظام جدول `UserRoleAssignment` لتمكين المعلم من امتلاك دورين في آن واحد (`teacher` + `subject_supervisor`).
* تتيح الواجهة مفتاح تحويل فوري أعلى لوحة التحكم (`Workspace Switcher`) للتبديل بين الصلاحيات دون تسجيل خروج.

### 5.2 بوابات الأمان الصارمة (Security Gates):
1. **`ForceChangePasswordGate`:** تجميد تصفح المنصة إجبارياً للحسابات المنشأة حديثاً بكلمات مرور مؤقتة حتى يقوم المستخدم بتعيين كلمة سر خاصة جديدة مكونة من 8 خانات على الأقل.
2. **`MandatorySubjectGate`:** تجميد تصفح المعلم أو المشرف حتى يتم ربط حسابه بمادة تخصصه الرسمية لتجنب الفوضى الأكاديمية وضمان ظهور الحساب في جداول الإسناد.
3. **`CompleteContactModal`:** تذكير أمني ذكي يلزم استكمال رقم الواتساب الدولي والبريد والجنسية لمنع فقدان الوصول للحساب واستقبال التنبيهات.

---

## 6. محرك المناهج والأفواج والعمليات الأكاديمية (Academic Engine)

* **الأفواج الدراسية (49 فوجاً حالياً):** تمثل الشعب الصفية الافتراضية، ولكل فوج:
  * المادة الدراسية والفرع (علمي / أدبي / شرعي).
  * المعلم الأساسي أو المعلمون المساعدون (`CohortInstructor`).
  * قائمة الطلبة المقيدين ومتابعة حضورهم (`CohortEnrollment`).
* **توزيع المناهج والخطة الزمنية (`SyllabusDistribution`):**
  * تقسيم المنهاج شهرياً (سبتمبر، أكتوبر، نوفمبر...).
  * احتساب عدد الحصص المنجزة لكل أستاذ آلياً مقارنة بالحضور المسجل.
  * إطلاق تنبيهات التأخر الأكاديمي آلياً للمشرفين في حال تخلف أي فوج عن خطته المقررة.
* **التقييمات وبنك الأسئلة ومخيمات الامتحانات (`ExamPrepCamp`):**
  * بنك أسئلة معياري للمنهاج الفلسطيني مقسم حسب الدروس والوحدات.
  * إنشاء الواجبات والامتحانات التجريبية، رفع الحلول من قبل الطلبة، وتصحيحها من قبل المعلمين مع التغذية الراجعة.

---

## 7. بوابة المعلمين المتطوعين ودورة حياة الاعتماد (Volunteer Portal)

```mermaid
stateDiagram-v2
    [*] --> FormSubmitted: تقديم الاستمارة العامة (/volunteer-portal)
    FormSubmitted --> UnderSupervisorReview: فرز الاستمارة حسب مادة التخصص
    UnderSupervisorReview --> SupervisorApproved: اعتماد المشرف الأكاديمي
    UnderSupervisorReview --> SupervisorRejected: رفض المشرف مع ذكر السبب
    SupervisorApproved --> AdminConversion: موافقة الإدارة النهائية
    AdminConversion --> OfficialTeacherAccount: إنشاء حساب مستخدم وتعيين الصلاحيات
    OfficialTeacherAccount --> WelcomeEmailSent: إرسال بيانات الدخول عبر البريد
    WelcomeEmailSent --> [*]
```

* تتيح البوابة العامة للمتطوعين حول العالم التقديم وتحديد التخصص وسنوات الخبرة والجاهزية التقنية.
* ترتبط الاستمارة آلياً بالمشرف الأكاديمي المختص بالمادة لدراسة الملف وتدقيقه.
* بنقرة زر واحدة من لوحة إدارة الموارد البشرية (`convert-to-teacher`):
  1. يتم إنشاء حساب أستاذ رسمي وتشفير كلمة مروره.
  2. يتم إسناد مادة التدريس وتعيين الدور `teacher`.
  3. يتم إرسال رسالة ترحيبية رسمية عبر البريد الإلكتروني تتضمن بيانات الدخول ورابط المنصة.

---

## 8. بوابة المراسلات والبريد الإلكتروني (Email Delivery & GAS Gateway)

### 8.1 تحدي خوادم الاستضافة ومنافذ SMTP:
* بيئات الاستضافة السحابية مثل Render تغلق منافذ SMTP (25, 465, 587) لحظر الرسائل العشوائية.
* **الحل المبتكر لمنصة باقون:** تم بناء بوابة مرحل بريدي عبر **Google Apps Script Web App** تعمل عبر بروتوكول HTTPS المشفر، مما يضمن وصول البريد بنسبة 100% وبسرعة فائقة.

### 8.2 فلترة وتجريد الرموز التعبيرية (Emoji Stripping):
* لتفادي أخطاء محركات الترميز وعملاء البريد القديمة التي تحول الرموز التعبيرية إلى علامات استفهام مشوهة (`???`):
  * تم تنظيف كافة القوالب الرسمية (`email.templates.ts`).
  * تم بناء فلتر برمجي دائم في دالة الإرسال `stripEmojis()` يقوم بتجريد أي إيموجي تلقائياً قبل تسليم الرسالة لمحرك الإرسال.

---

## 9. دليل مسارات واجهات البرمجة الخلفية (Complete REST API Reference)

| المسار (Endpoint) | الطريقة | الصلاحية المطلوبة | الوصف والوظيفة |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | عام | تسجيل الدخول برقم الهاتف أو البريد الإلكتروني |
| `/api/auth/register` | `POST` | عام | تسجيل حساب طالب جديد وتوثيقه |
| `/api/auth/forgot-password`| `POST` | عام | طلب استعادة كلمة المرور عبر البريد أو الهاتف |
| `/api/auth/me` | `GET` | مصادق عليه | جلب بيانات الجلسة الحالية والصلاحيات والمادة |
| `/api/users/profile` | `PATCH`| مصادق عليه | تحديث بيانات الملف الشخصي (البريد، الهاتف، الجنسية) |
| `/api/users/change-password`| `POST`| مصادق عليه | تغيير كلمة المرور وفك بوابة الأمان |
| `/api/users/assign-subject`| `POST` | مدير / مشرف | إسناد وتثبيت مادة التدريس للمعلم |
| `/api/volunteer/apply` | `POST` | عام | تقديم استمارة تطوع جديدة كمعلم |
| `/api/volunteer/applications` | `GET` | مدير / مشرف | استعراض استمارات المتطوعين مع الفلترة والبحث |
| `/api/volunteer/applications/:id/convert-to-teacher` | `POST` | مدير المنصة | اعتماد ملف المتطوع وتحويله آلياً لحساب أستاذ رسمي |
| `/api/groups/cohorts` | `GET` | مصادق عليه | استعراض الأفواج الدراسية وبياناتها |
| `/api/groups/cohorts` | `POST` | مدير المنصة | إنشاء فوج دراسي جديد وإسناد الطلاب والمعلم |
| `/api/sessions` | `GET` | مصادق عليه | جلب الحصص المجدولة وجدول الأسبوع |
| `/api/sessions/:id/attendance`| `POST` | معلم / مشرف | رصد وتثبيت الحضور والغياب للطلاب |
| `/api/syllabus/distributions` | `GET` | مصادق عليه | استعراض الخطط الشهرية وتوزيع المنهاج |
| `/api/curriculum/recorded-lessons` | `GET` | مصادق عليه | استعراض الحصص المسجلة والمكتبة الرقمية |
| `/api/assessments` | `GET` | مصادق عليه | استعراض الواجبات والامتحانات ومخيمات التوجيهي |
| `/api/notifications` | `GET` | مصادق عليه | استرجاع الإشعارات الفورية للمستخدم الحالي |

---

## 10. دليل واجهات وصفحات المستخدم الأمامية (Frontend Pages & UI Map)

```mermaid
graph LR
    subgraph Public["الفضاء العام"]
        Landing["الصفحة التعريفية (LandingPage)"]
        Login["تسجيل الدخول (LoginPage)"]
        Register["تسجيل طالب (RegisterPage)"]
        VolPortal["بوابة التطوع (VolunteerPortalPage)"]
    end

    subgraph CoreDashboard["لوحة التحكم الموحدة (DashboardLayout)"]
        StudentDash["فضاء الطالب (StudentDashboard)"]
        TeacherDash["فضاء المعلم (TeacherDashboard)"]
        SupervisorDash["فضاء المشرف (SupervisorDashboard)"]
        AdminDash["لوحة الإدارة الشاملة (AdminDashboard)"]
    end

    subgraph Features["الوحدات التفاعلية"]
        CohortsView["إدارة الأفواج والشعب"]
        ScheduleView["الجدول والحصص والرصد"]
        AssessmentsView["الواجبات وبنك الأسئلة"]
        RecordedView["الدروس المسجلة الرقمية"]
        SyllabusView["توزيع المناهج والخطط"]
        HRView["إدارة شؤون المعلمين والمتطوعين"]
        ChatView["المحادثات وغرف التواصل"]
    end

    Public --> CoreDashboard
    CoreDashboard --> Features
```

---

## 11. الأرقام التشغيلية الحية للنظام (Live Operational Metrics)

*قراءة دقيقة ومباشرة من قاعدة البيانات الإنتاجية بتاريخ 21 أكتوبر 2026:*

* **إجمالي الحسابات المسجلة:** **197** مستخدماً.
* **الطلبة المقيدون:** **119** طالباً في المراحل التعليمية.
* **المعلمون المعتمدون:** **63** معلماً متخصصاً.
* **المشرفون التربويون:** **12** مشرفاً أكاديمياً.
* **الأفواج الدراسية النشطة:** **49** فوجاً دراسياً موزعاً على التخصصات.
* **المواد المعتمدة في المنهاج:** **11** مادة فلسطينية وأزهرية.
* **الحصص المجدولة والمسجلة:** **28** حصة دراسية.
* **استمارات التطوع قيد الفرز:** **4** استمارات متطوعين جديدة.

---

## 12. معايير التطوير البرمجي والهوية البصرية (Dev Standards & Brand Guidelines)

> [!IMPORTANT]
> **قواعد صارمة لضمان سلامة الكود واستقرار المنصة:**

### 12.1 لوحة ألوان الهوية البصرية (Brand Palette):
* **الزيتوني الملكي الداكن (`Deep Olive`):** `#1F2A18` — خلفيات البطاقات الرئيسية والهيدر.
* **الزيتوني العشبي (`Baaqoon Olive`):** `#394C2A` — لون الهوية الرسمي، الأزرار الأساسية، والعناصر التفاعلية.
* **الذهبي الفاخر (`Warm Gold`):** `#c9b48a` — الحدود الدقيقة، الأيقونات المميزة، وأزرار الإجراءات الذهبية.
* **الرملي الفاتح (`Sand Paper`):** `#FAF7F2` — خلفية الصفحات والبطاقات الفاتحة.

### 12.2 قواعد الواجهات المتجاوبة ومنع فيضان الإطارات (`Overflow Prevention`):
* تجنب استخدام العروض الثابتة (`w-[800px]`).
* في عناصر Flexbox التي تحتوي نصوصاً وأزراراً:
  * يجب دائماً وضع `flex-1 min-w-0` على حاوية النصوص للسماح بالالتفاف الداخلي.
  * يجب استخدام `break-words` للعناوين والفقرات.
  * يجب وضع `w-full max-w-full overflow-hidden` على البطاقات لمنع تمددها خارج شاشات التابلت والهواتف.

### 12.3 تطبيع بيانات الاتصال والهوية:
* **البريد الإلكتروني:** استخدام `normalizeEmail()` دائماً لإزالة الفراغات وتحويل الحروف إلى صغيرة.
* **أرقام الهواتف:** استخدام `normalizePhone()` لإزالة الأصفار الزائدة والتحقق من ذيل الرقم (`phoneTail`) بمطابقة آخر 8 خانات لمنع تكرار نفس الرقم بصيغ دولية مختلفة.

---

## 13. البنية التحتية والنشر والمتغيرات البيئية (DevOps & Environment Variables)

### 13.1 متغيرات بيئة الواجهة الأمامية (`packages/frontend/.env`):
```env
VITE_API_URL=https://baaqoon-backend.onrender.com/api
VITE_RECAPTCHA_SITE_KEY=6Ld...
```

### 13.2 متغيرات بيئة الخادم الخلفي (`packages/backend/.env`):
```env
PORT=3000
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="baaqoon-super-secret-jwt-key..."
JWT_EXPIRATION="7d"
GOOGLE_SCRIPT_MAIL_URL="https://script.google.com/macros/s/AKfycb.../exec"
FRONTEND_URL="https://baaqoon-platform.vercel.app"
```

---

## 14. خارطة الطريق المستقبلية (Future Roadmap)

1. **غرف البث التفاعلي خفيفة الباندويث (Ultra Low-Bandwidth Live Class):**
   * تقنية WebRTC مخصصة لنقل الصوت والسبورة البيضاء فقط بدلاً من الفيديو عالي الجودة لمراعاة شبكات غزة.
2. **النسخة المستقلة بدون اتصال (Offline PWA Sync):**
   * تحميل المناهج والواجبات تلقائياً، والعمل بدون اتصال، ومزامنة الدرجات بمجرد التقاط إشارة الإنترنت.
3. **الفرز الأكاديمي الذكي (AI Auto-Rostering):**
   * خوارزمية لتوزيع الطلاب تلقائياً على الأفواج حسب الفرع والمستوى وسعة الشعب.
4. **تطبيق الهاتف المحمول (Baaqoon Flutter/React Native):**
   * تطبيق مخصص يدعم الإشعارات اللحظية وحفظ الحصص للتشغيل بدون إنترنت.

---
**منصة باقون التعليمية — غزة باقية.. والعلم سلاحنا الذي لا يُهزم 🌿**
