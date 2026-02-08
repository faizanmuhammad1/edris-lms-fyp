"use client";

import { Quiz } from "./Quiz";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface QuizWindowProps {
  quizData: {
    quiz: {
      id: string;
      title: string;
      description: string | null;
      timeLimit: number | null;
      passingScore: number;
      questions: Array<{
        id: string;
        question: string;
        position: number;
        points: number;
        options: Array<{
          id: string;
          text: string;
          isCorrect: boolean;
          position: number;
        }>;
      }>;
    };
    courseSlug: string;
  };
  lessonId: string;
}

export function QuizWindow({ quizData, lessonId }: QuizWindowProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [hasAnswers, setHasAnswers] = useState(false);
  const answersRef = useRef<Record<string, string>>({});
  const quizSubmittedRef = useRef(false);
  const submitQuizRef = useRef<(() => void) | null>(null);

  // Warning System
  const warningsRef = useRef(0);
  const MAX_WARNINGS = 3;

  // Cheating tracking counters
  const cheatingCountersRef = useRef({
    tabSwitchCount: 0,
    backButtonCount: 0,
    windowBlurCount: 0,
    visibilityChangeCount: 0,
    copyAttemptCount: 0,
    pasteAttemptCount: 0,
    rightClickCount: 0,
    devToolsAttemptCount: 0,
  });

  const violationLogRef = useRef<{ type: string; at: string }[]>([]);
  const addViolation = useCallback((type: string) => {
    if (quizSubmittedRef.current) return;
    violationLogRef.current.push({
      type,
      at: new Date().toISOString(),
    });
  }, []);

  const handleExitQuiz = useCallback(() => {
    if (isExiting || quizSubmittedRef.current) return;

    setIsExiting(true);
    // Auto-submit current answers if any
    if (Object.keys(answersRef.current).length > 0 && submitQuizRef.current) {
      // Trigger auto-submission
      submitQuizRef.current();
    } else {
      // No answers or no submit function, just close
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "quizCancelled" }, "*");
      }
      window.close();
    }
  }, [isExiting]);

  const handleViolation = useCallback((type: string) => {
    if (quizSubmittedRef.current || !hasAnswers) return;

    const currentWarnings = warningsRef.current + 1;
    warningsRef.current = currentWarnings;

    if (currentWarnings >= MAX_WARNINGS) {
      toast.error("Maximum warnings exceeded. Quiz auto-submitted.");
      handleExitQuiz();
    } else {
      toast.warning(`Warning ${currentWarnings}/${MAX_WARNINGS}: ${type} detected. maintain focus!`);
    }
  }, [hasAnswers, handleExitQuiz]);


  useEffect(() => {
    // Make window fullscreen on load
    if (typeof window !== "undefined" && window.self !== window.top) {
      document.documentElement.requestFullscreen?.().catch(() => {
        try {
          window.moveTo(0, 0);
          window.resizeTo(screen.width, screen.height);
        } catch { }
      });
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!quizSubmittedRef.current && hasAnswers) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current && hasAnswers) {
        cheatingCountersRef.current.backButtonCount++;
        addViolation("back_navigation");
        handleViolation("Back Navigation");
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current) {
        cheatingCountersRef.current.rightClickCount++;
        addViolation("right_click");
        toast.warning("Right-click is disabled during the quiz.");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current) {
        cheatingCountersRef.current.copyAttemptCount++;
        addViolation("copy");
        toast.warning("Copying is disabled.");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current) {
        cheatingCountersRef.current.pasteAttemptCount++;
        addViolation("paste");
        toast.warning("Pasting is disabled.");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevToolsShortcut =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.metaKey && e.altKey && e.key === "I") ||
        (e.ctrlKey && e.key === "U") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.metaKey && e.shiftKey && e.key === "C") ||
        (e.altKey && e.key === "Tab");
      if (isDevToolsShortcut) {
        e.preventDefault();
        if (!quizSubmittedRef.current) {
          cheatingCountersRef.current.devToolsAttemptCount++;
          addViolation("devtools");
          handleViolation("Restricted Key");
        }
        return false;
      }

      if (e.key === "Backspace" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (!quizSubmittedRef.current && hasAnswers) {
          cheatingCountersRef.current.backButtonCount++;
          addViolation("back_navigation");
          handleViolation("Back Navigation");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const handleVisibilityChange = () => {
      if (document.hidden && !quizSubmittedRef.current && hasAnswers) {
        cheatingCountersRef.current.visibilityChangeCount++;
        cheatingCountersRef.current.tabSwitchCount++;
        addViolation("tab_switch");
        handleViolation("Tab Switching");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleBlur = () => {
      if (!quizSubmittedRef.current && hasAnswers) {
        cheatingCountersRef.current.windowBlurCount++;
        addViolation("window_blur");
        handleViolation("Window Focus Loss");
      }
    };

    window.addEventListener("blur", handleBlur);

    const handleFullscreenChange = () => {
      if (
        !document.fullscreenElement &&
        !quizSubmittedRef.current &&
        hasAnswers
      ) {
        cheatingCountersRef.current.windowBlurCount++;
        addViolation("fullscreen_exit");
        handleViolation("Fullscreen Exit");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [hasAnswers, handleViolation, addViolation]);

  const handleQuizComplete = () => {
    quizSubmittedRef.current = true;
    setTimeout(() => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "quizCompleted" }, "*");
      }
      window.close();
    }, 3000);
  };

  const handleAnswerChange = (hasAnswers: boolean, answers: Record<string, string>) => {
    setHasAnswers(hasAnswers);
    answersRef.current = answers;
  };

  return (
    <div className="fixed inset-0 bg-background overflow-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <Quiz
            quiz={quizData.quiz}
            lessonId={lessonId}
            courseSlug={quizData.courseSlug}
            onComplete={handleQuizComplete}
            onAnswerChange={handleAnswerChange}
            onSubmitRef={(submitFn) => {
              submitQuizRef.current = submitFn;
            }}
            cheatingCountersRef={cheatingCountersRef}
            violationLogRef={violationLogRef}
          />
        </div>
      </div>
    </div>
  );
}
