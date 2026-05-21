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
  const isExitingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const answersRef = useRef<Record<string, string>>({});
  const quizSubmittedRef = useRef(false);
  const submitQuizRef = useRef<(() => void) | null>(null);

  // Track if the quiz was started (entered fullscreen mode at least once)
  const quizStartedRef = useRef(false);

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
    if (isExitingRef.current || quizSubmittedRef.current) return;

    isExitingRef.current = true;
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
  }, []);

  const handleViolation = useCallback((type: string) => {
    if (quizSubmittedRef.current || !quizStartedRef.current) return;

    const currentWarnings = warningsRef.current + 1;
    warningsRef.current = currentWarnings;

    if (currentWarnings >= MAX_WARNINGS) {
      toast.error("Maximum warnings exceeded. Quiz auto-submitted.");
      handleExitQuiz();
    } else {
      toast.warning(`Warning ${currentWarnings}/${MAX_WARNINGS}: ${type} detected. maintain focus!`);
    }
  }, [handleExitQuiz]);

  interface SecureDOM {
    addEventListener: typeof EventTarget.prototype.addEventListener;
    removeEventListener: typeof EventTarget.prototype.removeEventListener;
    hiddenGetter: () => boolean;
    visibilityStateGetter: () => DocumentVisibilityState;
    hasFocusGetter: () => boolean;
    fullscreenElementGetter: () => Element | null;
  }

  const secureDOMRef = useRef<SecureDOM | null>(null);
  const wasScreenshotAttemptedRef = useRef(false);

  useEffect(() => {
    // 1. Initialize secureDOM from clean iframe sandbox to prevent script/extension overrides
    if (!secureDOMRef.current) {
      let addEventListener = EventTarget.prototype.addEventListener;
      let removeEventListener = EventTarget.prototype.removeEventListener;
      let hiddenGetter = () => document.hidden;
      let visibilityStateGetter = () => document.visibilityState;
      let hasFocusGetter = () => document.hasFocus();
      let fullscreenElementGetter = () => document.fullscreenElement;

      try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        if (iframe.contentWindow) {
          const cleanEventTargetProto = iframe.contentWindow.EventTarget.prototype;
          const cleanDocumentProto = iframe.contentWindow.Document.prototype;

          addEventListener = cleanEventTargetProto.addEventListener;
          removeEventListener = cleanEventTargetProto.removeEventListener;

          const hiddenDesc = Object.getOwnPropertyDescriptor(cleanDocumentProto, "hidden");
          const visDesc = Object.getOwnPropertyDescriptor(cleanDocumentProto, "visibilityState");
          const hasFocusDesc = Object.getOwnPropertyDescriptor(cleanDocumentProto, "hasFocus");
          const fsDesc = Object.getOwnPropertyDescriptor(cleanDocumentProto, "fullscreenElement");

          if (hiddenDesc?.get) {
            const get = hiddenDesc.get;
            hiddenGetter = () => get.call(document);
          }
          if (visDesc?.get) {
            const get = visDesc.get;
            visibilityStateGetter = () => get.call(document);
          }
          if (hasFocusDesc?.value) {
            const val = hasFocusDesc.value;
            hasFocusGetter = () => val.call(document);
          }
          if (fsDesc?.get) {
            const get = fsDesc.get;
            fullscreenElementGetter = () => get.call(document);
          }
        }
        document.body.removeChild(iframe);
      } catch (err) {
        console.warn("Secure DOM extraction failed, falling back to standard DOM", err);
      }

      secureDOMRef.current = {
        addEventListener,
        removeEventListener,
        hiddenGetter,
        visibilityStateGetter,
        hasFocusGetter,
        fullscreenElementGetter,
      };
    }
    const secureDOM = secureDOMRef.current;

    // Make window fullscreen on load
    if (typeof window !== "undefined") {
      setTimeout(() => {
        setIsFullscreen(!!secureDOM.fullscreenElementGetter());
      }, 0);
    }
    if (typeof window !== "undefined" && window.self !== window.top) {
      document.documentElement.requestFullscreen?.().catch(() => {
        try {
          window.moveTo(0, 0);
          window.resizeTo(screen.width, screen.height);
        } catch { }
      });
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!quizSubmittedRef.current && quizStartedRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (!quizSubmittedRef.current && quizStartedRef.current) {
        cheatingCountersRef.current.backButtonCount++;
        addViolation("back_navigation");
        handleViolation("Back Navigation");
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);

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

    const flushClipboard = () => {
      try {
        navigator.clipboard.writeText("Screenshots are disabled during the quiz.");
      } catch {
        // Ignore write failure if clipboard permission not granted
      }
    };

    const triggerScreenshotViolation = () => {
      if (!quizSubmittedRef.current) {
        addViolation("printscreen");
        handleViolation("Screenshot Attempt");
        wasScreenshotAttemptedRef.current = true;
        flushClipboard();
      }
    };

    const triggerPrintViolation = () => {
      if (!quizSubmittedRef.current) {
        addViolation("print");
        handleViolation("Print Attempt");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. DevTools and restricted keys
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

      // 2. Screenshot shortcuts and keys
      const isPrintScreenKey = e.key === "PrintScreen" || e.key === "Snapshot" || e.code === "PrintScreen";
      const isMacScreenshot = e.metaKey && e.shiftKey && ["3", "4", "5", "Digit3", "Digit4", "Digit5"].includes(e.key || e.code);
      const isWinSnipping = e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S" || e.code === "KeyS");

      if (isPrintScreenKey || isMacScreenshot || isWinSnipping) {
        e.preventDefault();
        triggerScreenshotViolation();
        return false;
      }

      // 3. Print shortcuts (Ctrl+P / Cmd+P)
      const isPrintShortcut = (e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.code === "KeyP");
      if (isPrintShortcut) {
        e.preventDefault();
        triggerPrintViolation();
        return false;
      }

      // 4. Reload shortcuts (F5, Ctrl+R, Cmd+R)
      const isReloadShortcut =
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R" || e.code === "KeyR"));
      if (isReloadShortcut) {
        e.preventDefault();
        toast.warning("Reloading is disabled during the quiz.");
        return false;
      }

      // 5. Search shortcuts (Ctrl+F, Cmd+F)
      const isSearchShortcut =
        (e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F" || e.code === "KeyF");
      if (isSearchShortcut) {
        e.preventDefault();
        toast.warning("Searching on the page is disabled.");
        return false;
      }

      // 6. Save shortcuts (Ctrl+S, Cmd+S)
      const isSaveShortcut =
        (e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "s" || e.key === "S" || e.code === "KeyS");
      if (isSaveShortcut) {
        e.preventDefault();
        toast.warning("Saving the page is disabled.");
        return false;
      }

      // 7. Toggle browser fullscreen shortcut (F11)
      if (e.key === "F11") {
        e.preventDefault();
        return false;
      }

      // 8. Navigation shortcuts (Alt + ArrowLeft/Right)
      const isNavigationShortcut =
        e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.code === "ArrowLeft" || e.code === "ArrowRight");
      if (isNavigationShortcut) {
        e.preventDefault();
        return false;
      }

      if (e.key === "Backspace" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (!quizSubmittedRef.current && quizStartedRef.current) {
          cheatingCountersRef.current.backButtonCount++;
          addViolation("back_navigation");
          handleViolation("Back Navigation");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isPrintScreenKey = e.key === "PrintScreen" || e.key === "Snapshot" || e.code === "PrintScreen";
      if (isPrintScreenKey) {
        e.preventDefault();
        triggerScreenshotViolation();
      }
    };

    const handleBeforePrint = () => {
      triggerPrintViolation();
    };

    const handleVisibilityChange = () => {
      const isHidden = secureDOM.hiddenGetter();
      if (isHidden && !quizSubmittedRef.current && quizStartedRef.current) {
        cheatingCountersRef.current.visibilityChangeCount++;
        cheatingCountersRef.current.tabSwitchCount++;
        addViolation("tab_switch");
        handleViolation("Tab Switching");
      }
    };

    const handleBlur = () => {
      const hasFocus = secureDOM.hasFocusGetter();
      if (!hasFocus && !quizSubmittedRef.current && quizStartedRef.current) {
        cheatingCountersRef.current.windowBlurCount++;
        addViolation("window_blur");
        handleViolation("Window Focus Loss");
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!secureDOM.fullscreenElementGetter();
      setIsFullscreen(isCurrentlyFullscreen);

      if (isCurrentlyFullscreen && !quizStartedRef.current) {
        quizStartedRef.current = true;
      }

      if (
        !isCurrentlyFullscreen &&
        !quizSubmittedRef.current &&
        quizStartedRef.current
      ) {
        cheatingCountersRef.current.windowBlurCount++;
        addViolation("fullscreen_exit");
        handleViolation("Fullscreen Exit");
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => e.preventDefault();

    // Clipboard focus flusher helper
    const handleFocus = () => {
      if (wasScreenshotAttemptedRef.current) {
        flushClipboard();
        wasScreenshotAttemptedRef.current = false;
      }
    };

    // Docked DevTools check
    const auditDimensions = () => {
      if (quizSubmittedRef.current || !quizStartedRef.current) return;
      const isCurrentlyFullscreen = !!secureDOM.fullscreenElementGetter();
      if (isCurrentlyFullscreen) {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > 160 || heightDiff > 160) {
          cheatingCountersRef.current.devToolsAttemptCount++;
          addViolation("devtools");
          handleViolation("Docked DevTools Detected");
        }
      }
    };

    // Undocked DevTools check
    const runDebuggerCheck = () => {
      if (quizSubmittedRef.current || !quizStartedRef.current) return;
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        cheatingCountersRef.current.devToolsAttemptCount++;
        addViolation("devtools");
        handleViolation("Developer Tools Detected");
      }
    };

    // Bind all secure listeners via iframe native addEventListener
    secureDOM.addEventListener.call(window, "beforeunload", handleBeforeUnload);
    secureDOM.addEventListener.call(window, "popstate", handlePopState);
    secureDOM.addEventListener.call(document, "contextmenu", handleContextMenu);
    secureDOM.addEventListener.call(document, "copy", handleCopy);
    secureDOM.addEventListener.call(document, "paste", handlePaste);
    secureDOM.addEventListener.call(document, "keydown", handleKeyDown);
    secureDOM.addEventListener.call(document, "keyup", handleKeyUp);
    secureDOM.addEventListener.call(window, "beforeprint", handleBeforePrint);
    secureDOM.addEventListener.call(document, "visibilitychange", handleVisibilityChange);
    secureDOM.addEventListener.call(window, "blur", handleBlur);
    secureDOM.addEventListener.call(document, "fullscreenchange", handleFullscreenChange);
    secureDOM.addEventListener.call(document, "dragstart", handleDragStart);
    secureDOM.addEventListener.call(document, "dragover", handleDragOver);
    secureDOM.addEventListener.call(document, "drop", handleDrop);
    secureDOM.addEventListener.call(window, "resize", auditDimensions);
    secureDOM.addEventListener.call(window, "focus", handleFocus);

    // Setup active observers and intervals
    const debuggerInterval = setInterval(runDebuggerCheck, 1500);
    const dimensionsInterval = setInterval(auditDimensions, 2000);

    const mutationObserver = new MutationObserver(() => {
      if (quizSubmittedRef.current || !quizStartedRef.current) return;
      const isCurrentlyFullscreen = !!secureDOM.fullscreenElementGetter();
      if (!isCurrentlyFullscreen && !isExitingRef.current && !quizSubmittedRef.current) {
        const overlay = document.getElementById("secure-overlay");
        let isTampered = false;

        if (!overlay) {
          isTampered = true;
        } else {
          const style = window.getComputedStyle(overlay);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            parseFloat(style.opacity) === 0 ||
            parseInt(style.zIndex || "0") < 9999
          ) {
            isTampered = true;
          }
        }

        if (isTampered) {
          cheatingCountersRef.current.devToolsAttemptCount++;
          addViolation("devtools");
          toast.error("Security overlay tampering detected! Auto-submitting quiz...");
          handleExitQuiz();
        }
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden", "id"],
    });

    return () => {
      secureDOM.removeEventListener.call(window, "beforeunload", handleBeforeUnload);
      secureDOM.removeEventListener.call(window, "popstate", handlePopState);
      secureDOM.removeEventListener.call(document, "contextmenu", handleContextMenu);
      secureDOM.removeEventListener.call(document, "copy", handleCopy);
      secureDOM.removeEventListener.call(document, "paste", handlePaste);
      secureDOM.removeEventListener.call(document, "keydown", handleKeyDown);
      secureDOM.removeEventListener.call(document, "keyup", handleKeyUp);
      secureDOM.removeEventListener.call(window, "beforeprint", handleBeforePrint);
      secureDOM.removeEventListener.call(document, "visibilitychange", handleVisibilityChange);
      secureDOM.removeEventListener.call(window, "blur", handleBlur);
      secureDOM.removeEventListener.call(document, "fullscreenchange", handleFullscreenChange);
      secureDOM.removeEventListener.call(document, "dragstart", handleDragStart);
      secureDOM.removeEventListener.call(document, "dragover", handleDragOver);
      secureDOM.removeEventListener.call(document, "drop", handleDrop);
      secureDOM.removeEventListener.call(window, "resize", auditDimensions);
      secureDOM.removeEventListener.call(window, "focus", handleFocus);

      clearInterval(debuggerInterval);
      clearInterval(dimensionsInterval);
      mutationObserver.disconnect();
    };
  }, [handleViolation, addViolation, handleExitQuiz]);

  const handleQuizComplete = () => {
    quizSubmittedRef.current = true;
    setIsSubmitted(true);
    setTimeout(() => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "quizCompleted" }, "*");
      }
      window.close();
    }, 3000);
  };

  const handleAnswerChange = (_hasAnswers: boolean, answers: Record<string, string>) => {
    answersRef.current = answers;
  };

  return (
    <div className="fixed inset-0 bg-background overflow-auto">
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
          }
          @media print {
            html, body {
              display: none !important;
              visibility: hidden !important;
            }
          }
        `
      }} />
      {!isFullscreen && !isExiting && !isSubmitted && (
        <div id="secure-overlay" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/85 backdrop-blur-md p-6 transition-all duration-300 animate-in fade-in">
          <div className="max-w-md w-full bg-card border border-border shadow-2xl rounded-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Secure Exam Mode Required</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This quiz is protected by cheating prevention mechanisms. To start or resume the quiz, you must view it in secure fullscreen mode.
            </p>
            <button
              onClick={() => {
                document.documentElement.requestFullscreen?.().catch((err) => {
                  toast.error("Failed to enter fullscreen mode. Please check browser permissions.");
                  console.error(err);
                });
              }}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              Enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}
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
