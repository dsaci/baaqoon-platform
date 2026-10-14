export interface ActivityStatus {
  status: 'active' | 'away' | 'dormant' | 'new';
  label: string;
  shortLabel: string;
  color: 'emerald' | 'amber' | 'rose' | 'blue';
  badgeClass: string;
  dotClass: string;
  daysSinceLogin: number | null;
  formattedLastLogin: string;
  isIdle: boolean;
}

export function getUserActivityStatus(
  lastLoginAt?: string | Date | null,
  createdAt?: string | Date | null
): ActivityStatus {
  const now = Date.now();

  if (lastLoginAt) {
    const loginTime = new Date(lastLoginAt).getTime();
    const diffMs = Math.max(0, now - loginTime);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let formattedLastLogin = '';
    if (diffMinutes < 5) formattedLastLogin = 'الآن';
    else if (diffMinutes < 60) formattedLastLogin = `قبل ${diffMinutes} دقيقة`;
    else if (diffHours < 24) formattedLastLogin = `قبل ${diffHours} ساعة`;
    else if (diffDays === 1) formattedLastLogin = 'أمس';
    else if (diffDays < 30) formattedLastLogin = `منذ ${diffDays} يوماً`;
    else formattedLastLogin = `منذ أكثر من شهر (${new Date(lastLoginAt).toLocaleDateString('ar-EG')})`;

    if (diffDays < 7) {
      // Active in the last 7 days
      return {
        status: 'active',
        label: diffDays === 0 ? (diffHours < 1 ? 'نشط الآن' : `نشط اليوم (قبل ${diffHours} س)`) : diffDays === 1 ? 'نشط أمس' : `نشط (منذ ${diffDays} أيام)`,
        shortLabel: 'نشط',
        color: 'emerald',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        daysSinceLogin: diffDays,
        formattedLastLogin,
        isIdle: false
      };
    } else if (diffDays <= 14) {
      // Away for 7 - 14 days (warning: relative inactivity)
      return {
        status: 'away',
        label: `غائب (منذ ${diffDays} يوماً)`,
        shortLabel: 'غياب أسبوع+',
        color: 'amber',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        dotClass: 'bg-amber-500 animate-pulse',
        daysSinceLogin: diffDays,
        formattedLastLogin,
        isIdle: true
      };
    } else {
      // Dormant for > 14 days (severe inactivity)
      return {
        status: 'dormant',
        label: `خامل ومنقطع (${diffDays} يوماً)`,
        shortLabel: 'خامل ومنقطع',
        color: 'rose',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        daysSinceLogin: diffDays,
        formattedLastLogin,
        isIdle: true
      };
    }
  } else {
    // User has never logged in yet
    const createdTime = createdAt ? new Date(createdAt).getTime() : now;
    const diffDays = Math.floor(Math.max(0, now - createdTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return {
        status: 'new',
        label: diffDays === 0 ? 'مسجل اليوم (لم يدخل)' : `مسجل حديثاً (${diffDays} أيام)`,
        shortLabel: 'جديد لم يدخل',
        color: 'blue',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        dotClass: 'bg-blue-500',
        daysSinceLogin: null,
        formattedLastLogin: 'لم يسجل الدخول قط',
        isIdle: false
      };
    } else {
      return {
        status: 'dormant',
        label: `خامل (لم يدخل قط منذ ${diffDays} يوماً)`,
        shortLabel: 'خامل لم يدخل',
        color: 'rose',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        daysSinceLogin: null,
        formattedLastLogin: 'لم يسجل الدخول قط',
        isIdle: true
      };
    }
  }
}
