/**
 * Automated Academic Dossier Evaluator for Volunteer Teachers
 * Specifically engineered for dual/multi-subject supervisors and administration.
 */

export interface SubjectSuitability {
  subjectName: string;
  score: number;
  isApplied: boolean;
  isDegreeMatch: boolean;
  matchedKeywords: string[];
}

export interface DossierAnalysis {
  score: number;
  tier: 'highly_recommended' | 'qualified' | 'needs_review' | 'low_match';
  tierLabel: string;
  tierColor: string;
  targetSubject: string;
  allMatchingSubjects: string[];
  subjectSuitability: SubjectSuitability[];
  strengths: string[];
  concerns: string[];
  suggestedRecommendation: string;
  suggestedRejection: string;
}

// Academic keywords mapping for subject matching
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  'التاريخ': ['تاريخ', 'حضارة', 'دراسات إنسانية', 'تاريخي', 'تاريخية', 'علوم اجتماعية', 'history', 'civilization'],
  'الجغرافيا': ['جغرافيا', 'خرائط', 'تخطيط', 'جيولوجيا', 'بيئة', 'geography', 'earth', 'gis'],
  'الفيزياء': ['فيزياء', 'فيزيائي', 'طبيعة', 'طاقة', 'نانو', 'physics', 'physical'],
  'الكيمياء': ['كيمياء', 'كيميائي', 'صيدلة', 'تحاليل', 'مخبري', 'chemistry', 'biochemistry'],
  'التربية الإسلامية': ['إسلامية', 'شريعة', 'أصول دين', 'قرآن', 'حديث', 'فقه', 'تفسير', 'عقيدة', 'دراسات إسلامية', 'islamic'],
  'اللغة العربية وآدابها': ['عربي', 'عربية', 'لغة عربية', 'أدب', 'لسانيات', 'نحو', 'صرف', 'بلاغة', 'arabic'],
  'اللغة الإنجليزية': ['إنجليزي', 'إنجليزية', 'ترجمة', 'أدب إنجليزي', 'لغويات', 'english', 'translation', 'tefl', 'tesol'],
  'الرياضيات': ['رياضيات', 'رياضي', 'إحصاء', 'جبر', 'تفاضل', 'تكامل', 'هندسة رياضية', 'math', 'mathematics', 'statistics'],
  'العلوم الحياتية (الأحياء)': ['أحياء', 'بيولوجيا', 'علوم طبيعية', 'علوم الحياة', 'طب', 'تمريض', 'علوم بيولوجية', 'biology'],
  'التكنولوجيا والبرمجة': ['تكنولوجيا', 'حاسوب', 'معلوماتية', 'برمجة', 'شبكات', 'ذكاء اصطناعي', 'هندسة حاسوب', 'نظم معلومات', 'it', 'computer', 'software', 'programming'],
  'العلوم اللغوية': ['لغة', 'لسانيات', 'لغات', 'ترجمة', 'نحو'],
  'العلوم الشرعية': ['شريعة', 'فقه', 'أصول', 'حديث', 'تفسير', 'قرآن', 'قراءات'],
};

/**
 * Normalizes Arabic text for flexible matching (removes diacritics, unifies alef, taa marbuta)
 */
