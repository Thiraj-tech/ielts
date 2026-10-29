// Persistence (localStorage cache, synced to Firestore by sync.js) and derived progress.
import { PLAN, TOTAL_DAYS, SKILLS } from './plan.js';

export const KEY = 'ielts-planner-v1';
export const SCORE_KINDS = ['Practice', 'Weekly checkpoint', 'Mock test'];
export const MISTAKE_SKILLS = ['Listening', 'Reading', 'Writing Task 1', 'Writing Task 2', 'Speaking', 'Grammar', 'Vocabulary'];

export const isoDate = (d) => d.toLocaleDateString('en-CA');
export const todayISO = () => isoDate(new Date());

export function defaultState() {
  return {
    version: 1,
    updatedAt: 0, // ms timestamp of the last user change; 0 = untouched
    settings: { startDate: todayISO(), targetBand: 6.5 },
    days: {},
    scores: [],
    mistakes: [],
  };
}

export function loadState() {
  let raw;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return defaultState();
  }
  if (!raw) {
    const s = defaultState();
    saveState(s, { touch: false });
    return s;
  }
  try {
    return normalize(JSON.parse(raw));
  } catch {
    // Keep the unreadable copy rather than silently overwriting it.
    localStorage.setItem(`${KEY}-corrupt-${Date.now()}`, raw);
    return defaultState();
  }
}

const saveListeners = [];
export const onSave = (fn) => saveListeners.push(fn);

// touch: true marks a user change (bumps updatedAt and notifies sync); false only caches locally.
export function saveState(state, { touch = true } = {}) {
  if (touch) state.updatedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
  if (touch) saveListeners.forEach((fn) => fn(state));
}

