/**
 * Utilities for building the AI tutor's context from lesson transcriptions.
 *
 * The strategy is simple: include the entire transcript with timestamps in the
 * system prompt. A typical 30-minute video ≈ 6 000 tokens which fits easily
 * inside the 128K context window of gpt-4o-mini.
 *
 * For exceptionally long transcripts (>50K tokens, roughly 2+ hour videos) we
 * fall back to a windowed view centred on the student's current timestamp.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Raw Whisper segment shape as stored in the DB transcriptionSegments JSON. */
export interface WhisperSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  seek: number;
  tokens: number[];
  avg_logprob: number;
  temperature: number;
  no_speech_prob: number;
  compression_ratio: number;
}

/** Cleaned segment for tutor context — stripped of Whisper internals. */
export interface TranscriptionSegment {
  text: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number; // 0-1, derived from avg_logprob
}

/**
 * Parse raw Whisper JSON from the DB into clean TranscriptionSegments.
 * Filters out silence segments (no_speech_prob >= 0.8) and strips heavy
 * metadata like tokens arrays to keep memory usage low.
 */
export function parseWhisperSegments(raw: unknown): TranscriptionSegment[] {
  if (!Array.isArray(raw)) return [];
  return (raw as WhisperSegment[])
    .filter((seg) => seg.no_speech_prob < 0.8 && seg.text?.trim())
    .map(({ text, start, end, avg_logprob }) => ({
      text: text.trim(),
      start,
      end,
      confidence: Math.exp(avg_logprob),
    }));
}

export interface LessonContext {
  lessonTitle: string;
  courseName: string;
  chapterName: string;
}

export interface TutorState {
  isFirstInteraction: boolean;
  introCompleted: boolean;
  studentIntro: string | null;
  studentName: string; // From auth — user's display name
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert seconds to a human-readable MM:SS or HH:MM:SS string. */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Format the full transcript segments into a timestamped string the model can
 * reason over:
 *
 * ```
 * [00:00 - 00:45] Introduction to variables...
 * [00:45 - 01:30] Variables store data in memory...
 * ```
 */
export function formatTranscriptWithTimestamps(
  segments: TranscriptionSegment[]
): string {
  return segments
    .map(
      (seg) =>
        `[${formatTimestamp(seg.start)} - ${formatTimestamp(seg.end)}] ${seg.text.trim()}`
    )
    .join("\n");
}

/**
 * Find the segment that contains the given timestamp using binary search.
 * Falls back to the closest segment if none exactly contains the time.
 */
export function findCurrentSegment(
  segments: TranscriptionSegment[],
  timestamp: number
): TranscriptionSegment | null {
  if (segments.length === 0) return null;

  // Exact match
  for (const seg of segments) {
    if (timestamp >= seg.start && timestamp <= seg.end) {
      return seg;
    }
  }

  // Closest segment by start time
  let closest = segments[0];
  let minDiff = Math.abs(timestamp - closest.start);
  for (const seg of segments) {
    const diff = Math.abs(timestamp - seg.start);
    if (diff < minDiff) {
      minDiff = diff;
      closest = seg;
    }
  }
  return closest;
}

/**
 * Return a window of segments centred on the current timestamp.
 * Used as a fallback for very long transcripts.
 */
export function getWindowedSegments(
  segments: TranscriptionSegment[],
  timestamp: number,
  windowSize: number = 20
): TranscriptionSegment[] {
  if (segments.length <= windowSize * 2 + 1) return segments;

  // Find the index of the current segment
  let idx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < segments.length; i++) {
    const diff = Math.abs(timestamp - segments[i].start);
    if (diff < minDiff) {
      minDiff = diff;
      idx = i;
    }
  }

  const start = Math.max(0, idx - windowSize);
  const end = Math.min(segments.length, idx + windowSize + 1);
  return segments.slice(start, end);
}

/**
 * Rough token estimate: ~4 characters per token for English text.
 * This is conservative — the real ratio is closer to 3.5 for code/transcripts.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ── Transcript Cache ─────────────────────────────────────────────────────────

interface CachedTranscript {
  formatted: string;
  tokens: number;
  expiry: number;
}

const transcriptCache = new Map<string, CachedTranscript>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get formatted transcript for a lesson, using an in-memory cache to avoid
 * re-processing the same transcript on every message.
 */
function getCachedTranscript(
  lessonId: string,
  segments: TranscriptionSegment[]
): { formatted: string; tokens: number } {
  const cached = transcriptCache.get(lessonId);
  if (cached && cached.expiry > Date.now()) {
    return { formatted: cached.formatted, tokens: cached.tokens };
  }

  const formatted = formatTranscriptWithTimestamps(segments);
  const tokens = estimateTokens(formatted);

  transcriptCache.set(lessonId, {
    formatted,
    tokens,
    expiry: Date.now() + CACHE_TTL_MS,
  });

  // Evict stale entries periodically (keep map from growing unbounded)
  if (transcriptCache.size > 200) {
    const now = Date.now();
    for (const [key, val] of transcriptCache) {
      if (val.expiry < now) transcriptCache.delete(key);
    }
  }

  return { formatted, tokens };
}

// ── System Prompt Builder ────────────────────────────────────────────────────

const MAX_TRANSCRIPT_TOKENS = 50_000;

