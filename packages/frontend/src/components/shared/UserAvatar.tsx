import React from 'react';

export interface PresetAvatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  category: 'student' | 'teacher' | 'general';
}

// 1. شاب أنمي عصري (نظارات عصرية، شعر شبابي، أذنان، بدون ملامح)
export function AnimeMale1Svg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bg_male1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="hair_male1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Background Circle */}
      <circle cx="50" cy="50" r="50" fill="url(#bg_male1)" />
      
      {/* Shirt / Shoulders */}
      <path d="M22 96 C22 80 34 74 50 74 C66 74 78 80 78 96 Z" fill="#E2E8F0" />
      <path d="M38 74 L50 84 L62 74 Z" fill="#CBD5E1" />
      
      {/* Neck */}
      <path d="M42 66 H58 V76 H42 Z" fill="#F8C8A0" />
      <path d="M42 68 C46 72 54 72 58 68 V74 H42 Z" fill="#E4A87C" opacity="0.5" />

      {/* Ears */}
      <ellipse cx="28" cy="51" rx="5" ry="7.5" fill="#F8C8A0" />
      <ellipse cx="28" cy="51" rx="2.5" ry="4.5" fill="#E4A87C" />
      <ellipse cx="72" cy="51" rx="5" ry="7.5" fill="#F8C8A0" />
      <ellipse cx="72" cy="51" rx="2.5" ry="4.5" fill="#E4A87C" />

      {/* Face (Faceless Canvas) */}
      <path d="M30 45 C30 65 39 70 50 70 C61 70 70 65 70 45 C70 30 61 24 50 24 C39 24 30 30 30 45 Z" fill="#FCD3B4" />

      {/* Modern Glasses (Rectangular Anime Glasses) */}
      <path d="M24 49 L33 48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M76 49 L67 48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="33" y="44" width="14" height="10" rx="3" fill="#93C5FD" fillOpacity="0.4" stroke="#0F172A" strokeWidth="2.5" />
      <rect x="53" y="44" width="14" height="10" rx="3" fill="#93C5FD" fillOpacity="0.4" stroke="#0F172A" strokeWidth="2.5" />
      <path d="M47 48 H53" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Glasses reflections */}
      <line x1="35" y1="46" x2="40" y2="52" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="55" y1="46" x2="60" y2="52" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

      {/* Anime Hair (Spiky stylish anime hair) */}
      <path d="M28 42 C24 30 32 18 50 16 C68 18 76 30 72 42 C68 33 64 29 59 31 C55 24 47 24 42 32 C38 29 32 34 28 42 Z" fill="url(#hair_male1)" />
      <path d="M34 26 L40 37 L46 27 L53 38 L60 27 L66 38 L72 32 C68 16 32 16 34 26 Z" fill="url(#hair_male1)" />
    </svg>
  );
}

// 2. فتى كرتوني (نظارات دائرية، شعر كستنائي مموج، أذنان، بدون ملامح)
export function AnimeMale2Svg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bg_male2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="hair_male2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#78350F" />
          <stop offset="1" stopColor="#451A03" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_male2)" />

      {/* Hoodie Collar */}
      <path d="M24 96 C24 82 35 75 50 75 C65 75 76 82 76 96 Z" fill="#F1F5F9" />
      <path d="M42 75 C42 84 58 84 58 75 Z" fill="#E2E8F0" />

      {/* Neck */}
      <path d="M43 65 H57 V76 H43 Z" fill="#FCD3B4" />

      {/* Ears */}
      <circle cx="28" cy="50" r="6" fill="#FCD3B4" />
      <circle cx="28" cy="50" r="3" fill="#E4A87C" />
      <circle cx="72" cy="50" r="6" fill="#FCD3B4" />
      <circle cx="72" cy="50" r="3" fill="#E4A87C" />

      {/* Face (Faceless) */}
      <path d="M30 46 C30 64 38 70 50 70 C62 70 70 64 70 46 C70 32 62 25 50 25 C38 25 30 32 30 46 Z" fill="#FFE4CE" />

      {/* Round Glasses */}
      <path d="M23 49 L33 49" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M77 49 L67 49" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="49" r="7.5" fill="#A7F3D0" fillOpacity="0.4" stroke="#0F172A" strokeWidth="2.5" />
      <circle cx="60" cy="49" r="7.5" fill="#A7F3D0" fillOpacity="0.4" stroke="#0F172A" strokeWidth="2.5" />
      <path d="M47.5 49 H52.5" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="47" r="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="58" cy="47" r="1.5" fill="#FFFFFF" opacity="0.9" />

      {/* Curly/Wavy Anime Hair */}
      <path d="M26 40 C22 28 32 16 50 16 C68 16 78 28 74 40 C70 33 66 30 62 33 C58 26 52 26 48 33 C42 27 34 31 26 40 Z" fill="url(#hair_male2)" />
      <circle cx="34" cy="28" r="8" fill="url(#hair_male2)" />
      <circle cx="50" cy="22" r="9" fill="url(#hair_male2)" />
      <circle cx="66" cy="28" r="8" fill="url(#hair_male2)" />
    </svg>
  );
}

