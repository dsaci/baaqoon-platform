import React from 'react';
import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
}

export default function PlaceholderPage({ title }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-baaqoon-500 dark:text-baaqoon-400">
      <Construction className="w-20 h-20 mb-6 text-baaqoon-200 dark:text-baaqoon-700 dark:text-baaqoon-300" />
      <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white mb-2">
        {title || 'هذه الصفحة قيد التطوير'}
      </h1>
      <p className="text-center max-w-md">
        نحن نعمل بجد لإكمال هذه الميزة. ستكون متاحة قريباً إن شاء الله في النسخ القادمة.
      </p>
    </div>
  );
}
