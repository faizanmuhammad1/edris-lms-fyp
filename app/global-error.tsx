"use client";

import { useEffect } from "react";

/**
 * Replaces the root layout when it fails, so it renders its own <html>/<body> and cannot
 * rely on globals.css, fonts or theme providers: styles are inline and theme-aware.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html lang="en">
            <head>
                <title>Something went wrong | Edris LMS</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="noindex" />
                <style>{`
                    :root { color-scheme: light dark; }
                    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
                        background: #f6f8f7; color: #111814; }
                    .ge-muted { color: #5b6660; }
                    .ge-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px;
                        padding: 0 20px; border-radius: 8px; font: inherit; font-weight: 500; font-size: 15px;
                        cursor: pointer; text-decoration: none; border: 1px solid transparent; }
                    .ge-primary { background: #436651; color: #fff; }
                    .ge-primary:hover { background: #4f745c; }
                    .ge-outline { background: transparent; color: inherit; border-color: #cfd8d2; }
                    .ge-btn:focus-visible { outline: 3px solid rgba(93,134,108,.5); outline-offset: 2px; }
                    @media (prefers-color-scheme: dark) {
                        body { background: #0f1311; color: #eef1ef; }
                        .ge-muted { color: #9aa59f; }
                        .ge-outline { border-color: #2c3630; }
                    }
                `}</style>
            </head>
            <body>
                <main
                    style={{
                        minHeight: "100svh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "48px 16px",
                        boxSizing: "border-box",
                    }}
                >
                    <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
                        <p className="ge-muted" style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: ".02em" }}>
                            Edris LMS
                        </p>
                        <h1 style={{ margin: "12px 0 0", fontSize: 30, lineHeight: 1.2, fontWeight: 600 }}>
                            Something went wrong
                        </h1>
                        <p className="ge-muted" style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6 }}>
                            The app hit an unexpected error. Please try again, or reload the page.
                        </p>
                        {error.digest && (
                            <p className="ge-muted" style={{ margin: "12px 0 0", fontSize: 12, fontFamily: "ui-monospace, monospace" }}>
                                Error ID: {error.digest}
                            </p>
                        )}
                        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                            <button type="button" onClick={reset} className="ge-btn ge-primary">
                                Try again
                            </button>
                            {/* Full page load on purpose: the client router may be in a broken state. */}
                            <a href="/" className="ge-btn ge-outline">
                                Go to homepage
                            </a>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    );
}
