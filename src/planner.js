import { PLAN, TOTAL_DAYS, DAILY_BUDGET, PHASES, SKILL_TIPS, WEEKS, weekOf, weekLabel, daysInWeek } from './plan.js';
import {
  KEY, SCORE_KINDS, MISTAKE_SKILLS, loadState, saveState, exportJSON, normalize, defaultState, todayISO,
  band, rawScore, isDone, setDone, setNotes, completedCount, currentDay, doneToday, todayDay, streak,
  schedule, dayStatus, unofficialAverage,
} from './store.js';
import { esc, icon, skillTag, fmtDate, fmtMin, ring } from './ui.js';
import { syncEnabled, syncStatus, initSync, signIn, signOut } from './sync.js';

let state = loadState();
const main = document.getElementById('main');
const toastEl = document.getElementById('toast');
const resetDialog = document.getElementById('reset-dialog');

// Mistake journal filters (view state only, not persisted).
let mistakeFilter = 'unresolved';
let mistakeSkill = 'all';

const VIEWS = {
  dashboard: { title: 'Dashboard', icon: 'home', render: renderDashboard },
  plan: { title: 'Study plan', icon: 'calendar', render: renderPlan },
  scores: { title: 'Scores', icon: 'chart', render: renderScores },
  mistakes: { title: 'Mistake journal', icon: 'alert', render: renderMistakes },
  resources: { title: 'Resources', icon: 'book', render: renderResources },
  settings: { title: 'Settings & backup', icon: 'settings', render: renderSettings },
};

const STATUS_LABEL = { done: 'Completed', current: 'Current', overdue: 'Overdue', upcoming: 'Upcoming' };

function route() {
  const [view, arg] = location.hash.slice(1).split('/');
  return { view: VIEWS[view] ? view : 'dashboard', arg };
}

function render() {
  const { view, arg } = route();
  const focusId = document.activeElement?.dataset?.fid;

  document.getElementById('nav').innerHTML = Object.entries(VIEWS).map(([key, v]) => `
    <li><a href="#${key}" aria-label="${v.title}" title="${v.title}" ${key === view ? 'aria-current="page"' : ''}>${icon(v.icon)}<span>${v.title}</span></a></li>`).join('');
  const done = completedCount(state);
  document.getElementById('side-progress').innerHTML = `
    <div class="bar" aria-hidden="true"><span style="width:${(done / TOTAL_DAYS) * 100}%"></span></div>
    <p class="small muted">${done} of ${TOTAL_DAYS} days complete</p>
    ${syncWidget()}`;

  main.innerHTML = VIEWS[view].render(arg);
  document.title = `${VIEWS[view].title} · IELTS Planner`;

  if (focusId) main.querySelector(`[data-fid="${CSS.escape(focusId)}"]`)?.focus();
}

function commit() {
  saveState(state);
  render();
}

function toast(msg, tone = '') {
  toastEl.textContent = msg;
  toastEl.className = `toast show ${tone}`;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { toastEl.className = 'toast'; }, 3500);
}

// ---------- Shared pieces ----------

const SYNC_LABEL = {
  disabled: 'Local only', loading: 'Connecting…', 'signed-out': 'Not signed in',
  syncing: 'Syncing…', synced: 'Synced', error: 'Sync error',
};

function syncWidget() {
  const s = syncStatus();
  if (s.state === 'disabled') return '<p class="small muted">Saved in this browser only</p>';
  return `
    <div class="sync sync-${s.state}">
      <span class="small"><i class="sync-dot"></i>${SYNC_LABEL[s.state]}</span>
      ${s.user ? `<span class="small muted sync-user">${esc(s.user.email)}</span>` : ''}
      ${s.error ? `<span class="small tone-warn">${esc(s.error)}</span>` : ''}
      ${s.state === 'signed-out' ? '<button class="btn btn-primary" data-action="sign-in">Sign in with Google</button>' : ''}
      ${s.user ? '<button class="link small" data-action="sign-out">Sign out</button>' : ''}
    </div>`;
}

function pageHead(title, sub = '') {
  return `<header class="page-head"><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</header>`;
}