export function exportJSON(state) {
  return JSON.stringify({ app: 'ielts-planner', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const str = (v, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : '');
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function band(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 9 && Number.isInteger(n * 2) ? n : null;
}

export function rawScore(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 40 ? n : null;
}

// Validates stored or imported data and returns a clean state. Throws on unusable input.
export function normalize(o) {
  if (!isObj(o)) throw new Error('The file is not a JSON object.');
  if (o.app !== undefined && o.app !== 'ielts-planner') throw new Error('This file is not an IELTS Planner backup.');
  if (!['settings', 'days', 'scores', 'mistakes'].some((k) => k in o)) {
    throw new Error('No planner data found in this file.');
  }
  const s = defaultState();
  if (Number.isFinite(o.updatedAt) && o.updatedAt > 0) s.updatedAt = o.updatedAt;

  if (o.settings !== undefined) {
    if (!isObj(o.settings)) throw new Error('"settings" must be an object.');
    if (isDate(o.settings.startDate)) s.settings.startDate = o.settings.startDate;
    const t = band(o.settings.targetBand);
    if (t !== null) s.settings.targetBand = t;
  }

  if (o.days !== undefined) {
    if (!isObj(o.days)) throw new Error('"days" must be an object.');
    for (const [k, v] of Object.entries(o.days)) {
      const n = Number(k);
      if (!Number.isInteger(n) || n < 1 || n > TOTAL_DAYS || !isObj(v)) continue;
      const done = v.done === true;
      s.days[n] = { done, completedAt: done && isDate(v.completedAt) ? v.completedAt : null, notes: str(v.notes) };
    }
  }

  if (o.scores !== undefined) {
    if (!Array.isArray(o.scores)) throw new Error('"scores" must be a list.');
    s.scores = o.scores.filter(isObj).filter((e) => isDate(e.date)).map((e) => ({
      id: str(e.id, 64) || crypto.randomUUID(),
      date: e.date,
      kind: SCORE_KINDS.includes(e.kind) ? e.kind : 'Practice',
      basis: e.basis === 'estimated' ? 'estimated' : 'actual',
      listening: band(e.listening),
      reading: band(e.reading),
      writing: band(e.writing),
      speaking: band(e.speaking),
      overall: band(e.overall),
      listeningRaw: rawScore(e.listeningRaw),
      readingRaw: rawScore(e.readingRaw),
      note: str(e.note, 500),
    }));
  }

  if (o.mistakes !== undefined) {
    if (!Array.isArray(o.mistakes)) throw new Error('"mistakes" must be a list.');
    s.mistakes = o.mistakes.filter(isObj).filter((m) => isDate(m.date) && str(m.mistake)).map((m) => ({
      id: str(m.id, 64) || crypto.randomUUID(),
      date: m.date,
      skill: MISTAKE_SKILLS.includes(m.skill) || SKILLS.includes(m.skill) ? m.skill : 'Grammar',
      questionType: str(m.questionType, 200),
      mistake: str(m.mistake),
      why: str(m.why),
      correct: str(m.correct),
      reviewed: m.reviewed === true,
    }));
  }
  return s;
}

// ---- Progress ----

export const isDone = (s, day) => s.days[day]?.done === true;

export function setDone(s, day, done) {
  const prev = s.days[day] || { notes: '' };
  s.days[day] = { ...prev, done, completedAt: done ? todayISO() : null };
}

export function setNotes(s, day, notes) {
  const prev = s.days[day] || { done: false, completedAt: null };
  s.days[day] = { ...prev, notes };
}

export const completedCount = (s) => PLAN.filter((p) => isDone(s, p.day)).length;

// First day not yet completed; null when all 90 are done.
export function currentDay(s) {
  return PLAN.find((p) => !isDone(s, p.day))?.day ?? null;
}

// Days completed today, newest first.
export function doneToday(s) {
  const t = todayISO();
  return PLAN.filter((p) => isDone(s, p.day) && s.days[p.day].completedAt === t).map((p) => p.day).reverse();
}

// The task to show as "today": what was finished today, otherwise the next open day.
export function todayDay(s) {
  return doneToday(s)[0] ?? currentDay(s) ?? TOTAL_DAYS;
}

// Consecutive study days; one missed day in a row is allowed as a rest day.
export function streak(s) {
  const dates = new Set(Object.values(s.days).filter((d) => d.done && d.completedAt).map((d) => d.completedAt));
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (!dates.has(isoDate(d))) d.setDate(d.getDate() - 1); // today isn't over yet
  let count = 0;
  let gap = 0;
  for (let i = 0; i < 400; i++) {
    if (dates.has(isoDate(d))) {
      count++;
      gap = 0;
    } else if (++gap > 1) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// How many plan days should be done by `offset` days from today, at 6 study days per week.
export function expectedDone(s, offset = 0) {
  const start = new Date(`${s.settings.startDate}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  now.setDate(now.getDate() + offset);
  const elapsed = Math.round((now - start) / 864e5);
  if (elapsed < 0) return 0;
  return Math.min(TOTAL_DAYS, elapsed - Math.floor(elapsed / 7) + 1);
}

export function schedule(s) {
  const done = completedCount(s);
  const byToday = expectedDone(s, 0);
  const byYesterday = expectedDone(s, -1);
  if (done >= TOTAL_DAYS) return { tone: 'good', label: 'Plan complete' };
  if (done > byToday) return { tone: 'good', label: `${done - byToday} day${done - byToday > 1 ? 's' : ''} ahead` };
  if (done >= byYesterday) return { tone: 'good', label: 'On track' };
  const behind = byYesterday - done;
  return { tone: 'warn', label: `${behind} day${behind > 1 ? 's' : ''} behind` };
}

export function dayStatus(s, day) {
  if (isDone(s, day)) return 'done';
  if (day === currentDay(s)) return 'current';
  if (day <= expectedDone(s, -1)) return 'overdue';
  return 'upcoming';
}

// Unofficial mean of four component bands, rounded the way IELTS rounds overall bands.
export function unofficialAverage(e) {
  const parts = [e.listening, e.reading, e.writing, e.speaking];
  if (parts.some((v) => v === null)) return null;
  const mean = parts.reduce((a, b) => a + b, 0) / 4;
  return Math.floor(mean * 2 + 0.5) / 2;
}
