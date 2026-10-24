import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  Printer, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Clock, 
  BookOpen, 
  Award,
  Layers,
  CheckCircle2
} from 'lucide-react';
import baaqoonLogo from '../../../assets/logo.png';

export interface GeneratedDocumentProps {
  title: string;
  documentTypeLabel?: string;
  subjectName?: string;
  gradeLevel?: string;
  unitTitle?: string;
  lessonTitle?: string;
  cohortName?: string;
  dueDate?: string;
  maxScore?: string | number;
  content: string;
  aiModel?: string;
  fromFallback?: boolean;
  generatedAt?: string;
  fileName?: string;
  showToolbar?: boolean;
  className?: string;
}

// ─── Lightweight Markdown & Academic RTL Content Parser ──────────────────────
function FormattedContent({ content }: { content: string }) {
  if (!content) return null;

  // Split into lines to parse paragraphs, headings, bullet lists, numbered items, and tables
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyIdx: number) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${keyIdx}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            {tableHeader.length > 0 && (
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                  {tableHeader.map((th, i) => (
                    <th key={i} className="p-2.5 sm:p-3 border-l border-slate-200 last:border-l-0">
                      {th.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 hover:bg-slate-100/50'}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 sm:p-3 border-t border-l border-slate-200 last:border-l-0 text-slate-700">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  const renderInlineFormatted = (text: string) => {
    // Bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-black text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check for Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1);
      // Check if it's a separator line (e.g. |---|---|)
      if (cells.every(c => /^[-:\s]+$/.test(c))) {
        // Just header separator, ignore
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`spacer-${idx}`} className="h-2" />);
      return;
    }

    // Horizontal Rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <div key={`hr-${idx}`} className="my-4 border-t-2 border-dashed border-slate-200" />
      );
      return;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <div key={`h1-${idx}`} className="mt-6 mb-3 pb-2 border-b-2 border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-6 rounded-full bg-indigo-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {trimmed.slice(2)}
          </h2>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <div key={`h2-${idx}`} className="mt-5 mb-2.5 flex items-center gap-2 bg-indigo-50/80 px-3 py-1.5 rounded-lg border-r-4 border-indigo-600">
          <h3 className="text-sm sm:text-base font-black text-indigo-950">
            {trimmed.slice(3)}
          </h3>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <div key={`h3-${idx}`} className="mt-4 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
          <h4 className="text-xs sm:text-sm font-black text-slate-800">
            {trimmed.slice(4)}
          </h4>
        </div>
      );
      return;
    }

    // Numbered Item (e.g. "1. " or "1- " or "السؤال 1:")
    const numberedMatch = trimmed.match(/^(\d+)[\.\-\)]\s*(.*)/);
    if (numberedMatch) {
      elements.push(
        <div key={`num-${idx}`} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed pr-1">
          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200 mt-0.5">
            {numberedMatch[1]}
          </span>
          <div className="flex-1 font-medium">
            {renderInlineFormatted(numberedMatch[2])}
          </div>
        </div>
      );
      return;
    }

    // Bullet List Item (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2.5 my-1 text-xs sm:text-sm text-slate-800 leading-relaxed pr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0 mt-2" />
          <div className="flex-1 font-medium">
            {renderInlineFormatted(trimmed.slice(2))}
          </div>
        </div>
      );
      return;
    }

    // Blockquote or Callout (> )
    if (trimmed.startsWith('> ')) {
      elements.push(
        <div key={`quote-${idx}`} className="my-2.5 p-3 rounded-xl bg-amber-50/80 border-r-4 border-amber-500 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
          {renderInlineFormatted(trimmed.slice(2))}
        </div>
      );
      return;
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm text-slate-800 leading-relaxed my-1 font-medium">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}

// ─── Main Visual Document Component ──────────────────────────────────────────
export default function GeneratedImageDocument({
  title,
  documentTypeLabel = 'وثيقة بيداغوجية',
  subjectName,
  gradeLevel,
  unitTitle,
  lessonTitle,
  cohortName,
  dueDate,
  maxScore,
  content,
  aiModel = 'Baaqoon Educational AI',
  fromFallback = false,
  generatedAt,
  fileName,
  showToolbar = true,
  className = '',
}: GeneratedDocumentProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  // Download high-resolution PNG
  const handleDownloadImage = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(documentRef.current, {
        quality: 0.98,
        pixelRatio: 2, // 2x gives 300DPI crisp resolution
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const safeName = (fileName || title || 'وثيقة_باقون')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_');

      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export document image', err);
      alert('حدث خطأ أثناء تصدير الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard (supported on modern browsers)
  const handleCopyImage = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(documentRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch (err) {
      // Fallback: Copy content text
      handleCopyText();
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Text
  const handleCopyText = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });

  const docId = `BQN-${(title || 'DOC').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      {/* ── Action Toolbar ── */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>معاينة الوثيقة كصورة رقمية معتمدة (RTL)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم نسخ النص!' : 'نسخ النص'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 transition-colors shadow-sm disabled:opacity-60"
              title="نسخ الصورة مباشرة للحافظة للصقها في تليغرام أو واتساب"
            >
              {imageCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-violet-600" />}
              <span>{imageCopied ? 'تم نسخ الصورة!' : 'نسخ كصورة 📋'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition-all active:scale-95 disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تجهيز الصورة...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل كصورة (PNG) 📷</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Academic Visual Document Canvas (Captured Node) ── */}
      <div className="overflow-x-auto p-1 sm:p-2 bg-slate-200/60 dark:bg-slate-950/60 rounded-2xl">
        <div
          ref={documentRef}
          id="baaqoon-academic-document"
          className="bg-white text-slate-900 border-2 border-slate-300 rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-6 sm:p-9 space-y-5 text-right font-sans select-text relative"
          style={{
            minHeight: '400px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
        >
          {/* Subtle decorative top border ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-l from-indigo-600 via-violet-600 to-emerald-600 rounded-t-lg -mt-3 mb-2" />

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* 1. OFFICIAL INSTITUTIONAL HEADER                                     */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 text-xs">
            {/* Right: Platform & Document Info */}
            <div className="text-right space-y-0.5 max-w-[200px]">
              <p className="font-black text-slate-900 text-xs">منصة باقون التعليمية</p>
              <p className="font-bold text-slate-600 text-[11px]">وثيقة دراسية وتقويمية معتمدة</p>
              <p className="font-medium text-slate-500 text-[10px]">المنظومة البيداغوجية المتكاملة</p>
            </div>

            {/* Center: Baaqoon Official Crest & Brand */}
            <div className="text-center px-2 flex flex-col items-center">
              <img 
                src={baaqoonLogo} 
                alt="شعار منصة باقون" 
                className="w-12 h-12 object-contain rounded-full shadow-sm mb-1"
                crossOrigin="anonymous"
              />
              <span className="font-black text-slate-900 text-sm tracking-wide">
                منصة باقون التعليمية
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 mt-0.5">
                {documentTypeLabel}
              </span>
            </div>

            {/* Left: Year, Date & Cohort */}
            <div className="text-left space-y-0.5 max-w-[200px]">
              <p className="font-bold text-slate-700 text-[11px]">السنة الدراسية: 2025 / 2026</p>
              <p className="font-medium text-slate-500 text-[10px]">التاريخ: {formattedDate}</p>
              {cohortName && (
                <p className="font-black text-indigo-900 text-[11px] truncate">
                  الفوج: {cohortName}
                </p>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* 2. TITLE & CURRICULAR METADATA BANNER                                */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div className="text-center space-y-2 py-1">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {title}
            </h1>

            {/* Metadata Badges Ribbon */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] font-bold">
              {subjectName && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>المادة: {subjectName}</span>
                </span>
              )}
              {gradeLevel && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                  <span>المستوى: {gradeLevel}</span>
                </span>
              )}
              {unitTitle && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>الوحدة: {unitTitle}</span>
                </span>
              )}
              {maxScore && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>العلامة: {maxScore} نقطة</span>
                </span>
              )}
              {dueDate && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>آخر أجل: {dueDate}</span>
                </span>
              )}
            </div>

            {lessonTitle && (
              <p className="text-xs font-bold text-slate-600">
                موضوع الدرس: <span className="text-slate-900 font-black">{lessonTitle}</span>
              </p>
            )}
          </div>

          <div className="border-b border-dashed border-slate-300" />

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* 3. STRUCTURED ARABIC RTL BODY CONTENT                                */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div className="py-2 min-h-[160px]">
            <FormattedContent content={content} />
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* 4. OFFICIAL FOOTER WITH LOGO & WATERMARK (حسب رغبة المستخدم بالضبط)  */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div className="pt-4 border-t-2 border-slate-800 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600">
            {/* Center / Brand Attribution with Logo and Elegant Font */}
            <div className="flex items-center gap-2">
              <img 
                src={baaqoonLogo} 
                alt="شعار باقون" 
                className="w-6 h-6 object-contain rounded-full border border-slate-300 shadow-sm shrink-0"
                crossOrigin="anonymous"
              />
              <div className="text-right">
                <p className="text-[11px] font-black text-slate-800 leading-tight">
                  مولدة من منصة باقون التعليمية — جميع الحقوق محفوظة © 2026
                </p>
                <p className="text-[9px] font-bold text-slate-500">
                  {fromFallback 
                    ? 'مستخرجة من قاعدة البيانات البيداغوجية المنهجية المعتمدة' 
                    : `مولدة بواسطة الذكاء الاصطناعي البيداغوجي المعتمد (${aiModel})`}
                </p>
              </div>
            </div>

            {/* Left Document Stamp / Verification Badge */}
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
                {docId}
              </span>
              <span className="font-bold">الصفحة 1 / 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