function taskDetail(p, { headingLevel = 2 } = {}) {
  const d = state.days[p.day] || {};
  const h = `h${headingLevel}`;
  return `
    <div class="task-meta">
      ${skillTag(p.skill)}
      <span class="muted small">${icon('clock', 14)} ${fmtMin(p.minutes)}</span>
      ${p.minutes > DAILY_BUDGET ? `<span class="small tone-warn">Longer than your ${DAILY_BUDGET}-minute budget</span>` : ''}
    </div>
    <${h} class="task-title">Day ${p.day}: ${esc(p.title)}</${h}>
    <p class="muted small">${weekLabel(p.week)} · ${esc(PHASES[p.week])}</p>
    <p class="task-instr">${esc(p.instructions)}</p>
    <p class="tip"><strong>Tip:</strong> ${esc(SKILL_TIPS[p.skill])}</p>
    <div class="task-actions">
      <button class="btn ${d.done ? '' : 'btn-primary'}" data-action="toggle-day" data-day="${p.day}" data-fid="toggle-${p.day}" aria-pressed="${!!d.done}">
        ${icon('check')} ${d.done ? 'Completed — undo' : 'Mark complete'}
      </button>
      ${d.done && d.completedAt ? `<span class="small muted">Completed ${fmtDate(d.completedAt)}</span>` : ''}
    </div>
    <label class="field">
      <span>Notes</span>
      <textarea rows="3" data-notes="${p.day}" data-fid="notes-${p.day}" placeholder="Scores, difficult words, what to repeat…">${esc(d.notes)}</textarea>
    </label>`;
}

function dayRow(p, selected) {
  const status = dayStatus(state, p.day);
  return `
    <li class="day-row is-${status} ${selected ? 'is-selected' : ''}">
      <input type="checkbox" ${status === 'done' ? 'checked' : ''} data-action="toggle-day" data-day="${p.day}"
        data-fid="cb-${p.day}" aria-label="Day ${p.day} complete">
      <a href="#plan/${p.day}" ${selected ? 'aria-current="true"' : ''}>
        <span class="day-num">Day ${p.day}</span>
        <span class="day-title">${esc(p.title)}</span>
      </a>
      <span class="status status-${status}">${STATUS_LABEL[status]}</span>
    </li>`;
}

// ---------- Dashboard ----------