// 3. فتاة محجبة أنيقة (حجاب أنيق، نظارات عصرية، أذنان/إطار الحجاب، بدون ملامح)
export function AnimeFemale1Svg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bg_fem1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="hijab_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5D0FE" />
          <stop offset="1" stopColor="#E879F9" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_fem1)" />

      {/* Hijab Back Wrap / Dress */}
      <path d="M20 96 C20 78 30 68 50 68 C70 68 80 78 80 96 Z" fill="url(#hijab_grad)" />
      
      {/* Main Hijab Outer Frame */}
      <path d="M26 50 C26 28 34 18 50 18 C66 18 74 28 74 50 C74 72 65 76 50 76 C35 76 26 72 26 50 Z" fill="url(#hijab_grad)" />

      {/* Hijab Inner Under-cap */}
      <path d="M34 38 C34 30 40 26 50 26 C60 26 66 30 66 38 Z" fill="#DDD6FE" />

      {/* Face (Smooth Faceless Oval) */}
      <path d="M33 46 C33 63 40 68 50 68 C60 68 67 63 67 46 C67 36 60 32 50 32 C40 32 33 36 33 46 Z" fill="#FCD3B4" />

      {/* Hijab Soft Fold Details */}
      <path d="M42 68 C46 73 54 73 58 68" stroke="#D946EF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M32 75 C40 84 60 84 68 75" stroke="#C026D3" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />

      {/* Stylish Glasses */}
      <circle cx="41" cy="48" r="6.5" fill="#E0E7FF" fillOpacity="0.45" stroke="#4C1D95" strokeWidth="2.5" />
      <circle cx="59" cy="48" r="6.5" fill="#E0E7FF" fillOpacity="0.45" stroke="#4C1D95" strokeWidth="2.5" />
      <path d="M47.5 48 H52.5" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 47 L35 48" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 47 L65 48" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" />
      {/* Light Reflection */}
      <line x1="38" y1="45" x2="43" y2="51" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <line x1="56" y1="45" x2="61" y2="51" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

