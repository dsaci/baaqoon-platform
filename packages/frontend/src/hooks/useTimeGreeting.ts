import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface TimeGreeting {
  text: string;
  icon: string;
  period: 'fajr' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
}

/**
 * Returns an uplifting, culturally respectful greeting based on the current hour of the day.
 * - 05:00 - 08:59 -> الفجر والصباح الباكر (صباح الخيرات والبدايات الموفقة)
 * - 09:00 - 11:59 -> الضحى وساعات الصباح (صباح الهمّة والإنجاز)
 * - 12:00 - 14:59 -> الظهيرة (طابت أوقاتكم بالخير والعطاء)
 * - 15:00 - 17:59 -> العصر (مساء العطاء والمثابرة)
 * - 18:00 - 21:59 -> المغرب وبداية المساء (مساء الخيرات والنور والبركة)
 * - 22:00 - 04:59 -> الليل المتأخر (أمسية هادئة وطابت ليلتكم)
 */
export function getTimeGreeting(isRtl: boolean = true): TimeGreeting {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 9) {
    return {
      text: isRtl ? 'صباح الخيرات والبدايات الموفقة' : 'Good morning & bright beginnings',
      icon: '🌅',
      period: 'fajr',
    };
  }

  if (hour >= 9 && hour < 12) {
    return {
      text: isRtl ? 'صباح الهمّة والإنجاز' : 'Good morning & productive hours',
      icon: '☀️',
      period: 'morning',
    };
  }

  if (hour >= 12 && hour < 15) {
    return {
      text: isRtl ? 'طابت أوقاتكم بالخير والعطاء' : 'Good afternoon & fruitful day',
      icon: '🌤️',
      period: 'noon',
    };
  }

  if (hour >= 15 && hour < 18) {
    return {
      text: isRtl ? 'مساء العطاء والمثابرة' : 'Pleasant afternoon & perseverance',
      icon: '⛅',
      period: 'afternoon',
    };
  }

  if (hour >= 18 && hour < 22) {
    return {
      text: isRtl ? 'مساء الخيرات والنور والبركة' : 'Good evening & peaceful hours',
      icon: '🌙',
      period: 'evening',
    };
  }

  return {
    text: isRtl ? 'أمسية هادئة وطابت ليلتكم' : 'Peaceful night & quiet hours',
    icon: '🌟',
    period: 'night',
  };
}

export function useTimeGreeting(): TimeGreeting {
  const { i18n } = useTranslation();
  const isRtl = i18n?.language ? i18n.language === 'ar' : true;
  const [greeting, setGreeting] = useState<TimeGreeting>(() => getTimeGreeting(isRtl));

  useEffect(() => {
    setGreeting(getTimeGreeting(isRtl));
    const timer = setInterval(() => {
      setGreeting(getTimeGreeting(isRtl));
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [isRtl]);

  return greeting;
}