function renderDashboard() {
  const done = completedCount(state);
  const pct = Math.round((done / TOTAL_DAYS) * 100);
  const cur = currentDay(state);
  const p = PLAN[todayDay(state) - 1];
  const finishedToday = isDone(state, p.day);
  const sched = schedule(state);
  const s = streak(state);
  const week = daysInWeek(p.week);
  const weekLeft = week.filter((d) => !isDone(state, d.day)).reduce((a, d) => a + d.minutes, 0);
  const open = state.mistakes.filter((m) => !m.reviewed).length;
  const latest = [...state.scores].sort((a, b) => b.date.localeCompare(a.date))[0];

  return `
    ${pageHead('Dashboard', `${weekLabel(p.week)} · ${esc(PHASES[p.week])}`)}
    ${syncStatus().state === 'signed-out' ? `<p class="callout banner">Sign in to save your progress to the cloud and use it on any device.
      <button class="btn btn-primary" data-action="sign-in">Sign in with Google</button></p>` : ''}

    <div class="grid stats">
      <div class="card stat-ring">
        ${ring(pct)}
        <div><span class="stat-label">Overall progress</span><strong>${done} done</strong><span class="muted small">${TOTAL_DAYS - done} remaining</span></div>
      </div>
      <div class="card stat">
        <span class="stat-label">${icon('calendar', 14)} Current day</span>
        <strong>${cur ? `Day ${cur}` : 'Finished'} <span class="muted">/ ${TOTAL_DAYS}</span></strong>
        <span class="muted small">${weekLabel(weekOf(cur ?? TOTAL_DAYS))}</span>
      </div>
      <div class="card stat">
        <span class="stat-label">${icon('flame', 14)} Study streak</span>
        <strong>${s} day${s === 1 ? '' : 's'}</strong>
        <span class="muted small">One rest day in a row allowed</span>
      </div>
      <div class="card stat">
        <span class="stat-label">${icon('target', 14)} Schedule</span>
        <strong class="tone-${sched.tone}">${sched.label}</strong>
        <span class="muted small">Started ${fmtDate(state.settings.startDate)}</span>
      </div>
    </div>

    <div class="grid two-one">
      <section class="card" aria-labelledby="today-h">
        <div class="card-head">
          <h2 id="today-h" class="eyebrow">Today's study task</h2>
          <a class="small" href="#plan/${p.day}">Open in plan</a>
        </div>
        ${taskDetail(p, { headingLevel: 3 })}
        ${finishedToday && cur ? `<p class="callout">Done for today — nice work. Next up is <a href="#plan/${cur}">Day ${cur}: ${esc(PLAN[cur - 1].title)}</a> whenever you're ready.</p>` : ''}
        ${!cur ? '<p class="callout">You have completed all 90 days. Good luck in your exam!</p>' : ''}
      </section>

      <div class="stack">
        <section class="card" aria-labelledby="week-h">
          <div class="card-head">
            <h2 id="week-h" class="eyebrow">${weekLabel(p.week)}</h2>
            <span class="small muted">${fmtMin(weekLeft)} left</span>
          </div>
          <ul class="day-list compact">${week.map((d) => dayRow(d, d.day === p.day)).join('')}</ul>
        </section>
        <section class="card stat">
          <span class="stat-label">${icon('alert', 14)} Unresolved mistakes</span>
          <strong>${open}</strong>
          <a class="small" href="#mistakes">${open ? 'Review them' : 'Open journal'}</a>
        </section>
        <section class="card stat">
          <span class="stat-label">${icon('chart', 14)} Latest score</span>
          ${latest ? `<strong>${latest.overall ?? '—'} <span class="muted small">overall</span></strong>
            <span class="muted small">${esc(latest.kind)} · ${latest.basis} · ${fmtDate(latest.date)}</span>`
            : '<span class="muted small">No scores recorded yet.</span>'}
          <a class="small" href="#scores">Record a score</a>
        </section>
      </div>
    </div>
    <p class="small muted">Studied today: ${doneToday(state).length ? doneToday(state).map((d) => `Day ${d}`).join(', ') : 'nothing yet'}.</p>`;
}

// ---------- Plan ----------

function renderPlan(arg) {
  const sel = Math.min(TOTAL_DAYS, Math.max(1, Number(arg) || currentDay(state) || 1));
  const p = PLAN[sel - 1];
  const week = p.week;

  const cal = WEEKS.map((w) => `
    <div class="cal-row">
      <a class="cal-week ${w === week ? 'is-active' : ''}" href="#plan/${daysInWeek(w)[0].day}">${w === 13 ? 'Final' : `W${w}`}</a>
      ${daysInWeek(w).map((d) => {
        const st = dayStatus(state, d.day);
        return `<a class="cal-cell is-${st} ${d.day === sel ? 'is-selected' : ''}" href="#plan/${d.day}"
          aria-label="Day ${d.day}, ${d.title}, ${STATUS_LABEL[st]}" ${d.day === sel ? 'aria-current="true"' : ''}>${d.day}</a>`;
      }).join('')}
    </div>`).join('');

  const nav = (label, target, ic, disabled) => disabled
    ? `<span class="btn" aria-disabled="true">${ic === 'left' ? icon(ic) : ''}${label}${ic === 'right' ? icon(ic) : ''}</span>`
    : `<a class="btn" href="#plan/${target}">${ic === 'left' ? icon(ic) : ''}${label}${ic === 'right' ? icon(ic) : ''}</a>`;

  return `
    ${pageHead('Study plan', 'All 90 days. Tick any day, including missed ones, whenever you finish it.')}
    <section class="card cal-card" aria-label="90-day calendar">
      <div class="cal">${cal}</div>
      <div class="legend small muted">
        <span><i class="dot is-done"></i>Completed</span><span><i class="dot is-current"></i>Current</span>
        <span><i class="dot is-overdue"></i>Overdue</span><span><i class="dot is-upcoming"></i>Upcoming</span>
      </div>
    </section>

    <div class="grid plan-layout">
      <section class="card" aria-labelledby="wk-h">
        <div class="card-head">
          <h2 id="wk-h" class="eyebrow">${weekLabel(week)} · ${esc(PHASES[week])}</h2>
        </div>
        <ul class="day-list">${daysInWeek(week).map((d) => dayRow(d, d.day === sel)).join('')}</ul>
        <div class="pager">
          ${nav('Previous week', daysInWeek(week - 1)[0]?.day, 'left', week === 1)}
          ${nav('Next week', daysInWeek(week + 1)[0]?.day, 'right', week === WEEKS.length)}
        </div>
      </section>
      <article class="card">
        ${taskDetail(p)}
        <div class="pager">
          ${nav('Previous day', sel - 1, 'left', sel === 1)}
          ${nav('Next day', sel + 1, 'right', sel === TOTAL_DAYS)}
        </div>
      </article>
    </div>`;
}

// ---------- Scores ----------

const COMPONENTS = [['listening', 'Listening'], ['reading', 'Reading'], ['writing', 'Writing'], ['speaking', 'Speaking'], ['overall', 'Overall']];

function bandSelect(name, label) {
  const opts = ['<option value="">—</option>'];
  for (let v = 9; v >= 0; v -= 0.5) opts.push(`<option value="${v}">${v.toFixed(1)}</option>`);
  return `<label class="field"><span>${label}</span><select name="${name}">${opts.join('')}</select></label>`;
}

function chart(entries, key, label) {
  const pts = entries.filter((e) => e[key] !== null);
  if (!pts.length) {
    return `<div class="chart-card"><h3>${label}</h3><p class="empty small">No ${label.toLowerCase()} scores yet.</p></div>`;
  }
  const target = state.settings.targetBand;
  const W = 300, H = 150, L = 28, R = 12, T = 10, B = 24;
  const min = Math.max(0, Math.floor(Math.min(target, ...pts.map((p) => p[key]))) - 1);
  const max = 9;
  const x = (i) => (pts.length === 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1));
  const y = (v) => T + ((max - v) * (H - T - B)) / (max - min);
  const step = max - min > 5 ? 2 : 1;
  let grid = '';
  for (let v = max; v >= min; v -= step) {
    grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/><text x="${L - 6}" y="${y(v)}" class="axis-label" text-anchor="end">${v}</text>`;
  }
  const line = pts.map((p, i) => `${x(i)},${y(p[key])}`).join(' ');
  const dots = pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p[key])}" r="4.5" class="pt ${p.basis}">
    <title>${fmtDate(p.date)} · ${p[key]} · ${p.basis} (${p.kind})</title></circle>`).join('');
  const short = { day: 'numeric', month: 'short' };
  return `
    <div class="chart-card">
      <h3>${label} <span class="muted small">latest ${pts[pts.length - 1][key]}</span></h3>
      <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${label} scores over time, ${pts.length} entries, target ${target}">
        ${grid}
        <line x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}" class="target-line"/>
        <polyline points="${line}" class="series"/>
        ${dots}
        <text x="${L}" y="${H - 6}" class="axis-label">${fmtDate(pts[0].date, short)}</text>
        ${pts.length > 1 ? `<text x="${W - R}" y="${H - 6}" class="axis-label" text-anchor="end">${fmtDate(pts[pts.length - 1].date, short)}</text>` : ''}
      </svg>
    </div>`;
}

function renderScores() {
  const entries = [...state.scores].sort((a, b) => a.date.localeCompare(b.date) || 0);
  const cell = (b, raw) => (b === null ? (raw !== null ? `<span class="muted">${raw}/40</span>` : '—')
    : `${b.toFixed(1)}${raw !== null ? ` <span class="muted small">(${raw}/40)</span>` : ''}`);

  const rows = [...entries].reverse().map((e) => {
    const avg = unofficialAverage(e);
    return `<tr>
      <td>${fmtDate(e.date)}</td>
      <td>${esc(e.kind)}</td>
      <td><span class="basis basis-${e.basis}">${e.basis === 'actual' ? 'Actual' : 'Estimated'}</span></td>
      <td>${cell(e.listening, e.listeningRaw)}</td>
      <td>${cell(e.reading, e.readingRaw)}</td>
      <td>${cell(e.writing, null)}</td>
      <td>${cell(e.speaking, null)}</td>
      <td>${e.overall === null ? '—' : e.overall.toFixed(1)}${avg !== null && avg !== e.overall ? `<br><span class="muted small" title="Unofficial average of your four entered scores">avg ${avg.toFixed(1)}*</span>` : ''}</td>
      <td class="note-cell">${esc(e.note)}</td>
      <td><button class="icon-btn" data-action="delete-score" data-id="${esc(e.id)}" aria-label="Delete score from ${fmtDate(e.date)}">${icon('trash', 16)}</button></td>
    </tr>`;
  }).join('');

  return `
    ${pageHead('Scores', `Target overall band: ${state.settings.targetBand.toFixed(1)}`)}
    <section class="card">
      <h2 class="eyebrow">Record a result</h2>
      <form id="score-form" class="form-grid">
        <label class="field"><span>Date</span><input type="date" name="date" value="${todayISO()}" required></label>
        <label class="field"><span>Type</span><select name="kind">${SCORE_KINDS.map((k) => `<option>${k}</option>`).join('')}</select></label>
        <fieldset class="field segmented">
          <legend>Basis</legend>
          <label><input type="radio" name="basis" value="actual" checked> Actual result</label>
          <label><input type="radio" name="basis" value="estimated"> My estimate</label>
        </fieldset>
        ${bandSelect('listening', 'Listening band')}
        <label class="field"><span>Listening raw (/40)</span><input type="number" name="listeningRaw" min="0" max="40" step="1" inputmode="numeric"></label>
        ${bandSelect('reading', 'Reading band')}
        <label class="field"><span>Reading raw (/40)</span><input type="number" name="readingRaw" min="0" max="40" step="1" inputmode="numeric"></label>
        ${bandSelect('writing', 'Writing band')}
        ${bandSelect('speaking', 'Speaking band')}
        ${bandSelect('overall', 'Overall band')}
        <label class="field span-2"><span>Note (source, test name)</span><input type="text" name="note" maxlength="500" placeholder="e.g. British Council practice test 2"></label>
        <div class="form-foot span-all">
          <p class="small muted">Leave anything you don't know blank. "Actual" means a marked practice result; "Estimate" is your own judgement (for example, self-assessing writing against the band descriptors). Nothing here is an official IELTS band.</p>
          <button class="btn btn-primary" type="submit">Save result</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="eyebrow">Progress over time</h2>
        <div class="legend small muted"><span><i class="dot pt-actual"></i>Actual</span><span><i class="dot pt-estimated"></i>Estimated</span><span><i class="dash"></i>Target</span></div>
      </div>
      ${entries.length ? `<div class="charts">${COMPONENTS.map(([k, l]) => chart(entries, k, l)).join('')}</div>`
        : '<p class="empty">No scores yet. Record your first practice result above — Day 1 and Day 2 are good starting points.</p>'}
    </section>

    ${entries.length ? `
    <section class="card">
      <h2 class="eyebrow">All results</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Basis</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Overall</th><th>Note</th><th><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="small muted">* Unofficial average of the four component scores you entered, rounded to the nearest half band. It is shown only when all four are present and is not an official result.</p>
    </section>` : ''}`;
}

function saveScore(form) {
  const f = new FormData(form);
  const entry = {
    id: crypto.randomUUID(),
    date: f.get('date'),
    kind: f.get('kind'),
    basis: f.get('basis'),
    listening: band(f.get('listening')),
    reading: band(f.get('reading')),
    writing: band(f.get('writing')),
    speaking: band(f.get('speaking')),
    overall: band(f.get('overall')),
    listeningRaw: rawScore(f.get('listeningRaw')),
    readingRaw: rawScore(f.get('readingRaw')),
    note: String(f.get('note') || '').trim(),
  };
  if (!entry.date) return toast('Please choose a date.', 'error');
  const fields = ['listening', 'reading', 'writing', 'speaking', 'overall', 'listeningRaw', 'readingRaw'];
  if (fields.every((k) => entry[k] === null)) return toast('Enter at least one score.', 'error');
  state.scores.push(entry);
  commit();
  toast('Result saved.');
}

// ---------- Mistakes ----------

function renderMistakes() {
  const all = state.mistakes;
  const list = all
    .filter((m) => mistakeFilter === 'all' || (mistakeFilter === 'reviewed' ? m.reviewed : !m.reviewed))
    .filter((m) => mistakeSkill === 'all' || m.skill === mistakeSkill)
    .sort((a, b) => b.date.localeCompare(a.date));
  const counts = { unresolved: all.filter((m) => !m.reviewed).length, reviewed: all.filter((m) => m.reviewed).length, all: all.length };
  const skills = [...new Set([...MISTAKE_SKILLS, ...all.map((m) => m.skill)])];

  const cards = list.map((m) => `
    <li class="card mistake ${m.reviewed ? 'is-reviewed' : ''}">
      <div class="task-meta">${skillTag(m.skill)}${m.questionType ? `<span class="small">${esc(m.questionType)}</span>` : ''}<span class="small muted">${fmtDate(m.date)}</span></div>
      <dl>
        <dt>Mistake</dt><dd>${esc(m.mistake)}</dd>
        ${m.why ? `<dt>Why it happened</dt><dd>${esc(m.why)}</dd>` : ''}
        ${m.correct ? `<dt>Correct approach</dt><dd>${esc(m.correct)}</dd>` : ''}
      </dl>
      <div class="task-actions">
        <button class="btn ${m.reviewed ? '' : 'btn-primary'}" data-action="toggle-mistake" data-id="${esc(m.id)}" data-fid="m-${esc(m.id)}" aria-pressed="${m.reviewed}">
          ${icon('check')} ${m.reviewed ? 'Reviewed — mark unresolved' : 'Mark reviewed'}
        </button>
        <button class="icon-btn" data-action="delete-mistake" data-id="${esc(m.id)}" aria-label="Delete mistake">${icon('trash', 16)}</button>
      </div>
    </li>`).join('');

  const emptyMsg = !all.length
    ? 'No mistakes logged yet. When you get a question wrong, add it here so you can revisit it on review days.'
    : mistakeFilter === 'unresolved' ? 'No unresolved mistakes for this filter. Well done!' : 'Nothing matches this filter.';

  return `
    ${pageHead('Mistake journal', `${counts.unresolved} unresolved · ${counts.reviewed} reviewed`)}
    <section class="card">
      <h2 class="eyebrow">Log a mistake</h2>
      <form id="mistake-form" class="form-grid">
        <label class="field"><span>Date</span><input type="date" name="date" value="${todayISO()}" required></label>
        <label class="field"><span>Skill</span><select name="skill">${MISTAKE_SKILLS.map((s) => `<option>${s}</option>`).join('')}</select></label>
        <label class="field span-2"><span>Question type</span><input type="text" name="questionType" maxlength="200" placeholder="e.g. True/False/Not Given, map labelling"></label>
        <label class="field span-all"><span>Mistake made</span><textarea name="mistake" rows="2" required placeholder="What did you answer or write?"></textarea></label>
        <label class="field span-2"><span>Why I made it</span><textarea name="why" rows="2" placeholder="Missed a keyword, ran out of time, misread the word limit…"></textarea></label>
        <label class="field span-2"><span>Correct approach</span><textarea name="correct" rows="2" placeholder="What to do next time"></textarea></label>
        <div class="form-foot span-all"><span></span><button class="btn btn-primary" type="submit">Add to journal</button></div>
      </form>
    </section>

    <div class="toolbar">
      <div class="seg" role="group" aria-label="Filter by status">
        ${['unresolved', 'reviewed', 'all'].map((f) => `<button class="seg-btn" data-action="mistake-filter" data-value="${f}" data-fid="mf-${f}" aria-pressed="${mistakeFilter === f}">${f[0].toUpperCase() + f.slice(1)} (${counts[f]})</button>`).join('')}
      </div>
      <label class="inline-field small">Skill
        <select data-action="mistake-skill" data-fid="mskill">
          <option value="all">All skills</option>
          ${skills.map((s) => `<option ${s === mistakeSkill ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
      </label>
    </div>
    ${list.length ? `<ul class="mistakes">${cards}</ul>` : `<p class="card empty">${emptyMsg}</p>`}`;
}

function saveMistake(form) {
  const f = new FormData(form);
  const mistake = String(f.get('mistake') || '').trim();
  if (!mistake) return toast('Describe the mistake first.', 'error');
  state.mistakes.push({
    id: crypto.randomUUID(),
    date: f.get('date') || todayISO(),
    skill: f.get('skill'),
    questionType: String(f.get('questionType') || '').trim(),
    mistake,
    why: String(f.get('why') || '').trim(),
    correct: String(f.get('correct') || '').trim(),
    reviewed: false,
  });
  mistakeFilter = 'unresolved';
  commit();
  toast('Mistake added.');
}

// ---------- Resources ----------

const RESOURCES = [
  ['Official IELTS Academic sample tests', 'ielts.org', 'Sample questions for every section of the Academic test, from the test owners.', 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test'],
  ['British Council IELTS preparation', 'takeielts.britishcouncil.org', 'Free Academic practice tests and timed mock tests.', 'https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic'],
  ['BBC Learning English', 'bbc.co.uk', 'Free grammar, vocabulary, listening and pronunciation lessons.', 'https://www.bbc.co.uk/learningenglish'],
  ['IELTS Writing band descriptors (PDF)', 'ielts.org', 'The public criteria examiners use: Task Achievement / Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy.', 'https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf'],
];

function renderResources() {
  return `
    ${pageHead('Resources', 'Official and trusted free preparation material. Links open in a new tab.')}
    <ul class="grid resources">
      ${RESOURCES.map(([title, host, desc, url]) => `
        <li><a class="card resource" href="${url}" target="_blank" rel="noopener noreferrer">
          <span class="resource-title">${title} ${icon('link', 16)}</span>
          <span class="muted small">${host}</span>
          <span>${desc}</span>
        </a></li>`).join('')}
    </ul>`;
}

// ---------- Settings ----------

function renderSettings() {
  const targets = [];
  for (let v = 9; v >= 4; v -= 0.5) targets.push(`<option value="${v}" ${v === state.settings.targetBand ? 'selected' : ''}>${v.toFixed(1)}</option>`);
  return `
    ${pageHead('Settings & backup')}
    <section class="card">
      <h2 class="eyebrow">Cloud sync</h2>
      ${syncEnabled ? syncWidget() : `<p class="small muted">Cloud sync is not configured. Add your Firebase settings to <code>src/firebase-config.js</code> (see README) to save progress online.</p>`}
      <p class="small muted">When signed in, your progress is saved to your own Firestore document and kept in this browser as an offline copy. If two devices change data, the most recent change wins.</p>
    </section>

    <section class="card">
      <h2 class="eyebrow">Plan</h2>
      <form id="settings-form" class="form-grid">
        <label class="field"><span>Start date</span><input type="date" name="startDate" value="${state.settings.startDate}" required data-fid="startDate"></label>
        <label class="field"><span>Target overall band</span><select name="targetBand" data-fid="targetBand">${targets.join('')}</select></label>
      </form>
      <p class="small muted">The start date is used only to work out whether you are on schedule (6 study days per week). Tasks are never completed automatically.</p>
    </section>

    <section class="card">
      <h2 class="eyebrow">Backup</h2>
      <p class="small muted">Download a copy of everything as a JSON file, or restore one. Importing replaces your current data${syncEnabled ? ' here and in the cloud' : ''}.</p>
      <div class="task-actions">
        <button class="btn" data-action="export">${icon('download')} Export JSON backup</button>
        <label class="btn">${icon('upload')} Import backup<input type="file" accept="application/json,.json" data-action="import" class="sr-only"></label>
      </div>
      <p id="import-error" class="small tone-warn" role="alert"></p>
    </section>

    <section class="card danger-zone">
      <h2 class="eyebrow">Reset</h2>
      <p class="small muted">Start over from Day 1. You'll be asked to confirm.</p>
      <button class="btn btn-danger" data-action="reset">${icon('trash')} Reset all progress</button>
    </section>`;
}

function exportBackup() {
  const blob = new Blob([exportJSON(state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ielts-planner-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup downloaded.');
}

async function importBackup(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const errEl = document.getElementById('import-error');
  try {
    if (file.size > 5_000_000) throw new Error('The file is too large to be a planner backup.');
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error('The file is not valid JSON.');
    }
    const next = normalize(parsed);
    const summary = `${completedCount(next)} completed days, ${next.scores.length} scores and ${next.mistakes.length} mistakes`;
    if (!confirm(`Replace your current data with this backup (${summary})?`)) return;
    state = next;
    commit();
    toast('Backup imported.');
  } catch (err) {
    errEl.textContent = `Import failed: ${err.message}`;
    toast('Import failed.', 'error');
  }
}

resetDialog.querySelector('form').addEventListener('submit', (e) => {
  if (e.submitter?.value !== 'confirm') return;
  state = defaultState();
  commit();
  toast('Progress reset.');
});

async function handleSyncAction(action) {
  try {
    if (action === 'sign-in') await signIn();
    else await signOut();
  } catch (err) {
    toast(`Sign-in failed: ${err.message}`, 'error');
    render();
  }
}

document.querySelector('.sidebar').addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (t) handleSyncAction(t.dataset.action);
});

// ---------- Events ----------

main.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t || t.tagName === 'SELECT' || t.type === 'file') return;
  const { action, day, id, value } = t.dataset;
  switch (action) {
    case 'toggle-day': {
      const n = Number(day);
      setDone(state, n, !isDone(state, n));
      commit();
      break;
    }
    case 'delete-score':
      if (confirm('Delete this score?')) {
        state.scores = state.scores.filter((s) => s.id !== id);
        commit();
      }
      break;
    case 'toggle-mistake': {
      const m = state.mistakes.find((x) => x.id === id);
      if (m) m.reviewed = !m.reviewed;
      commit();
      break;
    }
    case 'delete-mistake':
      if (confirm('Delete this mistake from the journal?')) {
        state.mistakes = state.mistakes.filter((m) => m.id !== id);
        commit();
      }
      break;
    case 'mistake-filter':
      mistakeFilter = value;
      render();
      break;
    case 'export':
      exportBackup();
      break;
    case 'reset':
      resetDialog.showModal();
      break;
    case 'sign-in':
    case 'sign-out':
      handleSyncAction(action);
      break;
  }
});