// 4. فتاة أنمي كرتونية (شعر أنمي ناعم، نظارات قطة أنيقة، أذنان، بدون ملامح)
export function AnimeFemale2Svg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bg_fem2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EC4899" />
          <stop offset="1" stopColor="#BE185D" />
        </linearGradient>
        <linearGradient id="hair_fem2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A044E" />
          <stop offset="1" stopColor="#2E0854" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_fem2)" />

      {/* Dress / Shoulders */}
      <path d="M22 96 C22 80 34 74 50 74 C66 74 78 80 78 96 Z" fill="#FDF2F8" />
      <circle cx="50" cy="80" r="3" fill="#F472B6" />

      {/* Neck */}
      <path d="M44 65 H56 V75 H44 Z" fill="#FCD3B4" />

      {/* Hair Back Layers */}
      <path d="M22 46 C20 65 24 78 30 82 C32 68 32 54 32 46 Z" fill="url(#hair_fem2)" />
      <path d="M78 46 C80 65 76 78 70 82 C68 68 68 54 68 46 Z" fill="url(#hair_fem2)" />

      {/* Ears */}
      <circle cx="28" cy="52" r="5.5" fill="#FCD3B4" />
      <circle cx="28" cy="52" r="2.5" fill="#E4A87C" />
      <circle cx="28" cy="56" r="1.5" fill="#F43F5E" /> {/* Small cute earring */}
      <circle cx="72" cy="52" r="5.5" fill="#FCD3B4" />
      <circle cx="72" cy="52" r="2.5" fill="#E4A87C" />
      <circle cx="72" cy="56" r="1.5" fill="#F43F5E" />

      {/* Face (Faceless) */}
      <path d="M30 46 C30 64 38 69 50 69 C62 69 70 64 70 46 C70 32 62 26 50 26 C38 26 30 32 30 46 Z" fill="#FFE4CE" />

      {/* Cat-eye Anime Glasses */}
      <path d="M23 49 L33 50" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
      <path d="M77 49 L67 50" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 46 C35 43 45 44 47 48 C46 54 35 55 33 46 Z" fill="#FCE7F3" fillOpacity="0.45" stroke="#831843" strokeWidth="2.5" />
      <path d="M67 46 C65 43 55 44 53 48 C54 54 65 55 67 46 Z" fill="#FCE7F3" fillOpacity="0.45" stroke="#831843" strokeWidth="2.5" />
      <path d="M47 48 H53" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="46" x2="42" y2="52" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <line x1="56" y1="46" x2="62" y2="52" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />

      {/* Anime Hair Bangs & Front */}
      <path d="M24 44 C24 26 34 18 50 18 C66 18 76 26 76 44 C72 34 66 32 60 35 C55 28 45 28 40 35 C34 32 28 34 24 44 Z" fill="url(#hair_fem2)" />
    </svg>
  );
}

// 5. أستاذ / مشرف أكاديمي أنمي (وقار، قميص بربطة عنق، نظارات، شعر مرتب، أذنان، بدون ملامح)
export function AnimeTeacherMSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bg_teach_m" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="hair_teach_m" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_teach_m)" />

      {/* Suit & Tie */}
      <path d="M20 96 C20 78 32 72 50 72 C68 72 80 78 80 96 Z" fill="#334155" />
      <path d="M42 72 L50 96 L58 72 Z" fill="#FFFFFF" />
      <path d="M48 76 L52 76 L51 92 L49 92 Z" fill="#DC2626" /> {/* Tie */}

      {/* Neck */}
      <path d="M43 64 H57 V74 H43 Z" fill="#F8C8A0" />

      {/* Ears */}
      <ellipse cx="27" cy="50" rx="5" ry="7" fill="#F8C8A0" />
      <ellipse cx="27" cy="50" rx="2.5" ry="4" fill="#E4A87C" />
      <ellipse cx="73" cy="50" rx="5" ry="7" fill="#F8C8A0" />
      <ellipse cx="73" cy="50" rx="2.5" ry="4" fill="#E4A87C" />

      {/* Face (Faceless) */}
      <path d="M30 44 C30 63 39 69 50 69 C61 69 70 63 70 44 C70 30 61 24 50 24 C39 24 30 30 30 44 Z" fill="#FCD3B4" />

      {/* Professional Glasses */}
      <path d="M23 48 L32 48" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M77 48 L68 48" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="32" y="43" width="15" height="10" rx="2" fill="#E2E8F0" fillOpacity="0.4" stroke="#000000" strokeWidth="2.5" />
      <rect x="53" y="43" width="15" height="10" rx="2" fill="#E2E8F0" fillOpacity="0.4" stroke="#000000" strokeWidth="2.5" />
      <path d="M47 47 H53" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="45" x2="40" y2="51" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="55" y1="45" x2="61" y2="51" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

      {/* Neat Academic Hair */}
      <path d="M27 42 C24 30 32 18 50 18 C68 18 76 30 73 42 C69 35 65 30 58 32 C50 25 42 27 38 34 C33 32 29 35 27 42 Z" fill="url(#hair_teach_m)" />
    </svg>
  );
}

