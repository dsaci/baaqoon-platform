/**
 * Utility functions for validating personal user emails in Baaqoon.
 * Detects whether an email is synthetic, dummy, temporary, or missing.
 * Accounts created with @baaqoon.ps, @example.com, .test, or empty/null
 * need to be prompted to enter a real personal email (e.g. Gmail, Outlook, Yahoo).
 */

export function isDummyOrMissingEmail(email?: string | null): boolean {
  if (!email) return true;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return true;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return true;
  const domain = parts[1];
  if (!domain || !domain.includes('.')) return true;

  if (
    domain === 'baaqoon.ps' ||
    domain.endsWith('.baaqoon.ps') ||
    domain === 'example.com' ||
    domain.endsWith('.example.com') ||
    domain.endsWith('.test') ||
    domain.endsWith('.local')
  ) {
    return true;
  }

  return false;
}

export function validatePersonalEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'يرجى إدخال عنوان البريد الإلكتروني الشخصي' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'صيغة البريد الإلكتروني غير صحيحة، يرجى كتابة عنوان صحيح' };
  }

  if (isDummyOrMissingEmail(trimmed)) {
    return {
      isValid: false,
      error: 'يُرجى إدخال بريد إلكتروني شخصي حقيقي وفعّال (مثل Gmail أو Outlook أو Yahoo أو بريدك المعتمد) وليس بريداً تجريبياً أو وهمياً.'
    };
  }

  return { isValid: true };
}
