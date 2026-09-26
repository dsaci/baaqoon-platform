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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-baaqoon-accent" />
            المكتبة الرقمية
          </h1>
          <p className="text-baaqoon-500 dark:text-baaqoon-400 mt-1">
            الكتب المدرسية الرسمية — وزارة التربية والتعليم العالي الفلسطينية
            (2025)
          </p>
        </div>
        <a
          href="https://moe.edu.ps/class12/books"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-baaqoon-accent hover:text-baaqoon-accentDark border border-baaqoon-accent/30 rounded-lg hover:bg-baaqoon-accent/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          موقع الوزارة الرسمي
        </a>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-baaqoon-400" />
          <input
            type="text"
            placeholder="ابحث عن كتاب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-baaqoon-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="pr-10 pl-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-900 appearance-none min-w-[180px]"
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
        <div className="glass-panel p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-baaqoon-300 mb-3" />
          <p className="text-baaqoon-500 dark:text-baaqoon-400">
            لم يتم العثور على كتب مطابقة للبحث
          </p>
        </div>
      ) : (
        Object.entries(groupedBooks).map(([branch, books]) => (
          <div key={branch}>
            <h2 className="text-lg font-bold text-baaqoon-800 dark:text-baaqoon-100 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-baaqoon-accent inline-block" />
              الفرع {BRANCHES[branch] || branch}
              <span className="text-sm font-normal text-baaqoon-400">
                ({books.length} كتب)
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="glass-panel overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`h-32 bg-gradient-to-br ${book.color} flex items-center justify-center p-4 relative`}
                  >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <BookOpen className="w-12 h-12 text-white/90 relative z-10" />
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-baaqoon-900 dark:text-white text-sm leading-relaxed">
                        {book.nameAr}
                      </h3>
                      <p className="text-xs text-baaqoon-400 mt-0.5">
                        {book.nameEn}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex gap-2">
                        <a
                          href={book.downloadUrl}
                          download
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> تحميل PDF
                        </a>
                        <a
                          href={book.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-baaqoon-200 dark:border-baaqoon-700 text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 text-xs font-medium rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> تصفّح
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
                            className="w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 font-bold rounded-lg px-3 py-2 transition-colors text-xs border border-purple-200 dark:border-purple-800"
                          >
                            <Bot className="w-4 h-4" /> توليد حصة آلياً
                          </button>
                          <button
                            onClick={() => setIsGeneratorOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-baaqoon-100 hover:bg-baaqoon-200 text-baaqoon-800 font-medium rounded-lg px-3 py-2 transition-colors text-xs border border-baaqoon-200"
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
