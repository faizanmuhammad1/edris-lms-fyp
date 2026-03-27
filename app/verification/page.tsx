"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  verifyCertificate,
  VerificationResult,
} from "@/app/actions/verify-certificate";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Hash,
  User,
  BookOpen,
  Calendar,
  Layers,
  Network,
  AlertCircle,
  Info,
  Link2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Cinzel, Montserrat, EB_Garamond } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

const BRAND = "#4a6d56";
const BRAND_LIGHT = "#5d866c";
const BRAND_DARK = "#0a140f";
const TEXT_SUBTLE = "#3a4d42";

/* ── Step number badge (in-flow so parent overflow never clips it) ─── */
function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="size-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{
        fontFamily: "var(--font-montserrat), system-ui",
        background: BRAND,
        boxShadow: "0 0 0 2px #ffffff, 0 2px 8px rgba(74,109,86,0.22)",
      }}
      aria-hidden
    >
      {n}
    </div>
  );
}

/* ── Skeleton rows used in the idle Step 2 card ─────────────────────── */
function SkeletonRow({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? "col-span-2" : ""}`}>
      <span
        className="text-[9px] font-bold tracking-[0.12em] uppercase"
        style={{ fontFamily: "var(--font-montserrat), system-ui", color: `${TEXT_SUBTLE}70` }}
      >
        {label}
      </span>
      <div
        className={`h-2.5 rounded-full animate-pulse ${wide ? "w-3/4" : "w-2/3"}`}
        style={{ background: `${BRAND_LIGHT}18` }}
      />
    </div>
  );
}

/* ── Inner ornate double-border wrapper for Step 2 content ──────────── */
function InnerFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 flex flex-col">
      {/* Double inset border */}
      <div
        className="absolute inset-2 pointer-events-none"
        style={{ border: `1px solid ${BRAND}30` }}
      />
      <div
        className="absolute inset-3.5 pointer-events-none"
        style={{ border: `1px solid ${BRAND_LIGHT}20` }}
      />
      {/* Corner L-shapes */}
      {[
        "top-2 left-2",
        "top-2 right-2 -scale-x-100",
        "bottom-2 left-2 -scale-y-100",
        "bottom-2 right-2 scale-[-1]",
      ].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-4 h-4 pointer-events-none z-10`}>
          <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: BRAND }} />
          <div className="absolute top-0 left-0 h-full w-[1px]" style={{ background: BRAND }} />
        </div>
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f6f4]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_LIGHT }} />
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}

