import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckSquare,
  Clock,
  BookOpen,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { HSEQuestion, OptionKey } from '../data/questions';

export type QuizMode = 'practice' | 'exam';

export interface QuizSessionResult {
  id: string;
  date: string;
  mode: QuizMode;
  title: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  scorePercent: number;
  timeSpentSeconds: number;
  questionIds: number[];
  userAnswers: Record<number, OptionKey>;
}

interface QuizStageProps {
  questions: HSEQuestion[];
  mode: QuizMode;
  quizTitle: string;
  timeLimitMinutes: number | null;
  bookmarkedIds: number[];
  onToggleBookmark: (id: number) => void;
  onCompleteQuiz: (result: QuizSessionResult) => void;
  onExitQuiz: () => void;
  onStartRetryWrong: (wrongQuestions: HSEQuestion[]) => void;
}

export const QuizStage: React.FC<QuizStageProps> = ({
  questions,
  mode,
  quizTitle,
  timeLimitMinutes,
  bookmarkedIds,
  onToggleBookmark,
  onCompleteQuiz,
  onExitQuiz,
  onStartRetryWrong,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, OptionKey>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct' | 'unanswered'>('all');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Timer effect
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (timeLimitMinutes && next >= timeLimitMinutes * 60) {
          return timeLimitMinutes * 60;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, timeLimitMinutes]);

  const handleFinishQuiz = useCallback(() => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    setShowConfirmSubmit(false);

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (!ans) {
        unanswered += 1;
      } else if (ans === q.correctAnswer) {
        correct += 1;
      } else {
        wrong += 1;
      }
    });

    const scorePercent = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    onCompleteQuiz({
      id: `quiz-${Date.now()}`,
      date: new Date().toISOString(),
      mode,
      title: quizTitle,
      totalQuestions: questions.length,
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      scorePercent,
      timeSpentSeconds: elapsedSeconds,
      questionIds: questions.map((q) => q.id),
      userAnswers,
    });
  }, [isSubmitted, questions, userAnswers, mode, quizTitle, elapsedSeconds, onCompleteQuiz]);

  // Auto-submit when time runs out in exam mode
  useEffect(() => {
    if (!isSubmitted && timeLimitMinutes && elapsedSeconds >= timeLimitMinutes * 60) {
      handleFinishQuiz();
    }
  }, [elapsedSeconds, timeLimitMinutes, isSubmitted, handleFinishQuiz]);

  const handleSelectOption = useCallback(
    (optionKey: OptionKey) => {
      if (isSubmitted) return;
      // In practice mode, once answered & revealed, lock selection unless user resets question
      if (mode === 'practice' && revealedQuestions[currentQuestion.id]) {
        return;
      }
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionKey,
      }));
      if (mode === 'practice') {
        setRevealedQuestions((prev) => ({
          ...prev,
          [currentQuestion.id]: true,
        }));
      }
    },
    [isSubmitted, mode, revealedQuestions, currentQuestion]
  );

  const handleRevealWithoutAnswering = () => {
    if (!currentQuestion) return;
    setRevealedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const handleResetSingleQuestion = () => {
    if (!currentQuestion || isSubmitted) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
    setRevealedQuestions((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  // Keyboard shortcuts (A/B/C/D, Left/Right arrows)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSubmitted || showConfirmSubmit) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') handleSelectOption('A');
      if (key === 'B' || key === '2') handleSelectOption('B');
      if (key === 'C' || key === '3') handleSelectOption('C');
      if (key === 'D' || key === '4') handleSelectOption('D');
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, questions.length, isSubmitted, showConfirmSubmit, handleSelectOption]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;
  const remainingSeconds = timeLimitMinutes ? Math.max(0, timeLimitMinutes * 60 - elapsedSeconds) : null;

  // Live practice tallies
  let liveCorrect = 0;
  let liveWrong = 0;
  questions.forEach((q) => {
    const ans = userAnswers[q.id];
    if (ans) {
      if (ans === q.correctAnswer) liveCorrect++;
      else liveWrong++;
    }
  });

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center">
        <p className="text-slate-600 mb-4">No questions match this selection.</p>
        <button
          onClick={onExitQuiz}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Return to Quiz Builder
        </button>
      </div>
    );
  }

  // POST-SUBMISSION SUMMARY & FULL DETAILED REVIEW
  if (isSubmitted) {
    const total = questions.length;
    const scorePercent = total > 0 ? Math.round((liveCorrect / total) * 100) : 0;
    const unanswered = total - answeredCount;
    const wrongQuestionsList = questions.filter((q) => userAnswers[q.id] !== q.correctAnswer);

    const filteredReviewQuestions = questions.filter((q) => {
      const userAns = userAnswers[q.id];
      if (reviewFilter === 'correct') return userAns === q.correctAnswer;
      if (reviewFilter === 'wrong') return userAns && userAns !== q.correctAnswer;
      if (reviewFilter === 'unanswered') return !userAns;
      return true;
    });

    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Top Result Summary Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="text-xs text-slate-500 mb-2">
                <span>Assessment Complete</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>{mode === 'practice' ? 'Practice Quiz Mode' : 'Timed Exam Mode'}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Time: {formatTime(elapsedSeconds)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {quizTitle} — Performance Report
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Review every question below with your selected option, the verified PDF answer key, and full explanation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {wrongQuestionsList.length > 0 && (
                <button
                  onClick={() => onStartRetryWrong(wrongQuestionsList)}
                  className="px-4 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Drill {wrongQuestionsList.length} Missed/Skipped</span>
                </button>
              )}
              <button
                onClick={onExitQuiz}
                className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                New Quiz Setup
              </button>
            </div>
          </div>

          {/* Quantitative Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
            <div>
              <div className="text-xs text-slate-500">Overall Score</div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {scorePercent}%
              </div>
              <div className="text-xs font-medium mt-1 text-slate-600">
                {scorePercent >= 80
                  ? '● DISTINCTION READY'
                  : scorePercent >= 60
                  ? '● PASSING THRESHOLD'
                  : '▲ NEEDS REVIEW'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Correct Answers</div>
              <div className="text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {liveCorrect} <span className="text-base font-normal text-slate-400">/ {total}</span>
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1">✓ Verified Accurate</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Wrong Answers</div>
              <div className="text-3xl font-bold font-mono tabular-nums text-red-600 mt-1">
                {liveWrong} <span className="text-base font-normal text-slate-400">/ {total}</span>
              </div>
              <div className="text-xs text-red-600 font-medium mt-1">✗ Explanations Below</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Unanswered</div>
              <div className="text-3xl font-bold font-mono tabular-nums text-amber-600 mt-1">
                {unanswered} <span className="text-base font-normal text-slate-400">/ {total}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Skipped items</div>
            </div>
          </div>
        </div>

        {/* Filter Bar for Answer Review */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Detailed Question & Answer Breakdown ({filteredReviewQuestions.length})
          </h2>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                reviewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setReviewFilter('wrong')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                reviewFilter === 'wrong' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wrong ({liveWrong})
            </button>
            <button
              onClick={() => setReviewFilter('correct')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                reviewFilter === 'correct'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Correct ({liveCorrect})
            </button>
            {unanswered > 0 && (
              <button
                onClick={() => setReviewFilter('unanswered')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  reviewFilter === 'unanswered'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Skipped ({unanswered})
              </button>
            )}
          </div>
        </div>

        {/* Review Cards List */}
        <div className="space-y-6">
          {filteredReviewQuestions.map((q, idx) => {
            const userAns = userAnswers[q.id];
            const isCorrect = userAns === q.correctAnswer;
            const isBookmarked = bookmarkedIds.includes(q.id);

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-6 transition-colors"
              >
                {/* Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-800">PDF Q#{q.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Question Page {q.pdfPage}</span>
                    <span aria-hidden="true">·</span>
                    <span>Answer Key Page {q.answerKeyPage}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        isCorrect
                          ? 'text-emerald-700'
                          : userAns
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✓ CORRECT</span>
                        </>
                      ) : userAns ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>✗ WRONG (You chose {userAns}; Correct is {q.correctAnswer})</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>▲ UNANSWERED (Correct is {q.correctAnswer})</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => onToggleBookmark(q.id)}
                      className={`text-xs font-medium flex items-center gap-1 cursor-pointer ${
                        isBookmarked ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Bookmark question for review"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-3">
                  {idx + 1}. {q.questionText}
                </h3>

                {q.subItems && (
                  <div className="bg-slate-50 border-l-2 border-slate-300 pl-4 py-2.5 mb-4 space-y-1 text-sm text-slate-700">
                    {q.subItems.map((item, i) => (
                      <div key={i}>{item}</div>
                    ))}
                  </div>
                )}

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2.5 mb-5">
                  {q.options.map((opt) => {
                    const isThisCorrect = opt.key === q.correctAnswer;
                    const isThisUserSelection = userAns === opt.key;
                    const isWrongUserSelection = isThisUserSelection && !isThisCorrect;

                    return (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-lg border text-sm flex flex-col gap-1.5 ${
                          isThisCorrect
                            ? 'bg-emerald-50/70 border-emerald-500 text-slate-900'
                            : isWrongUserSelection
                            ? 'bg-red-50/70 border-red-400 text-slate-900'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                                isThisCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isWrongUserSelection
                                  ? 'bg-red-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="font-medium leading-snug">{opt.text}</span>
                          </div>

                          <div className="shrink-0 text-xs font-semibold whitespace-nowrap">
                            {isThisCorrect && isThisUserSelection && (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Your Answer (Correct)
                              </span>
                            )}
                            {isThisCorrect && !isThisUserSelection && (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Correct Answer
                              </span>
                            )}
                            {isWrongUserSelection && (
                              <span className="text-red-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Your Answer (Wrong)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Specific Option Reason */}
                        <div className="pl-8 text-xs text-slate-600">
                          {q.wrongOptionsAnalysis[opt.key]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Comprehensive Explanation Box */}
                <div className="bg-sky-50/70 border-l-4 border-sky-600 p-4 rounded-r-lg">
                  <div className="text-xs font-semibold text-sky-900 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                    <span>Official PDF Key ({q.correctAnswer}: {q.officialAnswerSummary}) — Detailed Explanation</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ STAGE (Two-Zone Educational Sandbox Layout)
  const selectedOption = userAnswers[currentQuestion.id];
  const isRevealed = mode === 'practice' && !!revealedQuestions[currentQuestion.id];
  const isCurrentCorrect = selectedOption === currentQuestion.correctAnswer;
  const isBookmarked = bookmarkedIds.includes(currentQuestion.id);
  const isFlagged = !!flaggedIds[currentQuestion.id];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6">
      {/* Top Subheader Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitQuiz}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1.5 px-2.5 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Quiz</span>
          </button>
          <span className="text-slate-300" aria-hidden="true">/</span>
          <div className="text-sm font-semibold text-slate-900 truncate max-w-[260px] sm:max-w-md">
            {quizTitle}
          </div>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {mode === 'practice' ? 'Instant Feedback Mode' : 'Simulated Exam Mode'}
          </span>
        </div>

        <div className="flex items-center gap-5">
          {mode === 'practice' && (
            <div className="text-xs font-mono tabular-nums flex items-center gap-3">
              <span className="text-emerald-700 font-semibold">✓ {liveCorrect} Correct</span>
              <span className="text-slate-300">·</span>
              <span className="text-red-600 font-semibold">✗ {liveWrong} Wrong</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {remainingSeconds !== null ? (
              <span className={remainingSeconds < 60 ? 'text-red-600 font-bold' : 'font-semibold'}>
                Time Left: {formatTime(remainingSeconds)}
              </span>
            ) : (
              <span>Elapsed: {formatTime(elapsedSeconds)}</span>
            )}
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Finish & Grade ({answeredCount}/{questions.length})
          </button>
        </div>
      </div>

      {/* Confirm Submit Banner (if triggered) */}
      {showConfirmSubmit && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-amber-950">
            <span className="font-semibold">Ready to submit your quiz?</span> You have answered{' '}
            <span className="font-mono font-bold tabular-nums">{answeredCount}</span> of{' '}
            <span className="font-mono font-bold tabular-nums">{questions.length}</span> questions.
            {answeredCount < questions.length && (
              <span className="ml-1 text-amber-800">
                ({questions.length - answeredCount} unanswered questions will be marked skipped.)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowConfirmSubmit(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Keep Working
            </button>
            <button
              onClick={handleFinishQuiz}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 cursor-pointer"
            >
              Confirm & View Full Results
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Zone Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT ZONE (Interactive Question & Explanation Stage - 8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          {/* Question Metadata Row (Unboxed zero-pill text with separators) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-900">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-700">PDF Q#{currentQuestion.id}</span>
              <span aria-hidden="true">·</span>
              <span>{currentQuestion.category}</span>
              <span aria-hidden="true">·</span>
              <span>PDF Page {currentQuestion.pdfPage}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setFlaggedIds((prev) => ({
                    ...prev,
                    [currentQuestion.id]: !prev[currentQuestion.id],
                  }))
                }
                className={`text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  isFlagged ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isFlagged ? 'Flagged for Review' : 'Flag'}</span>
              </button>

              <button
                onClick={() => onToggleBookmark(currentQuestion.id)}
                className={`text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  isBookmarked ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isBookmarked ? 'Saved to Study List' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Question Prompt */}
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed mb-5">
            {currentQuestion.questionText}
          </h2>

          {/* Sub-items for Roman Numeral / Numbered List Questions (e.g., Q11, Q41, Q107) */}
          {currentQuestion.subItems && (
            <div className="bg-slate-50 border-l-2 border-slate-400 pl-4 py-3 mb-6 space-y-1.5 text-sm text-slate-800 font-medium">
              {currentQuestion.subItems.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-3 mb-6" role="radiogroup" aria-label="Question Options">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.key;
              const isCorrectOption = opt.key === currentQuestion.correctAnswer;

              let buttonStyle =
                'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/60 text-slate-800';
              let badgeStyle = 'bg-slate-100 text-slate-700 border border-slate-200';

              if (isRevealed) {
                if (isCorrectOption) {
                  buttonStyle = 'bg-emerald-50/80 border-emerald-600 text-slate-900 ring-1 ring-emerald-600';
                  badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                } else if (isSelected && !isCorrectOption) {
                  buttonStyle = 'bg-red-50/80 border-red-500 text-slate-900 ring-1 ring-red-500';
                  badgeStyle = 'bg-red-600 text-white border-red-600';
                } else {
                  buttonStyle = 'bg-slate-50/60 border-slate-200 text-slate-500';
                  badgeStyle = 'bg-slate-200 text-slate-500 border-slate-200';
                }
              } else if (isSelected) {
                buttonStyle = 'bg-sky-50/80 border-sky-600 text-slate-900 ring-1 ring-sky-600';
                badgeStyle = 'bg-sky-600 text-white border-sky-600';
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectOption(opt.key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col gap-2 cursor-pointer ${buttonStyle}`}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-7 h-7 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${badgeStyle}`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm sm:text-base font-medium leading-snug">
                        {opt.text}
                      </span>
                    </div>

                    {/* Explicit Status Label (No Hue-Only Signaling) */}
                    {isRevealed && (
                      <div className="shrink-0 text-xs font-semibold whitespace-nowrap">
                        {isCorrectOption && isSelected && (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ CORRECT</span>
                          </span>
                        )}
                        {isCorrectOption && !isSelected && (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ CORRECT ANSWER</span>
                          </span>
                        )}
                        {!isCorrectOption && isSelected && (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            <span>✗ YOUR CHOICE</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* In Practice Mode, once revealed, show why this specific option is right or wrong */}
                  {isRevealed && (
                    <div className="pl-10 text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                      {currentQuestion.wrongOptionsAnalysis[opt.key]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback & Explanation Panel (Practice Mode) */}
          {mode === 'practice' && !isRevealed && (
            <div className="flex items-center justify-between pt-2 pb-4 text-xs text-slate-500">
              <span>Select an option (or press A, B, C, D) to check your answer immediately.</span>
              <button
                onClick={handleRevealWithoutAnswering}
                className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show Answer & Explanation</span>
              </button>
            </div>
          )}

          {isRevealed && (
            <div
              className={`rounded-xl p-5 mb-6 border-l-4 ${
                selectedOption
                  ? isCurrentCorrect
                    ? 'bg-emerald-50/50 border-emerald-600 border border-emerald-200'
                    : 'bg-red-50/40 border-red-600 border border-red-200'
                  : 'bg-sky-50/50 border-sky-600 border border-sky-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="text-xs font-bold tracking-wide text-slate-900 flex items-center gap-2">
                  {selectedOption ? (
                    isCurrentCorrect ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Spot On! Option {currentQuestion.correctAnswer} is Correct</span>
                      </span>
                    ) : (
                      <span className="text-red-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        <span>
                          ✗ Incorrect — You chose {selectedOption}, but the Correct Answer is{' '}
                          {currentQuestion.correctAnswer}
                        </span>
                      </span>
                    )
                  ) : (
                    <span className="text-sky-800 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Official Answer: Option {currentQuestion.correctAnswer}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">
                    PDF Answer Key Page {currentQuestion.answerKeyPage}
                  </span>
                  <button
                    onClick={handleResetSingleQuestion}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                Official Key Summary: {currentQuestion.correctAnswer} — {currentQuestion.officialAnswerSummary}
              </div>

              <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Bottom Navigation Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {currentIndex + 1} / {questions.length}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finish & Grade Quiz</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT ZONE (Question Navigator & Progress Deck - 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Question Navigator</h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mb-4">
            {mode === 'practice' ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Correct
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block" /> Wrong
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" /> Answered
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Flagged
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs border border-slate-300 inline-block" /> Unseen
            </span>
          </div>

          {/* Grid of Question Numbers */}
          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const ans = userAnswers[q.id];
              const isCurr = idx === currentIndex;
              const isFlag = !!flaggedIds[q.id];
              const isRev = mode === 'practice' && !!revealedQuestions[q.id];

              let cellStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400';

              if (isRev && ans) {
                if (ans === q.correctAnswer) {
                  cellStyle = 'bg-emerald-600 border-emerald-600 text-white font-bold';
                } else {
                  cellStyle = 'bg-red-600 border-red-600 text-white font-bold';
                }
              } else if (ans) {
                cellStyle = 'bg-sky-600 border-sky-600 text-white font-bold';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  title={`Question ${idx + 1} (PDF #${q.id})`}
                  className={`relative h-9 rounded-lg border font-mono text-xs tabular-nums flex items-center justify-center transition-all cursor-pointer ${cellStyle} ${
                    isCurr ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                  }`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                      aria-label="Flagged"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions in Control Deck */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Keyboard Shortcuts</span>
              <span className="font-mono text-slate-700">A–D · ←/→</span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Submit & View Detailed Explanations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
