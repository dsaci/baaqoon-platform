import React, { useRef, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
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
  CheckCircle2,
  Image as ImageIcon
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

// ─── Semantic Content Block for Robust A4 Layout & Multi-Page Splitting ───────
interface ContentBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'question' | 'paragraph' | 'quote' | 'table' | 'hr' | 'pagebreak';
  lines: string[];
  tableHeader?: string[];
  tableRows?: string[][];
  estimatedHeight: number; // in screen pixels (A4 height is ~1080px)
}

function parseContentIntoBlocks(content: string): ContentBlock[] {
  if (!content) return [];
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let blockCounter = 0;

  let currentLines: string[] = [];
  let currentType: ContentBlock['type'] = 'paragraph';

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      const estimatedHeight = 45 + tableRows.length * 34 + 20;
      blocks.push({
        id: `blk-${++blockCounter}`,
        type: 'table',
        lines: [],
        tableHeader: [...tableHeader],
        tableRows: [...tableRows],
        estimatedHeight,
      });
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushCurrent = () => {
    if (currentLines.length === 0) return;

    let height = 14;
    for (const l of currentLines) {
      const trimmed = l.trim();
      if (!trimmed) {
        height += 8;
      } else if (currentType === 'h1') {
        height += 65;
      } else if (currentType === 'h2') {
        height += 50;
      } else if (currentType === 'h3') {
        height += 38;
      } else {
        const lineCount = Math.max(1, Math.ceil(trimmed.length / 65));
        height += lineCount * 25 + 4;
      }
    }

    blocks.push({
      id: `blk-${++blockCounter}`,
      type: currentType,
      lines: [...currentLines],
      estimatedHeight: height,
    });
    currentLines = [];
    currentType = 'paragraph';
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushCurrent();
      const cells = trimmed.split('|').slice(1, -1);
      if (cells.every(c => /^[-:\s]+$/.test(c))) {
        // separator row, skip
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Explicit page breaks (supports [صفحة جديدة], ---pagebreak---, etc.)
    if (/^(\[صفحة جديدة\]|---pagebreak---|<!--\s*pagebreak\s*-->|===+)$/i.test(trimmed)) {
      flushCurrent();
      blocks.push({
        id: `blk-${++blockCounter}`,
        type: 'pagebreak',
        lines: [],
        estimatedHeight: 0,
      });
      continue;
    }

    // Horizontal Rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushCurrent();
      blocks.push({
        id: `blk-${++blockCounter}`,
        type: 'hr',
        lines: [rawLine],
        estimatedHeight: 25,
      });
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      flushCurrent();
      currentType = 'h1';
      currentLines.push(rawLine);
      flushCurrent();
      continue;
    }
    if (trimmed.startsWith('## ') || /^(\*\*|#*)?(التمرين|المسألة|الوضعية)/.test(trimmed)) {
      flushCurrent();
      currentType = 'h2';
      currentLines.push(rawLine);
      flushCurrent();
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushCurrent();
      currentType = 'h3';
      currentLines.push(rawLine);
      flushCurrent();
      continue;
    }

    // Start of a Question (keep questions and their choices/rubrics grouped in 1 block)
    const isNewQuestion = /^(\*\*|\*|#*)\s*(السؤال|س\s*\d+|التمرين)/i.test(trimmed) ||
      /^(\d+)[\.\-\)]\s+/.test(trimmed);

    if (isNewQuestion) {
      flushCurrent();
      currentType = 'question';
      currentLines.push(rawLine);
      continue;
    }

    // Choices, bullet options, or explanations under a question block
    if (currentType === 'question') {
      const isSubItem = /^(\s*[-*•]|\s*\([أ-ي0-9a-zA-Z]\)|\s*>\s*)/.test(rawLine);
      if (isSubItem || !trimmed) {
        currentLines.push(rawLine);
        continue;
      }
      flushCurrent();
      currentType = 'paragraph';
      currentLines.push(rawLine);
      continue;
    }

    // Callout / Blockquote
    if (trimmed.startsWith('> ')) {
      if (currentType !== 'quote') {
        flushCurrent();
        currentType = 'quote';
      }
      currentLines.push(rawLine);
      continue;
    }

    if (currentType === 'quote') {
      flushCurrent();
    }
    currentLines.push(rawLine);
  }

  if (inTable) {
    flushTable();
  }
  flushCurrent();

  return blocks;
}

// ─── Paginate Blocks Into Clean A4 Proportioned Pages ─────────────────────────
function paginateBlocks(blocks: ContentBlock[]): ContentBlock[][] {
  if (blocks.length === 0) return [[]];

  const pages: ContentBlock[][] = [[]];
  let currentPage = 0;
  let currentHeight = 0;

  // Page 1 budget: ~690px usable height (Leaves space for full header + title + badges + footer)
  const PAGE1_BUDGET = 690;
  // Page 2+ budget: ~890px usable height (Mini header + footer)
  const SUBSEQUENT_PAGE_BUDGET = 890;

  for (const block of blocks) {
    if (block.type === 'pagebreak') {
      if (pages[currentPage].length > 0) {
        currentPage++;
        pages[currentPage] = [];
        currentHeight = 0;
      }
      continue;
    }

    const budget = currentPage === 0 ? PAGE1_BUDGET : SUBSEQUENT_PAGE_BUDGET;

    if (pages[currentPage].length === 0) {
      pages[currentPage].push(block);
      currentHeight += block.estimatedHeight;
    } else if (currentHeight + block.estimatedHeight <= budget) {
      pages[currentPage].push(block);
      currentHeight += block.estimatedHeight;
    } else {
      // Start a clean new page
      currentPage++;
      pages[currentPage] = [block];
      currentHeight = block.estimatedHeight;
    }
  }

  return pages;
}

// ─── Inline Text Formatter ───────────────────────────────────────────────────
function renderInlineFormatted(text: string) {
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
}

// ─── Render Semantic Block ───────────────────────────────────────────────────
function renderBlock(block: ContentBlock) {
  if (block.type === 'table') {
    return (
      <div key={block.id} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-right border-collapse text-xs sm:text-sm">
          {block.tableHeader && block.tableHeader.length > 0 && (
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                {block.tableHeader.map((th, i) => (
                  <th key={i} className="p-2 sm:p-2.5 border-l border-slate-200 last:border-l-0">
                    {th.trim()}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {block.tableRows && block.tableRows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 sm:p-2.5 border-t border-l border-slate-200 last:border-l-0 text-slate-700">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === 'hr') {
    return <div key={block.id} className="my-3 border-t-2 border-dashed border-slate-300" />;
  }

  if (block.type === 'h1') {
    return (
      <div key={block.id} className="mt-4 mb-2 pb-1.5 border-b-2 border-slate-800 flex items-center gap-2">
        <div className="w-2.5 h-6 rounded-full bg-indigo-600 shrink-0" />
        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
          {block.lines[0]?.replace(/^#\s*/, '')}
        </h2>
      </div>
    );
  }

  if (block.type === 'h2') {
    return (
      <div key={block.id} className="mt-4 mb-2 flex items-center gap-2 bg-indigo-50/90 px-3 py-1.5 rounded-lg border-r-4 border-indigo-600 shadow-xs">
        <h3 className="text-sm sm:text-base font-black text-indigo-950">
          {block.lines[0]?.replace(/^##\s*/, '')}
        </h3>
      </div>
    );
  }

  if (block.type === 'h3') {
    return (
      <div key={block.id} className="mt-3 mb-1.5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
        <h4 className="text-xs sm:text-sm font-black text-slate-800">
          {block.lines[0]?.replace(/^###\s*/, '')}
        </h4>
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <div key={block.id} className="my-2 p-3 rounded-xl bg-amber-50/80 border-r-4 border-amber-500 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
        {block.lines.map((l, i) => (
          <p key={i} className="my-0.5">{renderInlineFormatted(l.replace(/^>\s*/, ''))}</p>
        ))}
      </div>
    );
  }

  // Question / Paragraph / Bullets
  return (
    <div key={block.id} className="my-2 space-y-1">
      {block.lines.map((l, lIdx) => {
        const trimmed = l.trim();
        if (!trimmed) return <div key={lIdx} className="h-1.5" />;

        // Numbered Item (e.g. "1. " or "1- " or "السؤال 1:")
        const numberedMatch = trimmed.match(/^(\d+)[\.\-\)]\s*(.*)/);
        if (numberedMatch) {
          return (
            <div key={lIdx} className="flex items-start gap-2.5 my-1 text-xs sm:text-sm text-slate-800 leading-relaxed pr-0.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200 mt-0.5">
                {numberedMatch[1]}
              </span>
              <div className="flex-1 font-medium">
                {renderInlineFormatted(numberedMatch[2])}
              </div>
            </div>
          );
        }

        // Bold Question Heading
        if (trimmed.startsWith('**السؤال') || trimmed.startsWith('السؤال')) {
          return (
            <div key={lIdx} className="font-black text-slate-900 text-xs sm:text-sm pt-1.5 pb-0.5 flex items-start gap-1.5">
              <span className="text-indigo-600 font-black">✦</span>
              <div>{renderInlineFormatted(trimmed)}</div>
            </div>
          );
        }

        // Bullet / Option (e.g. - (أ) or - (1) or - )
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lIdx} className="flex items-start gap-2.5 my-0.5 text-xs sm:text-sm text-slate-800 leading-relaxed pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0 mt-2" />
              <div className="flex-1 font-medium">
                {renderInlineFormatted(trimmed.slice(2))}
              </div>
            </div>
          );
        }

        // Callout inside question
        if (trimmed.startsWith('> ')) {
          return (
            <div key={lIdx} className="my-1.5 p-2.5 rounded-lg bg-indigo-50/70 border-r-3 border-indigo-400 text-xs text-indigo-950 font-medium">
              {renderInlineFormatted(trimmed.slice(2))}
            </div>
          );
        }

        // Normal text line
        return (
          <p key={lIdx} className="text-xs sm:text-sm text-slate-800 leading-relaxed my-0.5 font-medium">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
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
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportingPageIdx, setExportingPageIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  // Parse and paginate content into discrete A4 pages
  const blocks = useMemo(() => parseContentIntoBlocks(content), [content]);
  const pages = useMemo(() => paginateBlocks(blocks), [blocks]);

  // Unique document serial
  const docId = useMemo(() => {
    return `BAQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }, []);

  const formattedDate = useMemo(() => {
    if (generatedAt) {
      try {
        return new Date(generatedAt).toLocaleDateString('ar-PS');
      } catch {
        return generatedAt;
      }
    }
    return new Date().toLocaleDateString('ar-PS');
  }, [generatedAt]);

  const safeFileName = useMemo(() => {
    return (fileName || title || 'وثيقة_باقون_التعليمية')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '_');
  }, [fileName, title]);

  // Download high-resolution PNG image(s)
  // If 1 page: downloads 1 image.
  // If multi-page: downloads each page as a readable standalone A4 image (Page 1, Page 2...)
  const handleDownloadImage = async (targetPageIndex?: number) => {
    setIsExporting(true);

    try {
      if (typeof targetPageIndex === 'number') {
        const pageEl = pageRefs.current[targetPageIndex];
        if (!pageEl) return;
        setExportingPageIdx(targetPageIndex);
        const dataUrl = await toPng(pageEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.download = `${safeFileName}_صفحة_${targetPageIndex + 1}.png`;
        link.href = dataUrl;
        link.click();
      } else if (pages.length === 1) {
        const pageEl = pageRefs.current[0];
        if (!pageEl) return;
        const dataUrl = await toPng(pageEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.download = `${safeFileName}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Multi-page: download each page with high resolution
        for (let i = 0; i < pages.length; i++) {
          const pageEl = pageRefs.current[i];
          if (!pageEl) continue;
          setExportingPageIdx(i);
          const dataUrl = await toPng(pageEl, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            cacheBust: true,
          });
          const link = document.createElement('a');
          link.download = `${safeFileName}_صفحة_${i + 1}.png`;
          link.href = dataUrl;
          link.click();
          if (i < pages.length - 1) {
            await new Promise(r => setTimeout(r, 450));
          }
        }
      }
    } catch (err) {
      console.error('Failed to export document image', err);
      alert('حدث خطأ أثناء تصدير الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
      setExportingPageIdx(null);
    }
  };

  // Download high-resolution Multi-Page PDF
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const printableWidth = pageWidth - margin * 2; // 194mm
      const printableHeight = pageHeight - margin * 2; // 281mm

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pageRefs.current[i];
        if (!pageEl) continue;

        if (i > 0) {
          pdf.addPage();
        }

        const dataUrl = await toPng(pageEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const renderedHeight = (imgProps.height * printableWidth) / imgProps.width;

        pdf.addImage(
          dataUrl,
          'PNG',
          margin,
          margin,
          printableWidth,
          Math.min(renderedHeight, printableHeight),
          undefined,
          'FAST'
        );
      }

      pdf.save(`${safeFileName}.pdf`);
    } catch (err) {
      console.error('Failed to export document PDF', err);
      alert('حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print Document directly with CSS @media print
  const handlePrint = () => {
    window.print();
  };

  // Copy Image of Page 1 to Clipboard
  const handleCopyImage = async () => {
    const pageEl = pageRefs.current[0];
    if (!pageEl) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(pageEl, {
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
      handleCopyText();
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Markdown Text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* ── Print Styling Override ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #baaqoon-academic-document-container,
          #baaqoon-academic-document-container * {
            visibility: visible;
          }
          #baaqoon-academic-document-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .baaqoon-a4-page {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh !important;
            padding: 12mm !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ── Document Control Toolbar ── */}
      {showToolbar && (
        <div className="bg-slate-50 dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
              وثيقة دراسية معتمدة
            </span>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>{pages.length} {pages.length === 1 ? 'صفحة A4' : 'صفحات A4 مقروءة'}</span>
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {/* Copy Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-600 transition-colors shadow-xs"
              title="نسخ نص التكليف"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>

            {/* Copy Image */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isExporting || isExportingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-600 transition-colors shadow-xs disabled:opacity-60"
              title="نسخ الصفحة الأولى كصورة للحافظة"
            >
              {imageCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <ImageIcon className="w-3.5 h-3.5 text-slate-500" />}
              <span>{imageCopied ? 'تم نسخ الصورة!' : 'نسخ كصورة'}</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting || isExportingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-600 transition-colors shadow-xs disabled:opacity-60"
              title="طباعة فورية للوثيقة عبر المتصفح"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>طباعة</span>
            </button>

            {/* Export High-Resolution PNG Image(s) */}
            <button
              type="button"
              onClick={() => handleDownloadImage()}
              disabled={isExporting || isExportingPdf}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="تصدير الوثيقة كصور واضحة ومقروءة"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {exportingPageIdx !== null 
                      ? `جاري حفظ صفحة ${exportingPageIdx + 1}...` 
                      : 'جاري التصدير...'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {pages.length > 1 
                      ? `تصدير الصور (${pages.length} صور) 📷` 
                      : 'تصدير كصورة (PNG) 📷'}
                  </span>
                </>
              )}
            </button>

            {/* Multi-page specific page download pills */}
            {pages.length > 1 && (
              <div className="flex items-center gap-1">
                {pages.map((_, pIdx) => (
                  <button
                    key={`dl-btn-${pIdx}`}
                    type="button"
                    onClick={() => handleDownloadImage(pIdx)}
                    disabled={isExporting || isExportingPdf}
                    className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold"
                    title={`تحميل صفحة ${pIdx + 1} فقط كصورة`}
                  >
                    ص{pIdx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Export High-Resolution PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting || isExportingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="تحميل وثيقة التقييم كملف PDF متعدد الصفحات مقروء بالكامل"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تجهيز PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    تصدير كـ (PDF) 📄 {pages.length > 1 ? `(${pages.length} ص)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Academic Visual Document Container (Multi-Page A4 Canvas) ── */}
      <div 
        id="baaqoon-academic-document-container"
        className="overflow-x-auto p-1 sm:p-2 bg-slate-200/60 dark:bg-slate-950/60 rounded-2xl space-y-6"
      >
        {pages.map((pageBlocks, pIdx) => (
          <React.Fragment key={`page-wrapper-${pIdx}`}>
            {/* On-screen visual page boundary separator */}
            {pIdx > 0 && (
              <div className="flex items-center justify-center my-4 gap-3 text-xs font-black text-slate-500 select-none print:hidden">
                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 max-w-xs" />
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 shadow-xs border border-slate-300 dark:border-slate-700">
                  نهاية الصفحة {pIdx} ── بداية الصفحة {pIdx + 1}
                </span>
                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 max-w-xs" />
              </div>
            )}

            <div
              ref={(el) => { pageRefs.current[pIdx] = el; }}
              id={`baaqoon-a4-page-${pIdx + 1}`}
              className="baaqoon-a4-page bg-white text-slate-900 border-2 border-slate-300 rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-6 sm:p-9 flex flex-col justify-between text-right font-sans select-text relative"
              style={{
                minHeight: '1080px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            >
              {/* Decorative top ribbon */}
              <div className="h-1.5 w-full bg-gradient-to-l from-indigo-600 via-violet-600 to-emerald-600 rounded-t-lg -mt-3 mb-2 shrink-0" />

              {/* ══════════════════════════════════════════════════════════════════════ */}
              {/* TOP HEADER: Full on Page 1 / Compact Sub-Header on Subsequent Pages  */}
              {/* ══════════════════════════════════════════════════════════════════════ */}
              {pIdx === 0 ? (
                <div className="space-y-4 shrink-0">
                  {/* Institutional Platform Header */}
                  <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 text-xs">
                    {/* Right: Platform & Document Info */}
                    <div className="text-right space-y-0.5 max-w-[200px]">
                      <p className="font-black text-slate-900 text-xs">منصة باقون التعليمية</p>
                      <p className="font-bold text-slate-600 text-[11px]">وثيقة دراسية وتقويمية معتمدة</p>
                      <p className="font-medium text-slate-500 text-[10px]">المنظومة البيداغوجية المتكاملة</p>
                    </div>

                    {/* Center: Baaqoon Official Crest */}
                    <div className="text-center px-2 flex flex-col items-center">
                      <img 
                        src={baaqoonLogo} 
                        alt="شعار منصة باقون" 
                        className="w-12 h-12 object-contain rounded-full shadow-xs mb-1"
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

                  {/* Title & Metadata Badges */}
                  <div className="text-center space-y-2 pt-1 pb-2 border-b border-dashed border-slate-300">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                      {title}
                    </h1>

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
                </div>
              ) : (
                /* Compact Top Header for Subsequent Pages */
                <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2.5 text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <img 
                      src={baaqoonLogo} 
                      alt="شعار باقون" 
                      className="w-7 h-7 object-contain rounded-full shadow-xs"
                      crossOrigin="anonymous"
                    />
                    <div>
                      <p className="font-black text-slate-900 text-xs">منصة باقون التعليمية</p>
                      <p className="font-bold text-indigo-700 text-[10px]">
                        تابع: {title}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {documentTypeLabel} — تابع
                    </span>
                  </div>

                  <div className="text-left text-[11px] font-bold text-slate-600">
                    {cohortName && <p className="text-indigo-900 font-black">الفوج: {cohortName}</p>}
                    <p className="text-[10px] text-slate-500 font-mono">السنة الدراسية: 2025 / 2026</p>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════════ */}
              {/* PAGE CONTENT BLOCKS                                                  */}
              {/* ══════════════════════════════════════════════════════════════════════ */}
              <div className="py-2.5 flex-1 min-h-[220px]">
                {pageBlocks.map((b) => renderBlock(b))}
              </div>

              {/* ══════════════════════════════════════════════════════════════════════ */}
              {/* OFFICIAL FOOTER WITH LOGO, WATERMARK & PAGE NUMBERING                */}
              {/* ══════════════════════════════════════════════════════════════════════ */}
              <div className="pt-3 border-t-2 border-slate-800 mt-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-slate-600 shrink-0">
                {/* Brand Attribution & Logo */}
                <div className="flex items-center gap-2">
                  <img 
                    src={baaqoonLogo} 
                    alt="شعار باقون" 
                    className="w-5 h-5 object-contain rounded-full border border-slate-300 shadow-xs shrink-0"
                    crossOrigin="anonymous"
                  />
                  <div className="text-right">
                    <p className="text-[10px] sm:text-[11px] font-black text-slate-800 leading-tight">
                      مولدة من منصة باقون التعليمية — جميع الحقوق محفوظة © 2026
                    </p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-500">
                      {fromFallback 
                        ? 'مستخرجة من قاعدة البيانات البيداغوجية المنهجية المعتمدة' 
                        : `مولدة بواسطة الذكاء الاصطناعي البيداغوجي المعتمد (${aiModel})`}
                    </p>
                  </div>
                </div>

                {/* Document Serial & Page Number */}
                <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
                    {docId}
                  </span>
                  <span className="font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    الصفحة {pIdx + 1} من {pages.length}
                  </span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