function VerificationContent() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const cid = searchParams.get("cid");
  const qr = searchParams.get("qr");

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
  };

  useEffect(() => {
    if (!cid && !qr) return;
    if (cid) setHash(cid);
    setIsLoading(true);
    setResult(null);

    const qrData = qr
      ? (() => {
          try {
            return decodeURIComponent(qr);
          } catch {
            return qr;
          }
        })()
      : null;

    verifyCertificate(
      qrData
        ? { mode: "qr", qrData }
        : { mode: "id", uniqueId: cid ?? "" }
    )
      .then((r) => { setResult(r); scrollToResults(); })
      .catch(() => setResult({ isValid: false, error: "Verification failed. Please try again." }))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, qr]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const r = await verifyCertificate({
        mode: "id",
        uniqueId: hash.trim(),
      });
      setResult(r as VerificationResult);
      scrollToResults();
    } catch {
      setResult({ isValid: false, error: "Verification failed. Please try again." });
      scrollToResults();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-dvh flex flex-col items-center relative overflow-x-hidden ${cinzel.variable} ${montserrat.variable} ${garamond.variable}`}
      style={{ background: "#f0f3f0" }}
    >
      {/* Full-page faint watermark */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.022] z-0">
        <Image
          src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
          alt=""
          width={800}
          height={800}
          className="object-contain"
          aria-hidden="true"
        />
      </div>

      {/* ── Outer shell ─────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-5xl mx-4 md:mx-auto my-3 md:my-5 bg-white flex flex-col rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.09)" }}
      >
        {/* Outer double border */}
        <div className="absolute inset-[8px] pointer-events-none z-20" style={{ border: `1.5px solid ${BRAND}` }} />
        <div className="absolute inset-[14px] pointer-events-none z-20" style={{ border: `1px solid ${BRAND_LIGHT}60` }} />

        {/* Outer corner accents */}
        {[
          "top-[8px] left-[8px]",
          "top-[8px] right-[8px] scale-x-[-1]",
          "bottom-[8px] left-[8px] scale-y-[-1]",
          "bottom-[8px] right-[8px] scale-[-1]",
        ].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-5 h-5 pointer-events-none z-30`}>
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: BRAND }} />
            <div className="absolute top-0 left-0 h-full w-[2px]" style={{ background: BRAND }} />
          </div>
        ))}

        {/* ── Header ───────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-10 md:px-14 py-4 z-10"
          style={{ borderBottom: `1px solid ${BRAND_LIGHT}20` }}
        >
          {/* Left: logo + brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="size-8 rounded-sm flex items-center justify-center shrink-0"
              style={{
                background: `${BRAND_LIGHT}10`,
                border: `1px solid ${BRAND_LIGHT}30`,
                boxShadow: `0 0 10px ${BRAND_LIGHT}20`,
              }}
            >
              <Image
                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                alt="Edris LMS"
                width={28}
                height={28}
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-[10px] font-bold tracking-[0.28em] uppercase"
                style={{ fontFamily: "var(--font-montserrat), system-ui", color: BRAND }}
              >
                EDRIS LMS
              </span>
              <span
                className="text-[8px] font-semibold tracking-[0.18em] uppercase mt-0.5"
                style={{ fontFamily: "var(--font-montserrat), system-ui", color: TEXT_SUBTLE }}
              >
                Certificate Authority
              </span>
            </div>
          </div>

          {/* Right: network pill with glow */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{
              border: `1px solid ${BRAND_LIGHT}45`,
              background: `${BRAND_LIGHT}09`,
              boxShadow: `0 0 14px ${BRAND_LIGHT}25`,
            }}
          >
            <Link2 className="size-3 shrink-0" style={{ color: BRAND_LIGHT }} />
            <span
              className="text-[8px] font-bold tracking-[0.18em] uppercase"
              style={{ fontFamily: "var(--font-montserrat), system-ui", color: BRAND }}
            >
              Polygon Amoy Network
            </span>
            <span className="relative flex size-1.5 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#22c55e" }} />
              <span className="relative inline-flex rounded-full size-1.5" style={{ background: "#22c55e" }} />
            </span>
          </div>
        </header>

        {/* ── Hero (compact for single-screen fit) ───────────────── */}
        <div className="px-6 md:px-12 pt-5 pb-3 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Shield with mint glow */}
            <div
              className="mb-2 size-12 flex items-center justify-center rounded-xl relative"
              style={{
                background: `${BRAND_LIGHT}12`,
                border: `1px solid ${BRAND_LIGHT}35`,
                boxShadow: `0 0 0 5px ${BRAND_LIGHT}10, 0 0 22px ${BRAND_LIGHT}28`,
              }}
            >
              <ShieldCheck className="size-6" style={{ color: BRAND_LIGHT }} />
            </div>

            {/* VERIFICATION — Cinzel, all caps */}
            <h1
              className="font-bold leading-none mb-1.5"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: BRAND_DARK,
                letterSpacing: "0.08em",
                fontSize: "clamp(1.65rem, 4.2vw, 2.65rem)",
              }}
            >
              VERIFICATION
            </h1>

            {/* Badge */}
            <div
              className="inline-block px-4 py-0.5 rounded-sm mb-2"
              style={{ background: BRAND }}
            >
              <span
                className="text-[8px] font-bold tracking-[0.32em] uppercase text-white"
                style={{ fontFamily: "var(--font-montserrat), system-ui" }}
              >
                Blockchain Powered
              </span>
            </div>

            {/* Diamond divider */}
            <div className="flex items-center gap-3 w-full max-w-[180px] mx-auto mb-2">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${BRAND_LIGHT}60)` }} />
              <div className="size-1.5 rotate-45 shrink-0" style={{ background: BRAND }} />
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${BRAND_LIGHT}60, transparent)` }} />
            </div>

            <p
              className="text-xs md:text-sm max-w-md mx-auto leading-snug italic"
              style={{ fontFamily: "var(--font-garamond), Georgia, serif", color: TEXT_SUBTLE }}
            >
              Instantly verify the authenticity of any EDRIS LMS certificate
              directly on the Polygon blockchain.
            </p>
          </motion.div>
        </div>

        {/* ── Two-step body: [Step1] → [arrow] → [Step2] ─────── */}
        <div className="px-4 md:px-8 pb-4 md:pb-5 z-10">
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">

            {/* ── STEP 1: Verify form ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="relative flex-1 rounded-2xl p-5 md:p-6 min-h-0"
              style={{
                background: "white",
                border: `1px solid ${BRAND_LIGHT}20`,
                boxShadow: `0 8px 32px rgba(74,109,86,0.08)`,
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <StepBadge n={1} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2
                    className="text-sm md:text-base font-semibold tracking-wide"
                    style={{ fontFamily: "var(--font-cinzel), serif", color: BRAND_DARK }}
                  >
                    Verify Certificate
                  </h2>
                  <p
                    className="text-[10px] md:text-[11px] mt-1 leading-relaxed"
                    style={{ fontFamily: "var(--font-montserrat), system-ui", color: TEXT_SUBTLE }}
                  >
                    Enter the certificate unique hash ID to verify authenticity.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                {/* Input with search + info icons */}
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none"
                    style={{ color: `${BRAND_LIGHT}80` }}
                  />
                  <Input
                    type="text"
                    placeholder="Enter Certificate Unique Hash ID"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    className="pl-9 pr-10 h-11 text-xs rounded-full border focus-visible:ring-1"
                    style={{
                      fontFamily: "var(--font-montserrat), system-ui",
                      background: "white",
                      color: BRAND_DARK,
                      borderColor: `${BRAND_LIGHT}40`,
                      // @ts-expect-error css var
                      "--tw-ring-color": BRAND_LIGHT,
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    title="Enter the unique certificate ID from your certificate (e.g. CERT-2025-XXXX or a UUID)"
                    aria-label="What is the certificate hash ID?"
                  >
                    <Info
                      className="size-3.5"
                      style={{ color: `${BRAND_LIGHT}70` }}
                    />
                  </button>
                </div>

                {/* Gradient button */}
                <button
                  type="submit"
                  disabled={isLoading || !hash.trim()}
                  className="w-full h-11 rounded-full text-[10px] font-bold uppercase tracking-[0.28em] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  style={{
                    fontFamily: "var(--font-montserrat), system-ui",
                    background: isLoading || !hash.trim()
                      ? `${BRAND_LIGHT}50`
                      : `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`,
                    boxShadow: isLoading || !hash.trim()
                      ? "none"
                      : `0 4px 14px ${BRAND}40`,
                  }}
                >
                  {isLoading ? (
                    <><Loader2 className="size-3.5 animate-spin" /> Verifying…</>
                  ) : (
                    <><ShieldCheck className="size-3.5" /> Verify Authenticity</>
                  )}
                </button>
              </form>

              {/* Live querying indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-medium"
                      style={{
                        fontFamily: "var(--font-montserrat), system-ui",
                        background: `${BRAND_LIGHT}08`,
                        border: `1px solid ${BRAND_LIGHT}20`,
                        color: BRAND,
                      }}
                    >
                      <span className="relative flex size-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: BRAND_LIGHT }} />
                        <span className="relative inline-flex rounded-full size-1.5" style={{ background: BRAND_LIGHT }} />
                      </span>
                      Querying Polygon Amoy Network…
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card footer decorative divider */}
              <div className="mt-4 flex items-center gap-2 opacity-30">
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${BRAND_LIGHT}, transparent)` }} />
                <div className="size-1 rotate-45 shrink-0" style={{ background: BRAND }} />
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${BRAND_LIGHT})` }} />
              </div>
            </motion.div>

            {/* ── Arrow connector (desktop only) ───────────────── */}
            <div className="hidden md:flex items-center justify-center px-3 shrink-0">
              <div className="flex items-center gap-1" style={{ color: `${BRAND_LIGHT}60` }}>
                <div className="w-6 h-px" style={{ background: `${BRAND_LIGHT}50` }} />
                <ArrowRight className="size-4" style={{ color: BRAND_LIGHT }} />
              </div>
            </div>

            {/* ── STEP 2: Results ──────────────────────────────── */}
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="relative flex-1 rounded-2xl flex flex-col min-h-0 overflow-hidden"
              style={{
                background: "white",
                border: `1px solid ${BRAND_LIGHT}20`,
                boxShadow: `0 8px 32px rgba(74,109,86,0.08)`,
              }}
            >
              <div className="flex items-start gap-3 px-5 pt-4 pb-2 shrink-0">
                <StepBadge n={2} />
              </div>

              <AnimatePresence mode="wait">
                {/* IDLE */}
                {!result && !isLoading && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col flex-1 min-h-0 px-5 pb-4"
                  >
                    <InnerFrame>
                      <div className="relative p-3 md:p-4">
                        {/* Faint shield watermark inside frame */}
                        <ShieldCheck
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-16 opacity-[0.06]"
                          style={{ color: BRAND }}
                        />

                        {/* Title */}
                        <div className="text-center mb-3 relative z-10">
                          <p
                            className="text-[11px] font-semibold"
                            style={{ fontFamily: "var(--font-cinzel), serif", color: `${TEXT_SUBTLE}80` }}
                          >
                            Verification results appear here
                          </p>
                          <p
                            className="text-[9px] mt-0.5 italic"
                            style={{ fontFamily: "var(--font-garamond), Georgia, serif", color: `${TEXT_SUBTLE}60` }}
                          >
                            Enter a certificate hash and click Verify
                          </p>
                        </div>

                        {/* Skeleton grid */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 relative z-10">
                          <SkeletonRow label="Student Name" />
                          <SkeletonRow label="Course Title" />
                          <SkeletonRow label="Date Issued" />
                          <SkeletonRow label="Network State" />
                          <SkeletonRow label="Block ID" />
                          <SkeletonRow label="Signature" />
                        </div>
                      </div>
                    </InnerFrame>
                  </motion.div>
                )}

                {/* LOADING */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center gap-3 py-8 px-5 flex-1"
                  >
                    <div
                      className="size-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${BRAND_LIGHT}10`,
                        border: `1px solid ${BRAND_LIGHT}25`,
                      }}
                    >
                      <Loader2 className="size-5 animate-spin" style={{ color: BRAND_LIGHT }} />
                    </div>
                    <p
                      className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                      style={{ fontFamily: "var(--font-montserrat), system-ui", color: BRAND }}
                    >
                      Verifying on blockchain…
                    </p>
                  </motion.div>
                )}

                {/* SUCCESS */}
                {result && result.isValid && (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-3 pb-3 flex-1 min-h-0"
                  >
                    <InnerFrame>
                      <ValidResult result={result} />
                    </InnerFrame>
                  </motion.div>
                )}

                {/* ERROR */}
                {result && !result.isValid && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-3 pb-3 flex-1 min-h-0"
                  >
                    <InnerFrame>
                      {result.error.toLowerCase().includes("tampered") && (
                        <div className="px-4 pt-3">
                          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                            Tamper alert: The scanned certificate data does not match the blockchain record.
                          </div>
                        </div>
                      )}
                      <InvalidResult result={result} />
                    </InnerFrame>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="px-6 md:px-10 z-10">
          {/* Top rule */}
          <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${BRAND_LIGHT}40, transparent)` }} />

          <div className="flex items-center justify-between py-2">
            {/* Left */}
            <span
              className="text-[8px] font-bold tracking-[0.25em] uppercase"
              style={{ fontFamily: "var(--font-montserrat), system-ui", color: BRAND }}
            >
              WWW.EDRISLMS.COM
            </span>

            {/* Center: logo */}
            <div className="flex items-center gap-1.5">
              <div className="h-px w-8" style={{ background: `${BRAND_LIGHT}40` }} />
              <Image
                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                alt=""
                width={12}
                height={12}
                className="object-contain opacity-60"
              />
              <div className="h-px w-8" style={{ background: `${BRAND_LIGHT}40` }} />
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              <Link2 className="size-2.5" style={{ color: BRAND_LIGHT }} />
              <span
                className="text-[8px] font-bold tracking-[0.2em] uppercase"
                style={{ fontFamily: "var(--font-montserrat), system-ui", color: BRAND }}
              >
                Polygon Amoy Network
              </span>
            </div>
          </div>

          {/* Bottom rule */}
          <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${BRAND_LIGHT}40, transparent)` }} />
          <div className="h-1" />
        </footer>
      </div>
    </div>
  );
}

