"use client";

import { Quiz } from "./Quiz";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [hasAnswers, setHasAnswers] = useState(false);
  const answersRef = useRef<Record<string, string>>({});
  const quizSubmittedRef = useRef(false);
  const submitQuizRef = useRef<(() => void) | null>(null);
  
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

  useEffect(() => {
    // Make window fullscreen on load
    if (typeof window !== "undefined" && window.self !== window.top) {
      // We're in a popup, request fullscreen
      document.documentElement.requestFullscreen?.().catch(() => {
        // Fallback: maximize window if fullscreen fails
        try {
          window.moveTo(0, 0);
          window.resizeTo(screen.width, screen.height);
        } catch (e) {
          // Ignore errors if browser blocks window manipulation
        }
      });
    }

    // Prevent navigation away from the quiz window
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!quizSubmittedRef.current && hasAnswers) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Prevent browser back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current && hasAnswers) {
        cheatingCountersRef.current.backButtonCount++;
        handleExitQuiz();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Push state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    // Prevent common cheating methods and track attempts
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current) {
        cheatingCountersRef.current.rightClickCount++;
      }
    };
    
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current) {
        cheatingCountersRef.current.copyAttemptCount++;
      }
    };
    
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current) {
        cheatingCountersRef.current.pasteAttemptCount++;
      }
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Alt+Tab
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U") ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        if (!quizSubmittedRef.current) {
          cheatingCountersRef.current.devToolsAttemptCount++;
        }
        return false;
      }
      
      // Handle backspace to prevent navigation
      if (e.key === "Backspace" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (!quizSubmittedRef.current && hasAnswers) {
          cheatingCountersRef.current.backButtonCount++;
          handleExitQuiz();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Monitor visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden && !quizSubmittedRef.current && hasAnswers) {
        // User switched tabs/windows
        cheatingCountersRef.current.visibilityChangeCount++;
        cheatingCountersRef.current.tabSwitchCount++;
        handleExitQuiz();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Monitor window blur (lost focus)
    const handleBlur = () => {
      if (!quizSubmittedRef.current && hasAnswers) {
        cheatingCountersRef.current.windowBlurCount++;
        handleExitQuiz();
      }
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [hasAnswers, handleExitQuiz]);

  const handleQuizComplete = () => {
    quizSubmittedRef.current = true;
    // Send message to parent window and close after delay
    setTimeout(() => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "quizCompleted" }, "*");
      }
      window.close();
    }, 3000); // Give user time to see results
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
          />
        </div>
      </div>
    </div>
  );
}