export function buildTutorSystemPrompt(
  context: LessonContext & { lessonId: string },
  segments: TranscriptionSegment[],
  currentTimestamp: number,
  tutorState: TutorState
): string {
  const currentSegment = findCurrentSegment(segments, currentTimestamp);
  const currentSegmentText = currentSegment?.text.trim() ?? "N/A";
  const formattedTimestamp = formatTimestamp(currentTimestamp);

  // Use cached formatted transcript when possible
  const { formatted: fullTranscript, tokens: estimatedTokens } =
    getCachedTranscript(context.lessonId, segments);

  // Check average transcription confidence across segments
  const avgConfidence =
    segments.length > 0
      ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
      : 1;

  let transcriptSection: string;
  if (estimatedTokens <= MAX_TRANSCRIPT_TOKENS) {
    transcriptSection = fullTranscript;
  } else {
    const windowed = getWindowedSegments(segments, currentTimestamp, 25);
    transcriptSection =
      `[Note: Transcript is very long. Showing segments around the student's current position.]\n\n` +
      formatTranscriptWithTimestamps(windowed);
  }

  if (avgConfidence < 0.5) {
    transcriptSection +=
      "\n\n[Note: Transcription quality is low in some sections. If a student asks about something and the transcript text seems garbled or unclear, let them know the transcript might be inaccurate there and suggest they rewatch that part of the video.]";
  }

  // ── Student context ─────────────────────────────────────────────────────
  let studentSection: string;
  if (tutorState.introCompleted && tutorState.studentIntro) {
    studentSection = `The student has previously introduced themselves:\n"${tutorState.studentIntro}"\nUse their name naturally in conversation (not every message — just like a real teacher would).`;
  } else {
    studentSection = `The student's account name is "${tutorState.studentName}".`;
  }

  // ── Intro flow ──────────────────────────────────────────────────────────
  let introInstructions: string;
  if (tutorState.isFirstInteraction && !tutorState.introCompleted) {
    introInstructions = `
## IMPORTANT — First-Time Introduction
This is the student's VERY FIRST message to you in this lesson. Before diving into content, briefly welcome them and ask them to introduce themselves in 1-2 sentences — their name, what they already know about this topic, and what they hope to learn. Keep it warm and casual, like a real teacher meeting a new student. Example:
"Hey! Welcome to this lesson. Before we jump in, I'd love to know a little about you — what's your name, and have you worked with [topic] before?"
After they respond with their intro, acknowledge it warmly, then transition naturally into helping them with the lesson.`;
  } else {
    introInstructions = "";
  }

  return `You are a human-like AI tutor for the lesson "${context.lessonTitle}" in the course "${context.courseName}" (Chapter: "${context.chapterName}").

## Who You Are
You are a warm, experienced teacher — not an AI assistant. You talk like a real person sitting next to the student helping them study. You have a personality: you're encouraging but honest, patient but you keep the student focused, and you care about them truly understanding — not just giving answers.

## Your Teaching Personality
- **Warm but real**: Use natural, conversational language. Say things like "Okay so here's the thing...", "Think of it this way...", "Good question — let me break it down."
- **Patient but firm on focus**: If a student is confused, re-explain patiently with analogies and simpler language. But if they're going off-topic, gently bring them back — just like a real teacher.
- **Check understanding**: After explaining something, ask a quick follow-up like "Does that click?" or "Want me to go over that again?" or "Can you tell me in your own words what that means?"
- **Reference the video naturally**: Say things like "Around the 2:30 mark, the instructor walks through this..." or "Go back to about 5:15 — that's where this concept first comes up."
- **Suggest rewatching**: When the student is struggling with a specific part, tell them exactly where to rewatch: "I'd say rewatch from 3:20 to 4:00, that's where the key example is."
- **Adapt your level**: If the student asks a beginner question, keep it simple. If they ask something advanced, go deeper. Match their energy.
- **Use the student's name occasionally** — not in every message, but enough to feel personal, like a real teacher does.
${introInstructions}

## Student Info
${studentSection}

## Current Video Context
- Student is at timestamp: **${formattedTimestamp}**
- The instructor is currently discussing: "${currentSegmentText}"

## Full Lesson Transcript (with timestamps)
${transcriptSection}

## OFF-TOPIC HANDLING — This is critical
You are a teacher for THIS lesson only. You MUST stay within the scope of this course and lesson content.

**If the student asks something unrelated to the course** (e.g., asks about cooking, movies, personal advice, other random topics):
- First time: Gently redirect. Say something like "Ha, that's an interesting question, but let's stay focused on what we're learning here. So, about [current topic]..."
- Second time: Be a bit firmer but still friendly: "I appreciate the curiosity, but my job is to help you nail this lesson. Let's get back on track — where were we?"
- Third time or more: Be direct like a real teacher would: "Look, I know this might not be the most exciting thing right now, but this material matters. Let's focus — you'll thank yourself later. Now, back to [topic]..."

**If the student asks about a different subject that IS academic but NOT in this course** (e.g., they're in a JavaScript course and ask about quantum physics):
- Acknowledge it's a good question but outside your scope: "That's a great question, but it's outside what we cover in this course. I'm here to help you master [course topic]. Want to dive back into what we were looking at?"

**If the student keeps testing boundaries or being silly:**
- Handle it like a real teacher — with humor but firmness: "Alright class clown, very funny 😄 But seriously, let's get back to work. We've got good stuff to cover."

## CONTENT RULES
- ONLY explain things the instructor actually covers in the transcript. Never invent topics or information.
- When referencing video moments, mention approximate timestamps so the student can find them.
- Keep responses conversational and digestible — no walls of text.
- Use **bold** for key terms, numbered lists for steps, bullets for options.
- If the transcript is empty or unavailable, let the student know you have limited context but still try to help with what you know about the lesson title and description.`;
}
