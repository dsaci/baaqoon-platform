import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Filter,
  Bot,
  FileText,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import RapidGeneratorModal from "../../assessments/components/RapidGeneratorModal";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/axios";

const MOE_BASE = "https://moe.edu.ps/storage/app/class12";

const BRANCHES: Record<string, string> = {
  scientific: "العلمي",
  literary: "الأدبي",
  entrepreneurship: "الريادة والأعمال",
  industrial: "الصناعي",
  sharia: "الشرعي",
};

interface Textbook {
  id: string;
  nameAr: string;
  nameEn: string;
  branch: string;
  downloadUrl: string;
  color: string;
}

export default function TextbooksPage() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await api.get("/curriculum/subjects/tree");
      const books: Textbook[] = [];
      const colors = [
        "from-green-500 to-green-700",
        "from-blue-600 to-blue-800",
        "from-red-500 to-red-700",
        "from-purple-500 to-purple-700",
        "from-amber-500 to-amber-700",
      ];

      res.data.forEach((subject: any, idx: number) => {
        if (subject.courses) {
          subject.courses.forEach((course: any) => {
            books.push({
              id: course.id,
              nameAr: course.title || subject.nameAr,
              nameEn: subject.nameEn || "",
              branch: course.academicBranch || "scientific",
              downloadUrl: (subject.iconUrl && subject.iconUrl.startsWith('http')) ? subject.iconUrl : `${MOE_BASE}/${subject.iconUrl || ''}`,
              color: colors[idx % colors.length],
            });
          });
        }
      });
      return books;
    },
  });

  const filteredBooks = subjects.filter((book) => {
    const matchesBranch =
      selectedBranch === "all" || book.branch === selectedBranch;
    const matchesSearch =
      book.nameAr.includes(searchQuery) ||
      book.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // Group books by branch
  const groupedBooks: Record<string, Textbook[]> = {};
  filteredBooks.forEach((book) => {
    if (!groupedBooks[book.branch]) groupedBooks[book.branch] = [];
    groupedBooks[book.branch].push(book);
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">المكتبة الرقمية</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              الكتب المدرسية الرسمية — وزارة التربية والتعليم العالي الفلسطينية (2025)
            </p>
          </div>
        </div>

        <a
          href="https://moe.edu.ps/class12/books"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 hover:-translate-y-0.5 shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          موقع الوزارة
        </a>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن كتاب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 font-medium shadow-sm"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 appearance-none font-bold shadow-sm"
          >
            <option value="all">جميع الفروع</option>
            {Object.entries(BRANCHES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Grid by Branch */}
      {Object.keys(groupedBooks).length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold text-lg">
            لم يتم العثور على كتب مطابقة للبحث
          </p>
        </div>
      ) : (
        Object.entries(groupedBooks).map(([branch, books]) => (
          <div key={branch} className="mb-12">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] inline-block" />
              الفرع {BRANCHES[branch] || branch}
              <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {books.length} كتب
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg group hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                >
                  <div
                    className={`h-40 bg-gradient-to-br ${book.color} flex items-center justify-center p-6 relative`}
                  >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <BookOpen className="w-16 h-16 text-white/90 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between bg-white dark:bg-slate-800">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight mb-1">
                        {book.nameAr}
                      </h3>
                      <p className="text-xs font-bold text-slate-400">
                        {book.nameEn || "Palestinian Curriculum"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="flex gap-2">
                        <a
                          href={book.downloadUrl}
                          download
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
                        >
                          <Download className="w-4 h-4" /> تحميل PDF
                        </a>
                        <a
                          href={book.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4" /> تصفّح
                        </a>
                      </div>

                      {user?.primaryRole === "teacher" && (
                        <div className="flex flex-col gap-2 mt-2">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "سيتم نقلك لشاشة الجداول لاختيار الفوج وتوليد الحصة آلياً من هذا المنهج. هل تريد الاستمرار؟",
                                )
                              ) {
                                navigate("/teacher/curriculum");
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-bold rounded-xl px-4 py-2.5 transition-all text-xs shadow-md shadow-violet-500/20"
                          >
                            <Bot className="w-4 h-4" /> توليد حصة آلياً
                          </button>
                          <button
                            onClick={() => setIsGeneratorOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 font-bold rounded-xl px-4 py-2.5 transition-all text-xs border border-blue-200 dark:border-blue-800"
                          >
                            <FileText className="w-4 h-4" /> توليد واجب / اختبار
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Footer note */}
      <div className="text-center py-4 text-xs text-baaqoon-400">
        المصدر: وزارة التربية والتعليم العالي — دولة فلسطين 🇵🇸 | الصف الثاني عشر
        (التوجيهي) 2025
      </div>

      <RapidGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        cohortId={""}
      />
    </div>
  );
}