main.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.action === 'import') importBackup(t);
  else if (t.dataset.action === 'mistake-skill') {
    mistakeSkill = t.value;
    render();
  } else if (t.form?.id === 'settings-form') {
    if (t.name === 'startDate' && t.value) state.settings.startDate = t.value;
    if (t.name === 'targetBand') state.settings.targetBand = band(t.value) ?? 6.5;
    commit();
    toast('Settings saved.');
  }
});

// Notes save on every keystroke without re-rendering, so typing is never interrupted.
main.addEventListener('input', (e) => {
  const day = e.target.dataset.notes;
  if (!day) return;
  setNotes(state, Number(day), e.target.value);
  saveState(state);
});

main.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'score-form') saveScore(e.target);
  if (e.target.id === 'mistake-form') saveMistake(e.target);
});

window.addEventListener('hashchange', () => {
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
});

const isTyping = () => main.contains(document.activeElement) && document.activeElement.matches('textarea, input[type="text"]');

// Pick up changes made in another tab.
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  state = loadState();
  if (!isTyping()) render();
});

render();
initSync({
  getState: () => state,
  applyRemote: (remote) => {
    state = remote;
    saveState(state, { touch: false });
    if (!isTyping()) render();
  },
  onChange: () => {
    if (!isTyping()) render();
  },
});