function normalizeAr(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

/**
 * Calculates academic match score and generates automated evaluation for an application.
 */
export function evaluateTeacherDossier(
  app: any,
  supervisedSubjects: Array<{ id: string; nameAr: string; code?: string }>,
): DossierAnalysis {
  let score = 0;
  const strengths: string[] = [];
  const concerns: string[] = [];

  const rawSpecialty = `${app.specialty || ''} ${app.university || ''} ${app.teachingField || ''}`;
  const normSpecialty = normalizeAr(rawSpecialty);
  const applicantSubjects: string[] = Array.isArray(app.subjects) ? app.subjects : [];
  const normApplicantSubjects = applicantSubjects.map(s => normalizeAr(s));

  // Determine which subjects to evaluate against
  // If supervisedSubjects are provided, prioritize them; otherwise use applicant's selected subjects
  const evalSubjects = supervisedSubjects.length > 0 
    ? supervisedSubjects.map(s => s.nameAr)
    : applicantSubjects;

  const subjectSuitability: SubjectSuitability[] = [];
  const matchingSubjectNames: string[] = [];

  for (const subName of evalSubjects) {
    let subScore = 0;
    const matchedKeywords: string[] = [];
    const isApplied = normApplicantSubjects.some(as => as.includes(normalizeAr(subName)) || normalizeAr(subName).includes(as));
    
    if (isApplied) {
      subScore += 40;
    }

    // Match keywords against specialty & university
    const keywords = SUBJECT_KEYWORDS[subName] || [normalizeAr(subName)];
    let isDegreeMatch = false;

    for (const kw of keywords) {
      const normKw = normalizeAr(kw);
      if (normSpecialty.includes(normKw)) {
        matchedKeywords.push(kw);
        isDegreeMatch = true;
      }
    }

    if (isDegreeMatch) {
      subScore += 50;
    } else {
      // Check partial match with subject name itself
      const normSub = normalizeAr(subName);
      if (normSpecialty.includes(normSub) || normSub.includes(normSpecialty)) {
        matchedKeywords.push(subName);
        isDegreeMatch = true;
        subScore += 40;
      }
    }

    if (isApplied || isDegreeMatch) {
      matchingSubjectNames.push(subName);
    }

    subjectSuitability.push({
      subjectName: subName,
      score: Math.min(100, subScore),
      isApplied,
      isDegreeMatch,
      matchedKeywords,
    });
  }

  // 1. Academic Specialty Score (Max 40 points)
  const hasAnyDegreeMatch = subjectSuitability.some(s => s.isDegreeMatch);
  if (hasAnyDegreeMatch) {
    score += 40;
    const matchNames = subjectSuitability.filter(s => s.isDegreeMatch).map(s => s.subjectName);
    strengths.push(`تخصص جامعي مطابق بدقة لمادة (${matchNames.join(' و ')})`);
  } else if (app.specialty?.trim()) {
    score += 25;
    strengths.push(`تخصص أكاديمي مدخل: ${app.specialty}`);
  } else {
    score += 10;
    concerns.push('لم يتم تحديد التخصص الأكاديمي بدقة في الاستمارة');
  }

  // 2. Teaching Experience (Max 30 points)
  const rawExpYears = String(app.experienceYears || '').trim();
  const rawExpNum = parseInt(rawExpYears, 10);
  const expDetails = (app.experienceDetails || '').toLowerCase();

  if (!isNaN(rawExpNum) && rawExpNum >= 5) {
    score += 30;
    strengths.push(`خبرة تدريسية عريقة (${rawExpNum} سنوات)`);
  } else if (!isNaN(rawExpNum) && rawExpNum >= 3) {
    score += 25;
    strengths.push(`خبرة تدريسية متوسطة (${rawExpNum} سنوات)`);
  } else if (!isNaN(rawExpNum) && rawExpNum >= 1) {
    score += 18;
    strengths.push(`خبرة تدريسية أولية (${rawExpNum} سنة)`);
  } else if (app.hasExperience) {
    score += 15;
    strengths.push('يمتلك خبرة تدريسية سابقة');
  } else {
    score += 5;
    concerns.push('لا توجد خبرة تدريسية سابقة مثبتة');
  }

  if (expDetails.includes('توجيهي') || expDetails.includes('ثانوي') || expDetails.includes('بكالوريا') || expDetails.includes('high school')) {
    score = Math.min(70, score + 5);
    strengths.push('خبرة محددة في تدريس مرحلة الثانوية العامة (التوجيهي / البكالوريا)');
  }

  // 3. Technical Equipment & Internet Readiness (Max 20 points)
  const devices = Array.isArray(app.deviceType) ? app.deviceType.map((d: any) => String(d).toLowerCase()) : [];
  const hasPC = devices.some((d: string) => d.includes('pc') || d.includes('laptop') || d.includes('حاسوب') || d.includes('كمبيوتر'));
  const hasTablet = devices.some((d: string) => d.includes('tablet') || d.includes('لوحي') || d.includes('ipad'));

  if (hasPC) {
    score += 10;
    strengths.push('يتوفر على جهاز كمبيوتر / حاسوب محمول للتدريس');
  } else if (hasTablet) {
    score += 6;
    strengths.push('يتوفر على جهاز لوحي (تابلت)');
  } else if (devices.length > 0) {
    score += 4;
    concerns.push('يعتمد على الهاتف الذكي فقط - يُفضل توفر حاسوب لعرض الدروس والمناهج');
  } else {
    score += 2;
  }

  const net = String(app.internetReliability || '').toLowerCase();
  if (net.includes('ممتاز') || net.includes('excellent') || net.includes('مستقر') || net.includes('stable')) {
    score += 5;
    strengths.push('اتصال إنترنت عالي الاستقرار والجودة');
  } else if (net.includes('جيد') || net.includes('good')) {
    score += 4;
  } else {
    score += 2;
  }

  const sessionsNum = parseInt(String(app.sessionsPerWeek || '2'), 10);
  if (!isNaN(sessionsNum) && sessionsNum >= 2) {
    score += 5;
    strengths.push(`جاهزية لتنظيم ${sessionsNum} حصص أسبوعياً`);
  } else {
    score += 3;
  }

  // 4. Platform Commitment & Palestinian Curriculum Pledge (Max 10 points)
  if (app.status === 'supervisor_approved' || app.supervisorDecision === 'approved') {
    score += 10;
  } else if (app.motivation?.trim()) {
    score += 10;
    strengths.push('دافع تطوعي وإنساني قوي لتدريس طلبة غزة');
  } else {
    score += 8;
  }

  score = Math.min(100, Math.max(10, score));

  // Determine Tier and Target Subject
  let tier: 'highly_recommended' | 'qualified' | 'needs_review' | 'low_match';
  let tierLabel: string;
  let tierColor: string;

  if (score >= 80) {
    tier = 'highly_recommended';
    tierLabel = 'موصى به بقوة (أولوية قصوى)';
    tierColor = '#10b981'; // Emerald
  } else if (score >= 65) {
    tier = 'qualified';
    tierLabel = 'مؤهل ومطابق للشروط';
    tierColor = '#0284c7'; // Sky / Blue
  } else if (score >= 45) {
    tier = 'needs_review';
    tierLabel = 'يحتاج تدقيق إضافي';
    tierColor = '#f59e0b'; // Amber
  } else {
    tier = 'low_match';
    tierLabel = 'غير مكتمل / تطابق منخفض';
    tierColor = '#ef4444'; // Red
  }

  // Target Subject Determination for dual/multi-subject supervisor
  let targetSubject = evalSubjects[0] || 'عام';
  const bestSuitability = [...subjectSuitability].sort((a, b) => b.score - a.score);

  if (bestSuitability.length >= 2 && bestSuitability[0].score >= 70 && bestSuitability[1].score >= 70) {
    targetSubject = `${bestSuitability[0].subjectName} و ${bestSuitability[1].subjectName} (ثنائي)`;
  } else if (bestSuitability.length > 0 && bestSuitability[0].score > 0) {
    targetSubject = bestSuitability[0].subjectName;
  }

  const applicantName = app.fullNameAr || app.fullNameEn || 'المتطوع';
  const specialtyStr = app.specialty ? `في تخصص (${app.specialty})` : '';
  const expStr = app.experienceYears ? `بخبرة تبلغ ${app.experienceYears} سنوات` : 'بخبرة تدريسية جيدة';

  // Automated generated recommendation note for admin
  const suggestedRecommendation = `بناءً على التقييم الأكاديمي المؤتمت، يمتلك الأستاذ(ة) ${applicantName} مؤهلاً أكاديمياً ملائماً ${specialtyStr} ${expStr}، مع جاهزية تقنية ملائمة للتعليم عن بُعد. نوصي باعتماده رسمياً لتدريس مادة (${targetSubject}) في منصة باقون لدعم طلبة غزة.`;

  // Automated generated rejection note
  const suggestedRejection = `نعتذر عن عدم قبول الطلب حالياً نظراً لعدم تطابق التخصص الأكاديمي الدقيق مع المنهاج المعتمد لمادة (${targetSubject})، أو لمحدودية الجاهزية التقنية وساعات التفرغ المطلوبة.`;

  return {
    score,
    tier,
    tierLabel,
    tierColor,
    targetSubject,
    allMatchingSubjects: matchingSubjectNames.length > 0 ? matchingSubjectNames : [targetSubject],
    subjectSuitability,
    strengths,
    concerns,
    suggestedRecommendation,
    suggestedRejection,
  };
}