/* ── Valid / Verified Result ─────────────────────────────────────────── */
function ValidResult({
  result,
}: {
  result: Extract<VerificationResult, { isValid: true }>;
}) {
  const c = result.certificate;

  const tiles: Array<{
    icon: typeof User;
    label: string;
    value: string;
    mono?: boolean;
    wide?: boolean;
    badge?: string;
    href?: string;
  }> = [
    { icon: User, label: "STUDENT", value: c.studentName },
    { icon: BookOpen, label: "COURSE", value: c.courseName },
    {
      icon: Calendar,
      label: "ISSUED ON",
      value: new Date(c.issuedAt).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      }),
    },
    { icon: Network, label: "NETWORK", value: c.network ?? "Polygon Amoy", badge: "amoy" },
    { icon: Hash, label: "CERTIFICATE ID", value: c.uniqueId, mono: true, wide: true },
    {
      icon: Layers,
      label: "BLOCK | TRANSACTION",
      value: c.txHash ? `${c.txHash.slice(0, 16)}…` : c.blockNumber ?? "N/A",
      href: c.explorerUrl,
    },
  ];

  return (
    <div className="flex flex-col py-1.5 px-0.5">
      {/* Verified header */}
      <div className="flex flex-col items-center gap-1 pb-2 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
          className="size-9 rounded-lg flex items-center justify-center"
          style={{
            background: `${BRAND_LIGHT}12`,
            border: `2px solid ${BRAND_LIGHT}35`,
            boxShadow: `0 0 12px ${BRAND_LIGHT}22`,
          }}
        >
          <CheckCircle2 className="size-4" style={{ color: BRAND }} />
        </motion.div>
        <div>
          <p
            className="text-[8px] font-bold tracking-[0.22em] uppercase"
            style={{ fontFamily: "var(--font-montserrat), system-ui", color: TEXT_SUBTLE }}
          >
            Authenticity Verified
          </p>
          <h3
            className="text-sm font-bold tracking-wide"
            style={{ fontFamily: "var(--font-cinzel), serif", color: BRAND_DARK }}
          >
            Authentic &amp; Valid
          </h3>
        </div>
        {/* Diamond divider */}
        <div className="flex items-center gap-1.5 w-20">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${BRAND_LIGHT}60)` }} />
          <div className="size-1 rotate-45 shrink-0" style={{ background: BRAND }} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${BRAND_LIGHT}60, transparent)` }} />
        </div>
      </div>

      {/* Tile grid */}
      <div className="grid grid-cols-2 gap-1.5 px-5">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.18 + i * 0.05 }}
            className={`rounded-md p-1.5 ${t.wide ? "col-span-2" : ""}`}
            style={{
              background: `${BRAND_LIGHT}06`,
              border: `1px solid ${BRAND_LIGHT}15`,
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <t.icon className="size-2.5 shrink-0" style={{ color: BRAND_LIGHT }} />
              <p
                className="text-[8px] font-bold tracking-[0.12em] uppercase"
                style={{ fontFamily: "var(--font-montserrat), system-ui", color: TEXT_SUBTLE }}
              >
                {t.label}
              </p>
              {t.badge && (
                <span
                  className="ml-auto text-[7px] font-bold rounded-sm px-1 py-0.5 text-white"
                  style={{ background: BRAND_LIGHT }}
                >
                  {t.badge}
                </span>
              )}
            </div>
            {t.href ? (
              <div className="flex flex-col gap-0.5">
                <p
                  className={`text-[9px] font-semibold break-all leading-tight ${t.mono ? "font-mono text-[8px]" : ""}`}
                  style={{ fontFamily: t.mono ? undefined : "var(--font-montserrat), system-ui", color: BRAND_DARK }}
                >
                  {t.value}
                </p>
                <a
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-[8px] font-semibold hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "var(--font-montserrat), system-ui", color: BRAND_LIGHT }}
                >
                  <ExternalLink className="size-2" />
                  View on Explorer
                </a>
              </div>
            ) : (
              <p
                className={`text-[9px] font-semibold break-all leading-tight ${t.mono ? "font-mono text-[8px]" : ""}`}
                style={{ fontFamily: t.mono ? undefined : "var(--font-montserrat), system-ui", color: BRAND_DARK }}
              >
                {t.value}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Invalid / Not-found Result ──────────────────────────────────────── */
function InvalidResult({
  result,
}: {
  result: Extract<VerificationResult, { isValid: false }>;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="size-11 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1.5px solid rgba(239,68,68,0.18)",
        }}
      >
        <XCircle className="size-5" style={{ color: "#dc2626" }} />
      </motion.div>

      <div>
        <p
          className="text-[9px] font-bold tracking-[0.25em] uppercase mb-0.5"
          style={{ fontFamily: "var(--font-montserrat), system-ui", color: "#b91c1c" }}
        >
          Verification Failed
        </p>
        <h3
          className="text-base font-bold tracking-wide"
          style={{ fontFamily: "var(--font-cinzel), serif", color: "#991b1b" }}
        >
          Invalid / Not Found
        </h3>
      </div>

      <div
        className="flex items-start gap-2 rounded-lg px-3 py-2.5 max-w-[240px] text-left w-full"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.14)" }}
      >
        <AlertCircle className="size-3.5 mt-0.5 shrink-0" style={{ color: "#dc2626" }} />
        <p
          className="text-[10px]"
          style={{ fontFamily: "var(--font-montserrat), system-ui", color: "#b91c1c" }}
        >
          {result.error}
        </p>
      </div>

      {result.certificate && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="w-full max-w-[240px] rounded-lg p-3 text-left"
          style={{ background: `${BRAND_LIGHT}04`, border: `1px solid ${BRAND_LIGHT}12` }}
        >
          <p
            className="text-[8px] font-bold uppercase tracking-[0.15em] mb-2"
            style={{ fontFamily: "var(--font-montserrat), system-ui", color: TEXT_SUBTLE }}
          >
            Certificate Details
          </p>
          {[
            { label: "Student", value: result.certificate.studentName },
            { label: "Course", value: result.certificate.courseName },
            { label: "Status", value: result.certificate.status ?? "Pending", accent: true },
          ].map((r) => (
            <div
              key={r.label}
              className="flex justify-between gap-2 py-1.5 border-b last:border-0"
              style={{ borderColor: `${BRAND_LIGHT}12` }}
            >
              <span
                className="text-[10px]"
                style={{ fontFamily: "var(--font-montserrat), system-ui", color: TEXT_SUBTLE }}
              >
                {r.label}
              </span>
              <span
                className="text-[10px] font-semibold text-right"
                style={{
                  fontFamily: "var(--font-montserrat), system-ui",
                  color: r.accent ? "#d97706" : BRAND_DARK,
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
