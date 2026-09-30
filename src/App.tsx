import { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Shuffle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Clock,
  RotateCcw,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ALL_HSE_QUESTIONS,
  UNIQUE_HSE_QUESTIONS,
  HSE_CATEGORIES,
  HSECategory,
  HSEQuestion,
  getCategoryCounts,
} from './data/questions';
import { QuizStage, QuizMode, QuizSessionResult } from './components/QuizStage';
import { QuestionBankExplorer } from './components/QuestionBankExplorer';
import { StudyReferenceDeck } from './components/StudyReferenceDeck';

type NavTab = 'builder' | 'quiz' | 'bank' | 'reference';

const STORAGE_KEYS = {
  HISTORY: 'hse_quiz_master_history_v1',
  BOOKMARKS: 'hse_quiz_master_bookmarks_v1',
  MISSED: 'hse_quiz_master_missed_v1',
  MASTERED: 'hse_quiz_master_mastered_v1',
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('builder');

  // Quiz Builder Configuration State
  const [builderMode, setBuilderMode] = useState<QuizMode>('practice');
  const [builderPool, setBuilderPool] = useState<'all120' | 'unique77' | 'missed' | 'bookmarked'>('all120');
  const [builderCategory, setBuilderCategory] = useState<HSECategory | 'ALL'>('ALL');
  const [builderCount, setBuilderCount] = useState<number | 'ALL'>(20);
  const [builderShuffle, setBuilderShuffle] = useState<boolean>(false);
  const [builderTimeLimit, setBuilderTimeLimit] = useState<number | null>(null);

  // Active Quiz Session State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<HSEQuestion[]>(
    ALL_HSE_QUESTIONS.slice(0, 20)
  );
  const [activeQuizTitle, setActiveQuizTitle] = useState<string>('PDF Questions #1–#20 Practice');
  const [activeQuizMode, setActiveQuizMode] = useState<QuizMode>('practice');
  const [activeQuizTimeLimit, setActiveQuizTimeLimit] = useState<number | null>(null);
  const [quizSessionKey, setQuizSessionKey] = useState<number>(1);

  // Persistent User Progress State
  const [quizHistory, setQuizHistory] = useState<QuizSessionResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [missedIds, setMissedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MISSED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [masteredIds, setMasteredIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MASTERED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(quizHistory));
    } catch {
      // ignore storage errors
    }
  }, [quizHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarkedIds));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MISSED, JSON.stringify(missedIds));
    } catch {
      // ignore
    }
  }, [missedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTERED, JSON.stringify(masteredIds));
    } catch {
      // ignore
    }
  }, [masteredIds]);

  const handleToggleBookmark = (id: number) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCompleteQuiz = (result: QuizSessionResult) => {
    setQuizHistory((prev) => [result, ...prev.slice(0, 29)]);

    // Update mastered and missed question tracking
    const newlyMastered = new Set(masteredIds);
    const newlyMissed = new Set(missedIds);

    result.questionIds.forEach((qId) => {
      const q = ALL_HSE_QUESTIONS.find((item) => item.id === qId);
      if (!q) return;
      const userAns = result.userAnswers[qId];
      if (userAns === q.correctAnswer) {
        newlyMastered.add(qId);
        newlyMissed.delete(qId);
      } else if (userAns) {
        newlyMissed.add(qId);
      }
    });

    setMasteredIds(Array.from(newlyMastered));
    setMissedIds(Array.from(newlyMissed));
  };

  // Candidate questions based on current builder settings
  const availableBuilderPool = useMemo(() => {
    let base = ALL_HSE_QUESTIONS;
    if (builderPool === 'unique77') {
      base = UNIQUE_HSE_QUESTIONS;
    } else if (builderPool === 'missed') {
      base = ALL_HSE_QUESTIONS.filter((q) => missedIds.includes(q.id));
    } else if (builderPool === 'bookmarked') {
      base = ALL_HSE_QUESTIONS.filter((q) => bookmarkedIds.includes(q.id));
    }

    if (builderCategory !== 'ALL') {
      base = base.filter((q) => q.category === builderCategory);
    }
    return base;
  }, [builderPool, builderCategory, missedIds, bookmarkedIds]);

  const launchConfiguredQuiz = () => {
    if (availableBuilderPool.length === 0) return;

    let selected = builderShuffle
      ? shuffleArray(availableBuilderPool)
      : [...availableBuilderPool];

    if (builderCount !== 'ALL') {
      selected = selected.slice(0, builderCount);
    }

    const catLabel = builderCategory === 'ALL' ? 'All HSE Topics' : builderCategory;
    const poolLabel =
      builderPool === 'unique77'
        ? 'Unique Core'
        : builderPool === 'missed'
        ? 'Weak-Spot Drill'
        : builderPool === 'bookmarked'
        ? 'Saved List'
        : 'Official PDF';

    setActiveQuizQuestions(selected);
    setActiveQuizTitle(`${poolLabel}: ${catLabel} (${selected.length} Qs)`);
    setActiveQuizMode(builderMode);
    setActiveQuizTimeLimit(
      builderMode === 'exam' ? builderTimeLimit || Math.ceil(selected.length * 1.0) : builderTimeLimit
    );
    setQuizSessionKey((k) => k + 1);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const launchPresetQuiz = (
    questionsList: HSEQuestion[],
    title: string,
    mode: QuizMode = 'practice',
    timeLimit: number | null = null
  ) => {
    if (questionsList.length === 0) return;
    setActiveQuizQuestions(questionsList);
    setActiveQuizTitle(title);
    setActiveQuizMode(mode);
    setActiveQuizTimeLimit(timeLimit);
    setQuizSessionKey((k) => k + 1);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryCounts = useMemo(
    () => getCategoryCounts(builderPool === 'unique77'),
    [builderPool]
  );

  // Sequential 20-question blocks for systematic PDF progression (1-20, 21-40, 41-60, 61-80, 81-100, 101-120)
  const pdfBatches = [
    { label: 'Batch 1: Questions 1–20', start: 0, end: 20, pages: 'PDF Pages 1–4' },
    { label: 'Batch 2: Questions 21–40', start: 20, end: 40, pages: 'PDF Pages 4–7' },
    { label: 'Batch 3: Questions 41–60', start: 40, end: 60, pages: 'PDF Pages 7–10' },
    { label: 'Batch 4: Questions 61–80', start: 60, end: 80, pages: 'PDF Pages 10–13' },
    { label: 'Batch 5: Questions 81–100', start: 80, end: 100, pages: 'PDF Pages 13–16' },
    { label: 'Batch 6: Questions 101–120', start: 100, end: 120, pages: 'PDF Pages 16–19' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className="text-lg font-bold tracking-tight text-slate-900 font-serif-display whitespace-nowrap cursor-pointer"
        >
          HSE Quiz Master
        </button>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'builder'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : 'hover:text-slate-900'
            }`}
          >
            Quiz Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : 'hover:text-slate-900'
            }`}
          >
            Active Quiz ({activeQuizQuestions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'bank'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : 'hover:text-slate-900'
            }`}
          >
            Question Bank (120)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reference')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'reference'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : 'hover:text-slate-900'
            }`}
          >
            Study Reference
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              launchPresetQuiz(
                shuffleArray(UNIQUE_HSE_QUESTIONS).slice(0, 20),
                'Quick 20-Question Random Practice',
                'practice',
                null
              )
            }
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Quick 20-Q Practice
          </button>
          <button
            type="button"
            onClick={() =>
              launchPresetQuiz(
                ALL_HSE_QUESTIONS,
                'Full 120-Question Official HSE Mock Exam',
                'exam',
                90
              )
            }
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Full 120-Q Exam
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-white border-b border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className={`px-2.5 py-1 rounded ${activeTab === 'builder' ? 'bg-slate-900 text-white' : ''}`}
        >
          Quiz Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`px-2.5 py-1 rounded ${activeTab === 'quiz' ? 'bg-slate-900 text-white' : ''}`}
        >
          Active Quiz
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`px-2.5 py-1 rounded ${activeTab === 'bank' ? 'bg-slate-900 text-white' : ''}`}
        >
          120 Q-Bank
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reference')}
          className={`px-2.5 py-1 rounded ${activeTab === 'reference' ? 'bg-slate-900 text-white' : ''}`}
        >
          Formulas
        </button>
      </div>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1">
        {activeTab === 'quiz' && (
          <QuizStage
            key={quizSessionKey}
            questions={activeQuizQuestions}
            mode={activeQuizMode}
            quizTitle={activeQuizTitle}
            timeLimitMinutes={activeQuizTimeLimit}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onCompleteQuiz={handleCompleteQuiz}
            onExitQuiz={() => setActiveTab('builder')}
            onStartRetryWrong={(wrongList) =>
              launchPresetQuiz(
                wrongList,
                `Targeted Retry (${wrongList.length} Missed Questions)`,
                'practice',
                null
              )
            }
          />
        )}

        {activeTab === 'bank' && (
          <QuestionBankExplorer
            bookmarkedIds={bookmarkedIds}
            missedIds={missedIds}
            onToggleBookmark={handleToggleBookmark}
            onStartCustomQuiz={(qs, title) => launchPresetQuiz(qs, title, 'practice', null)}
          />
        )}

        {activeTab === 'reference' && (
          <StudyReferenceDeck
            onStartTopicQuiz={(qs, title) => launchPresetQuiz(qs, title, 'practice', null)}
          />
        )}

        {activeTab === 'builder' && (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-10">
            {/* Hero / Overview Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="max-w-2xl">
                  <div className="text-xs text-slate-500 mb-2">
                    <span>Uploaded HSE Exam Preparation Material</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>120 Questions (Pages 1–19)</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>Verified Answer Key (Pages 20–24)</span>
                  </div>
                  <h1
                    className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    HSE Exam Preparation Quiz Master
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                    Generate custom practice quizzes or timed mock exams strictly from the 120 questions in your uploaded PDF. Every question includes instant verification of correct and wrong answers alongside detailed explanations.
                  </p>
                </div>

                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div>
                    <div className="text-xs text-slate-500">Mastered</div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                      {masteredIds.length}
                      <span className="text-sm font-normal text-slate-400">/120</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Needs Review</div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-red-600 mt-0.5">
                      {missedIds.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Saved Items</div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-sky-600 mt-0.5">
                      {bookmarkedIds.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Start Bar */}
              <div className="pt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  Want to jump right in? Choose a sequential 20-question batch below or customize your quiz generator.
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {missedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        launchPresetQuiz(
                          ALL_HSE_QUESTIONS.filter((q) => missedIds.includes(q.id)),
                          `Weak-Spot Drill (${missedIds.length} Missed Questions)`,
                          'practice',
                          null
                        )
                      }
                      className="px-3.5 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Drill {missedIds.length} Missed Questions</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('bank')}
                    className="px-3.5 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Browse All 120 Questions & Key</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN WORKSPACE: Left = Custom Quiz Generator, Right = Sequential PDF Batches */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT 7 COLS: Custom Quiz Generator */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                      <span>01. Custom Practice Quiz Generator</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure feedback style, question pool, topic focus, and quiz length.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-600">
                    {availableBuilderPool.length} matching Qs
                  </span>
                </div>

                {/* Step 1: Quiz Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    1. Select Quiz Feedback Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBuilderMode('practice');
                        setBuilderTimeLimit(null);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        builderMode === 'practice'
                          ? 'bg-sky-50/70 border-sky-600 ring-1 ring-sky-600'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                        <span>Practice Mode (Instant Explanation)</span>
                        {builderMode === 'practice' && (
                          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Reveals whether your answer is right or wrong immediately after each click with full option-by-option explanations.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBuilderMode('exam');
                        setBuilderTimeLimit(30);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        builderMode === 'exam'
                          ? 'bg-sky-50/70 border-sky-600 ring-1 ring-sky-600'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                        <span>Mock Exam Mode (Timed Simulation)</span>
                        {builderMode === 'exam' && (
                          <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Simulates real exam conditions without hints. Grades all answers and shows full explanations upon submission.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Step 2: Question Source Pool */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    2. Question Source Pool (From Uploaded PDF Only)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setBuilderPool('all120')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        builderPool === 'all120'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      All 120 PDF Qs
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderPool('unique77')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        builderPool === 'unique77'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      77 Unique Core Qs
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderPool('missed')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        builderPool === 'missed'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Missed ({missedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderPool('bookmarked')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        builderPool === 'bookmarked'
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Saved ({bookmarkedIds.length})
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {builderPool === 'unique77'
                      ? 'Filters out the 43 repeated variation questions in the second half of the PDF so you only drill each unique concept once.'
                      : builderPool === 'all120'
                      ? 'Includes all 120 numbered questions exactly as printed across pages 1–19 of your PDF.'
                      : builderPool === 'missed'
                      ? 'Focuses exclusively on questions you previously answered incorrectly.'
                      : 'Focuses exclusively on questions you bookmarked/saved for review.'}
                  </p>
                </div>

                {/* Step 3: Topic Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    3. Filter by HSE Topic Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBuilderCategory('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        builderCategory === 'ALL'
                          ? 'bg-sky-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Topics ({categoryCounts.ALL})
                    </button>
                    {HSE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBuilderCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          builderCategory === cat.id
                            ? 'bg-sky-600 text-white font-semibold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label} ({categoryCounts[cat.id]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Number of Questions & Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      4. Number of Questions
                    </label>
                    <div className="flex items-center gap-1.5">
                      {([10, 20, 30, 50, 'ALL'] as const).map((cnt) => (
                        <button
                          key={String(cnt)}
                          type="button"
                          onClick={() => setBuilderCount(cnt)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            builderCount === cnt
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {cnt === 'ALL' ? `All (${availableBuilderPool.length})` : cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      5. Question Ordering
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBuilderShuffle(false)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          !builderShuffle
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        PDF Order (1→120)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderShuffle(true)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          builderShuffle
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Random Shuffle</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Launch CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Ready to generate{' '}
                    <strong className="font-mono text-slate-900">
                      {builderCount === 'ALL'
                        ? availableBuilderPool.length
                        : Math.min(builderCount, availableBuilderPool.length)}
                    </strong>{' '}
                    questions in <strong className="text-slate-900">{builderMode}</strong> mode.
                  </div>

                  <button
                    type="button"
                    disabled={availableBuilderPool.length === 0}
                    onClick={launchConfiguredQuiz}
                    className="px-6 py-3 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Practice Quiz</span>
                  </button>
                </div>
              </div>

              {/* RIGHT 5 COLS: Sequential 20-Question PDF Study Batches */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">
                    02. Sequential PDF Study Batches (1–120)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Work through the entire 24-page PDF systematically in 6 bite-sized blocks of 20 questions.
                  </p>
                </div>

                <div className="space-y-3">
                  {pdfBatches.map((batch, idx) => {
                    const batchQuestions = ALL_HSE_QUESTIONS.slice(batch.start, batch.end);
                    const masteredInBatch = batchQuestions.filter((q) =>
                      masteredIds.includes(q.id)
                    ).length;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{batch.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span>{batch.pages}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-emerald-700 font-medium">
                              {masteredInBatch}/20 Mastered
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            launchPresetQuiz(
                              batchQuestions,
                              batch.label,
                              'practice',
                              null
                            )
                          }
                          className="px-3.5 py-2 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors shrink-0 cursor-pointer"
                        >
                          Practice Batch
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: Topic-Specific Drill Grid (All 9 HSE Domains in PDF) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    03. Drill by HSE Topic Domain
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target specific subject areas extracted from the 120 exam questions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {HSE_CATEGORIES.map((cat) => {
                  const catQuestions = ALL_HSE_QUESTIONS.filter((q) => q.category === cat.id);
                  const masteredCount = catQuestions.filter((q) =>
                    masteredIds.includes(q.id)
                  ).length;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="text-xs text-slate-500 mb-1 flex items-center justify-between font-mono tabular-nums">
                          <span>{catQuestions.length} PDF Questions</span>
                          <span className="text-emerald-700 font-semibold">
                            {masteredCount}/{catQuestions.length} Mastered
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{cat.label}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            launchPresetQuiz(
                              catQuestions,
                              `${cat.label} — Complete Topic Drill`,
                              'practice',
                              null
                            )
                          }
                          className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Topic Quiz ({catQuestions.length} Qs)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: Recent Quiz Session History */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">04. Recent Practice & Exam History</h2>
                  <p className="text-xs text-slate-500">
                    Your completed quiz attempts and accuracy breakdown.
                  </p>
                </div>
                {quizHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizHistory([]);
                      setMissedIds([]);
                      setMasteredIds([]);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Progress</span>
                  </button>
                )}
              </div>

              {quizHistory.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No completed quizzes yet. Start any quiz above to track your score and explanations.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 pr-4 font-semibold">Quiz Session</th>
                        <th className="py-2.5 px-4 font-semibold">Mode</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Score</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Correct / Wrong</th>
                        <th className="py-2.5 pl-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quizHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-3 pr-4 font-medium text-slate-900">{item.title}</td>
                          <td className="py-3 px-4 text-slate-600 capitalize">{item.mode}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                            <span
                              className={
                                item.scorePercent >= 70
                                  ? 'text-emerald-700'
                                  : item.scorePercent >= 50
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }
                            >
                              {item.scorePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            <span className="text-emerald-700">✓ {item.correctCount}</span>
                            <span className="mx-1.5 text-slate-300">/</span>
                            <span className="text-red-600">✗ {item.wrongCount}</span>
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const qs = ALL_HSE_QUESTIONS.filter((q) =>
                                  item.questionIds.includes(q.id)
                                );
                                launchPresetQuiz(qs, item.title, 'practice', null);
                              }}
                              className="text-sky-700 hover:underline font-semibold cursor-pointer"
                            >
                              Retake
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-8 mt-12">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            HSE Exam Preparation Quiz Master · Source: Uploaded HSE Training Questions (1–120) & Official Answer Key (Pages 20–24)
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Quiz Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className="hover:text-slate-900 cursor-pointer"
            >
              120 Question Bank
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reference')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Formulas & Key
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
