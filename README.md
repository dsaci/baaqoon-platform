<div align="center">

# 🌿 منصة باقون التعليمية — Baaqoon Platform

**منصة تعليمية ذكية لدعم الطلاب الفلسطينيين في غزة**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

</div>

---

## 📖 نبذة عن المشروع

**باقون** هي منصة تعليمية شاملة تم بناؤها لدعم المسيرة التعليمية للطلاب الفلسطينيين في غزة، وتضم:

- 👨‍🏫 **الأساتذة**: بناء حصص ذكية، توليد اختبارات تلقائياً، جدولة حصص مباشرة
- 👩‍🎓 **الطلبة**: متابعة الحصص، أداء الاختبارات عبر واجهة تفاعلية، الاطلاع على الدرجات
- 👁️ **المشرفون / المنسقون**: متابعة الأداء والإشراف على المواد
- 👑 **المدير العام**: لوحة تحكم شاملة بكل الإحصائيات

---

## 🏗️ البنية التقنية

```
baaqoon/
├── packages/
│   ├── frontend/          # React + Vite + TailwindCSS
│   └── backend/           # NestJS + Prisma + PostgreSQL
├── .gitignore
└── package.json           # Monorepo root
```

| الطبقة | التقنيات |
|--------|----------|
| **الواجهة الأمامية** | React 18, TypeScript, TailwindCSS, React Query, Zustand, React Router |
| **الواجهة الخلفية** | NestJS, TypeScript, Prisma ORM, JWT Auth |
| **قاعدة البيانات** | PostgreSQL (multi-schema: auth, curriculum, groups, scheduling, assessments) |
| **الفصول المباشرة** | Jitsi Meet Integration |

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js 18+
- PostgreSQL 15+
- npm 9+

### الخطوات

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/baaqoon.git
cd baaqoon

# 2. تثبيت التبعيات
npm install

# 3. إعداد ملف البيئة
cp packages/backend/.env.example packages/backend/.env
# عدّل DATABASE_URL و JWT_SECRET

# 4. تهيئة قاعدة البيانات
cd packages/backend
npx prisma migrate deploy
npx prisma db seed
cd ../..

# 5. تشغيل المنصة
npm run dev:backend   # الخادم الخلفي على http://localhost:4000
npm run dev:frontend  # الواجهة الأمامية على http://localhost:3000
```

---

## 👥 الحسابات التجريبية

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|-------------------|-------------|
| 👑 مدير عام | `admin@baaqoon.ps` | `Baaqoon2024!` |
| 👁️ مشرف | `supervisor@baaqoon.ps` | `Baaqoon2024!` |
| 👨‍🏫 أستاذ | `demo@baaqoon.ps` | `Baaqoon2024!` |
| 👩‍🎓 طالب | `student1@baaqoon.ps` | `Baaqoon2024!` |

---

## 📚 المواد المتوفرة في قاعدة البيانات

- ✅ الدراسات الجغرافية (مكتملة مع الدروس وأسئلة التقييم)
- ✅ التربية الإسلامية (مكتملة مع 5 وحدات و25 درساً)
- 📋 الدراسات التاريخية
- 📋 اللغة العربية
- 📋 الفيزياء
- 📋 الرياضيات
- 📋 الكيمياء

---

## 📄 الرخصة

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

<div align="center">

**🇵🇸 باقون... رغم كل شيء 🇵🇸**

</div>
