"use client";

import { Quiz } from "./Quiz";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Lock, Maximize, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Fullscreen isn't available everywhere (e.g. iPhone Safari, some in-app browsers).
  // In that case the student may continue without it; all other monitoring stays active.
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const fallbackModeRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startWithoutFullscreen = useCallback(() => {
    fallbackModeRef.current = true;
    quizStartedRef.current = true;
    setFallbackMode(true);
    setHasStarted(true);
  }, []);

  const requestExamFullscreen = useCallback(() => {
    const request = document.documentElement.requestFullscreen?.bind(document.documentElement);
    if (!request) {
      setFullscreenSupported(false);
      return;
    }
    request().catch(() => {
      setFullscreenFailed(true);
      toast.error("Fullscreen isn't available in this browser. You can continue without it.");
    });
  }, []);

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
    if (quizSubmittedRef.current || isExitingRef.current) return;
    violationLogRef.current.push({
      type,
      at: new Date().toISOString(),
    });
  }, []);

  const handleExitQuiz = useCallback(() => {
    if (isExitingRef.current || quizSubmittedRef.current) return;

    isExitingRef.current = true;
    setIsExiting(true);
    // Auto-submit current answers (even if empty) if we have the submit function
    if (submitQuizRef.current) {
      // Trigger auto-submission
      submitQuizRef.current();
    } else {
      // No submit function, just close
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "quizCancelled" }, window.location.origin);
      }
      window.close();
    }
  }, []);

  const handleViolation = useCallback((type: string) => {
    if (quizSubmittedRef.current || !quizStartedRef.current || isExitingRef.current) return;

    const currentWarnings = warningsRef.current + 1;
    warningsRef.current = currentWarnings;

    if (currentWarnings >= MAX_WARNINGS) {
      toast.error("Maximum warnings exceeded. Quiz auto-submitted.");
      handleExitQuiz();
    } else {
      toast.warning(`Warning ${currentWarnings} of ${MAX_WARNINGS}: ${type} detected. Stay on the quiz screen.`);
    }
  }, [handleExitQuiz]);

  interface SecureDOM {
    addEventListener: (
      type: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- listeners for many event types go through the sandboxed EventTarget methods
      callback: any,
      options?: boolean | AddEventListenerOptions
    ) => void;
    removeEventListener: (
      type: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- listeners for many event types go through the sandboxed EventTarget methods
      callback: any,
      options?: boolean | EventListenerOptions
    ) => void;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see SecureDOM
      let addEventListener = EventTarget.prototype.addEventListener as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see SecureDOM
      let removeEventListener = EventTarget.prototype.removeEventListener as any;
      let hiddenGetter = () => document.hidden;
      let visibilityStateGetter = () => document.visibilityState;
      let hasFocusGetter = () => document.hasFocus();
      let fullscreenElementGetter = () => document.fullscreenElement;

      try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        if (iframe.contentWindow) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const contentWin = iframe.contentWindow as any;
          const cleanEventTargetProto = contentWin.EventTarget.prototype;
          const cleanDocumentProto = contentWin.Document.prototype;

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
      } catch {
        // Secure DOM extraction failed: fall back to the standard DOM APIs.
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
        setFullscreenSupported(
          typeof document.documentElement.requestFullscreen === "function" &&
            document.fullscreenEnabled !== false
        );
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
        setHasStarted(true);
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
      // No overlay exists when the student continues without fullscreen.
      if (fallbackModeRef.current) return;
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

    const opener = window.opener && !window.opener.closed ? (window.opener as Window) : null;
    if (opener) {
      // Opened as an exam window: notify the lesson page and close shortly after the result shows.
      closeTimerRef.current = setTimeout(() => {
        opener.postMessage({ type: "quizCompleted" }, window.location.origin);
        window.close();
      }, 3000);
    } else if (document.fullscreenElement) {
      // Opened in the same tab (popup blocked): stay on the results and leave fullscreen.
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // "Retake quiz" in the same tab starts a fresh, fully monitored attempt.
  const handleRetake = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    quizSubmittedRef.current = false;
    isExitingRef.current = false;
    warningsRef.current = 0;
    setIsExiting(false);
    setIsSubmitted(false);
  };

  const handleAnswerChange = (_hasAnswers: boolean, answers: Record<string, string>) => {
    answersRef.current = answers;
  };

  const leaveBeforeStart = () => {
    if (quizStartedRef.current) return;
    const opener = window.opener && !window.opener.closed ? (window.opener as Window) : null;
    if (opener) {
      opener.postMessage({ type: "quizCancelled" }, window.location.origin);
      window.close();
    } else {
      // Opened in the same tab (pop-up blocked): go back to the lesson.
      window.location.assign(`/dashboard/${quizData.courseSlug}/${lessonId}`);
    }
  };

  const showOverlay = !isFullscreen && !isExiting && !isSubmitted && !fallbackMode;
  const canUseFullscreen = fullscreenSupported && !fullscreenFailed;

  return (
    // z-40: above the dashboard chrome (sidebar is z-10), below dialogs and toasts (z-50+).
    <div className="fixed inset-0 z-40 overflow-auto overscroll-contain bg-background">
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
      {showOverlay && (
        <div
          id="secure-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="secure-overlay-title"
          aria-describedby="secure-overlay-description"
          className="fixed inset-0 z-[9999] flex flex-col items-center overflow-y-auto bg-background/95 p-4 sm:p-6"
        >
          <div className="my-auto w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 text-center shadow-lg sm:p-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="size-7" aria-hidden="true" />
            </div>
            <h2 id="secure-overlay-title" className="text-xl font-bold tracking-tight sm:text-2xl">
              {hasStarted ? "Return to exam mode" : "Secure exam mode"}
            </h2>
            <div id="secure-overlay-description" className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                This quiz is monitored. Switching tabs or apps, leaving fullscreen, copying or pasting are
                recorded, and after {MAX_WARNINGS} warnings the quiz is submitted automatically.
              </p>
              {!canUseFullscreen && (
                <p className="font-medium text-foreground">
                  Fullscreen isn&apos;t available in this browser, so you can take the quiz without it. Stay on
                  this screen until you submit.
                </p>
              )}
            </div>
            {canUseFullscreen ? (
              <Button size="lg" className="w-full" onClick={requestExamFullscreen}>
                <Maximize aria-hidden="true" />
                {hasStarted ? "Return to fullscreen" : "Enter fullscreen and start"}
              </Button>
            ) : (
              <Button size="lg" className="w-full" onClick={startWithoutFullscreen}>
                <Play aria-hidden="true" />
                Start quiz
              </Button>
            )}
            {!hasStarted && (
              // Leaving before the attempt starts records nothing.
              <Button size="lg" variant="ghost" className="w-full" onClick={leaveBeforeStart}>
                Not now
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="min-h-dvh px-4">
        <div className="mx-auto max-w-4xl">
          <Quiz
            quiz={quizData.quiz}
            lessonId={lessonId}
            courseSlug={quizData.courseSlug}
            onComplete={handleQuizComplete}
            onRetake={handleRetake}
            onAnswerChange={handleAnswerChange}
            onSubmitRef={(submitFn) => {
              submitQuizRef.current = submitFn;
            }}
            cheatingCountersRef={cheatingCountersRef}
            violationLogRef={violationLogRef}
            isExiting={isExiting}
          />
        </div>
      </div>
    </div>
  );
}