// 6. أستاذة / مشرفة أكاديمية أنمي (وقار تعليمي، نظارات، حجاب أو إطار أنيق، أذنان، بدون ملامح)
export function AnimeTeacherFSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bg_teach_f" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="hijab_teach" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D9488" />
          <stop offset="1" stopColor="#042F2E" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_teach_f)" />

      {/* Hijab / Formal Robe */}
      <path d="M20 96 C20 78 30 68 50 68 C70 68 80 78 80 96 Z" fill="url(#hijab_teach)" />
      <path d="M26 50 C26 28 34 18 50 18 C66 18 74 28 74 50 C74 72 65 76 50 76 C35 76 26 72 26 50 Z" fill="url(#hijab_teach)" />
      
      {/* Face (Faceless) */}
      <path d="M33 46 C33 63 40 68 50 68 C60 68 67 63 67 46 C67 36 60 32 50 32 C40 32 33 36 33 46 Z" fill="#FCD3B4" />

      {/* Elegant Glasses */}
      <circle cx="41" cy="48" r="6.5" fill="#CCFBF1" fillOpacity="0.45" stroke="#F59E0B" strokeWidth="2.5" />
      <circle cx="59" cy="48" r="6.5" fill="#CCFBF1" fillOpacity="0.45" stroke="#F59E0B" strokeWidth="2.5" />
      <path d="M47.5 48 H52.5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 47 L35 48" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 47 L65 48" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="45" x2="43" y2="51" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <line x1="56" y1="45" x2="61" y2="51" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export const PRESET_AVATARS: { id: string; name: string; gender: 'male' | 'female'; Component: React.FC<{ className?: string }> }[] = [
  { id: 'preset:anime_male_1', name: 'شاب أنمي عصري', gender: 'male', Component: AnimeMale1Svg },
  { id: 'preset:anime_male_2', name: 'فتى كرتوني', gender: 'male', Component: AnimeMale2Svg },
  { id: 'preset:anime_female_1', name: 'فتاة محجبة أنيقة', gender: 'female', Component: AnimeFemale1Svg },
  { id: 'preset:anime_female_2', name: 'فتاة أنمي كرتونية', gender: 'female', Component: AnimeFemale2Svg },
  { id: 'preset:anime_teacher_m', name: 'أستاذ أكاديمي', gender: 'male', Component: AnimeTeacherMSvg },
  { id: 'preset:anime_teacher_f', name: 'أستاذة أكاديمية', gender: 'female', Component: AnimeTeacherFSvg },
];

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  role?: string;
  gender?: 'male' | 'female';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-3xl'
};

export default function UserAvatar({
  avatarUrl,
  name,
  role,
  gender,
  size = 'md',
  className = '',
  onClick
}: UserAvatarProps) {
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  // 1. If custom image URL is provided (data:image/... or http)
  if (avatarUrl && (avatarUrl.startsWith('data:image/') || avatarUrl.startsWith('http') || avatarUrl.startsWith('/'))) {
    return (
      <div 
        onClick={onClick}
        className={`relative rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-800 shadow-xs ${sizeClasses} ${className}`}
      >
        <img 
          src={avatarUrl} 
          alt={name || 'User Avatar'} 
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback if broken image
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 2. If a preset is chosen
  if (avatarUrl && avatarUrl.startsWith('preset:')) {
    const preset = PRESET_AVATARS.find(p => p.id === avatarUrl);
    if (preset) {
      const Component = preset.Component;
      return (
        <div 
          onClick={onClick}
          className={`relative rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-800 shadow-xs ${sizeClasses} ${className}`}
        >
          <Component className="w-full h-full" />
        </div>
      );
    }
  }

  // 3. Smart Default Fallback based on Role and Gender / Name
  let DefaultComponent = AnimeMale1Svg;

  // Check if role is teacher/supervisor
  if (role === 'teacher' || role === 'subject_supervisor' || role === 'supervisor' || role === 'admin' || role === 'super_admin') {
    if (gender === 'female') {
      DefaultComponent = AnimeTeacherFSvg;
    } else {
      DefaultComponent = AnimeTeacherMSvg;
    }
  } else {
    // Student or other
    if (gender === 'female') {
      DefaultComponent = AnimeFemale1Svg;
    } else {
      DefaultComponent = AnimeMale1Svg;
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-800 shadow-xs ${sizeClasses} ${className}`}
    >
      <DefaultComponent className="w-full h-full" />
    </div>
  );
}
