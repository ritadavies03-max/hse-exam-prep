import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  BookOpen,
  Eye,
  EyeOff,
  Flag,
  Play,
} from 'lucide-react';
import {
  ALL_HSE_QUESTIONS,
  HSE_CATEGORIES,
  HSECategory,
  HSEQuestion,
  OptionKey,
} from '../data/questions';

interface QuestionBankExplorerProps {
  bookmarkedIds: number[];
  missedIds: number[];
  onToggleBookmark: (id: number) => void;
  onStartCustomQuiz: (questions: HSEQuestion[], title: string) => void;
}

export const QuestionBankExplorer: React.FC<QuestionBankExplorerProps> = ({
  bookmarkedIds,
  missedIds,
  onToggleBookmark,
  onStartCustomQuiz,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HSECategory | 'ALL'>('ALL');
  const [listFilter, setListFilter] = useState<'all120' | 'unique77' | 'bookmarked' | 'missed'>('all120');
  const [revealAllAnswers, setRevealAllAnswers] = useState(true);
  const [interactiveSelections, setInteractiveSelections] = useState<Record<number, OptionKey>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  const filteredQuestions = useMemo(() => {
    return ALL_HSE_QUESTIONS.filter((q) => {
      if (listFilter === 'unique77' && q.isDuplicateOf) return false;
      if (listFilter === 'bookmarked' && !bookmarkedIds.includes(q.id)) return false;
      if (listFilter === 'missed' && !missedIds.includes(q.id)) return false;
      if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inId = `q${q.id}` === query || `#${q.id}` === query || String(q.id) === query;
        const inText = q.questionText.toLowerCase().includes(query);
        const inOptions = q.options.some((o) => o.text.toLowerCase().includes(query));
        const inExp = q.explanation.toLowerCase().includes(query);
        return inId || inText || inOptions || inExp;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, listFilter, bookmarkedIds, missedIds]);

  const handleOptionClick = (questionId: number, key: OptionKey) => {
    setInteractiveSelections((prev) => ({
      ...prev,
      [questionId]: key,
    }));
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1.5">
            <span>Complete PDF Repository</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Questions 1–120 (Pages 1–19)</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Official Key (Pages 20–24)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Official 120-Question Bank & Answer Key
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search any question, click an option to test yourself on the spot, or inspect every correct and wrong option breakdown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRevealAllAnswers((prev) => !prev)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            {revealAllAnswers ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Hide Answers (Self-Test Mode)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>Show All Answers & Explanations</span>
              </>
            )}
          </button>

          {filteredQuestions.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onStartCustomQuiz(
                  filteredQuestions,
                  selectedCategory === 'ALL'
                    ? `Filtered Bank Quiz (${filteredQuestions.length} Qs)`
                    : `${selectedCategory} (${filteredQuestions.length} Qs)`
                )
              }
              className="px-4 py-2 text-xs font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Quiz This View ({filteredQuestions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Segmented Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PDF Question # (e.g. 34, 78), keyword (PASS, ISO 14001, man-hours, LWC, ISPON)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600 focus:bg-white transition-colors"
            />
          </div>

          {/* Pool Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setListFilter('all120')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                listFilter === 'all120' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 120 PDF Questions
            </button>
            <button
              type="button"
              onClick={() => setListFilter('unique77')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                listFilter === 'unique77' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              77 Unique Core Questions
            </button>
            <button
              type="button"
              onClick={() => setListFilter('missed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                listFilter === 'missed' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Missed ({missedIds.length})
            </button>
            <button
              type="button"
              onClick={() => setListFilter('bookmarked')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                listFilter === 'bookmarked' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved ({bookmarkedIds.length})
            </button>
          </div>
        </div>

        {/* Topic Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Topics ({ALL_HSE_QUESTIONS.length})
          </button>
          {HSE_CATEGORIES.map((cat) => {
            const count = ALL_HSE_QUESTIONS.filter((q) => q.category === cat.id).length;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <span>
          Showing <strong className="font-mono text-slate-900 tabular-nums">{filteredQuestions.length}</strong> questions
          from the uploaded HSE training document
        </span>
        {Object.keys(interactiveSelections).length > 0 && (
          <button
            type="button"
            onClick={() => {
              setInteractiveSelections({});
              setExpandedExplanations({});
            }}
            className="text-sky-700 hover:underline font-medium cursor-pointer"
          >
            Clear My Test Selections ({Object.keys(interactiveSelections).length})
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h3 className="text-base font-semibold text-slate-900 mb-1">No matching questions found</h3>
          <p className="text-sm text-slate-500 mb-4">
            Try clearing your search query or switching back to "All 120 PDF Questions".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setListFilter('all120');
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredQuestions.map((q) => {
            const userChoice = interactiveSelections[q.id];
            const isRevealed = revealAllAnswers || !!userChoice || !!expandedExplanations[q.id];
            const isBookmarked = bookmarkedIds.includes(q.id);

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 transition-colors"
              >
                {/* Unboxed Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">Question #{q.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-700 font-medium">{q.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>PDF Page {q.pdfPage}</span>
                    <span aria-hidden="true">·</span>
                    <span>Answer Key Page {q.answerKeyPage}</span>
                    {q.isDuplicateOf && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500">Variant of Q#{q.isDuplicateOf}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedExplanations((prev) => ({
                          ...prev,
                          [q.id]: !isRevealed,
                        }))
                      }
                      className="text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
                    >
                      {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(q.id)}
                      className={`text-xs font-medium flex items-center gap-1 cursor-pointer ${
                        isBookmarked ? 'text-amber-600 font-semibold' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-3">
                  {q.id}. {q.questionText}
                </h3>

                {q.subItems && (
                  <div className="bg-slate-50 border-l-2 border-slate-300 pl-4 py-2.5 mb-4 space-y-1 text-sm text-slate-700">
                    {q.subItems.map((item, i) => (
                      <div key={i}>{item}</div>
                    ))}
                  </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {q.options.map((opt) => {
                    const isCorrect = opt.key === q.correctAnswer;
                    const isPicked = userChoice === opt.key;

                    let rowStyle =
                      'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-800';
                    let badgeStyle = 'bg-slate-200 text-slate-700';

                    if (isRevealed) {
                      if (isCorrect) {
                        rowStyle = 'bg-emerald-50/80 border-emerald-500 text-slate-900';
                        badgeStyle = 'bg-emerald-600 text-white';
                      } else if (isPicked && !isCorrect) {
                        rowStyle = 'bg-red-50/80 border-red-400 text-slate-900';
                        badgeStyle = 'bg-red-600 text-white';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleOptionClick(q.id, opt.key)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-colors flex flex-col gap-1.5 cursor-pointer ${rowStyle}`}
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0 mt-0.5 ${badgeStyle}`}
                            >
                              {opt.key}
                            </span>
                            <span className="font-medium leading-snug">{opt.text}</span>
                          </div>

                          {isRevealed && (
                            <div className="shrink-0 text-xs font-semibold whitespace-nowrap">
                              {isCorrect && (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{isPicked ? '✓ Your Choice (Correct)' : '✓ Correct Answer'}</span>
                                </span>
                              )}
                              {!isCorrect && isPicked && (
                                <span className="text-red-600 flex items-center gap-1">
                                  <XCircle className="w-4 h-4" />
                                  <span>✗ Your Choice (Wrong)</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {isRevealed && (
                          <div className="pl-8 text-xs text-slate-600">
                            {q.wrongOptionsAnalysis[opt.key]}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Block */}
                {isRevealed && (
                  <div className="bg-sky-50/60 border-l-4 border-sky-600 p-4 rounded-r-lg">
                    <div className="text-xs font-semibold text-sky-900 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                      <span>
                        Official PDF Answer ({q.correctAnswer}: {q.officialAnswerSummary}) — Explanation
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
