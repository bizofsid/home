// Clock tab: clock in to a job, take breaks, clock out.

import { h, icon, confirmButton } from '../ui.js';
import { clockIn, clockOut, startBreak, endBreak, addJob } from '../actions.js';
import { openShift, activeJobs, jobName } from '../select.js';
import { currentBreak, workedMs, workedBetween, countBreaks } from '../shift.js';
import { breaksOwed } from '../breaks.js';
import { formatStopwatch, formatDuration, formatTime, startOfDay, startOfWeek, DAY } from '../time.js';

export function renderClock(ctx) {
  const shift = openShift(ctx.state);
  return h('section', { class: 'view clock' },
    shift ? onTheClock(ctx, shift) : offTheClock(ctx),
    totals(ctx),
  );
}

// ── off the clock ────────────────────────────────────────

const NEWEST = Symbol('newest job');
let selectedJobId = null;

function resolveSelection(jobs) {
  if (selectedJobId === NEWEST) selectedJobId = jobs.at(-1)?.id ?? null;
  if (selectedJobId != null && !jobs.some((j) => j.id === selectedJobId)) selectedJobId = jobs[0]?.id ?? null;
}

function offTheClock({ state, act, rerender }) {
  const jobs = activeJobs(state);
  resolveSelection(jobs);

  const pick = (id) => () => { selectedJobId = id; rerender(); };

  const addJobInput = h('input', { id: 'clock-new-job', placeholder: 'New job, e.g. Cheltenham hedges', enterKeyHint: 'done' });
  const createJob = (event) => {
    event.preventDefault();
    const name = addJobInput.value.trim();
    if (!name) return;
    selectedJobId = NEWEST;
    act(addJob, { name });
  };

  return h('div', { class: 'clock-panel off' },
    h('p', { class: 'eyebrow' }, 'Off the clock'),
    h('h1', { class: 'status-line' }, 'Where are you working?'),
    h('div', { class: 'job-picker', role: 'radiogroup', 'aria-label': 'Job' },
      jobs.map((job) => h('button', {
        type: 'button', role: 'radio',
        class: `job-option ${job.id === selectedJobId ? 'on' : ''}`,
        'aria-checked': String(job.id === selectedJobId),
        onClick: pick(job.id),
      }, job.name)),
      h('button', {
        type: 'button', role: 'radio',
        class: `job-option ${selectedJobId == null ? 'on' : ''}`,
        'aria-checked': String(selectedJobId == null),
        onClick: pick(null),
      }, 'No job / yard'),
    ),
    h('form', { class: 'inline-add', onSubmit: createJob }, addJobInput,
      h('button', { class: 'icon-btn', 'aria-label': 'Add job' }, icon('plus'))),
    h('button', {
      class: 'btn primary huge',
      onClick: () => act(clockIn, { jobId: selectedJobId }),
    }, 'Clock in'),
  );
}

// ── on the clock ─────────────────────────────────────────

function onTheClock({ state, act, now, onTick }, shift) {
  const onBreak = currentBreak(shift);
  const timer = h('div', { class: 'timer', 'aria-live': 'off' });
  const breakTimer = h('span', {});
  const breakHint = h('p', { class: 'hint' });

  const tick = (t) => {
    timer.textContent = formatStopwatch(workedMs(shift, t));
    if (onBreak) breakTimer.textContent = formatStopwatch(t - onBreak.start);
    breakHint.textContent = breakStatus(shift, t);
  };
  tick(now);
  onTick(tick);

  const actions = onBreak
    ? [h('button', { class: 'btn primary huge', onClick: () => act(endBreak, {}) }, 'End break')]
    : [
        h('div', { class: 'row' },
          h('button', { class: 'btn secondary', onClick: () => act(startBreak, { kind: 'rest' }) }, 'Rest break'),
          h('button', { class: 'btn secondary', onClick: () => act(startBreak, { kind: 'meal' }) }, 'Meal break'),
        ),
        confirmButton('Clock out', () => act(clockOut, {}), 'btn ink huge'),
      ];

  return h('div', { class: `clock-panel on ${onBreak ? 'paused' : ''}` },
    h('p', { class: 'eyebrow' },
      onBreak ? h('span', {}, `${onBreak.kind === 'meal' ? 'Meal' : 'Rest'} break · `, breakTimer) : 'On the clock'),
    h('h1', { class: 'status-line' }, jobName(state, shift.jobId)),
    h('p', { class: 'since' }, `Since ${formatTime(shift.start)}`),
    timer,
    breakHint,
    h('div', { class: 'actions' }, actions),
  );
}

function breakStatus(shift, now) {
  const owed = breaksOwed(now - shift.start);
  const rest = countBreaks(shift, 'rest');
  const meal = countBreaks(shift, 'meal');
  const due = [];
  if (owed.rest > rest) due.push(`${owed.rest - rest} rest`);
  if (owed.meal > meal) due.push(`${owed.meal - meal} meal`);
  return due.length ? `Break due: ${due.join(' + ')}` : `Breaks taken: ${rest} rest, ${meal} meal`;
}

// ── totals ───────────────────────────────────────────────

function totals({ state, now, onTick }) {
  const today = h('strong', {});
  const week = h('strong', {});
  const pay = h('strong', {});
  const rate = state.user?.rate;

  const tick = (t) => {
    const weekMs = workedBetween(state.shifts, startOfWeek(t), startOfWeek(t) + 7 * DAY, t);
    today.textContent = formatDuration(workedBetween(state.shifts, startOfDay(t), startOfDay(t) + DAY, t));
    week.textContent = formatDuration(weekMs);
    if (rate) pay.textContent = `$${((weekMs / 3_600_000) * rate).toFixed(2)}`;
  };
  tick(now);
  onTick(tick);

  return h('dl', { class: 'totals' },
    h('div', {}, h('dt', {}, 'Today'), h('dd', {}, today)),
    h('div', {}, h('dt', {}, 'This week'), h('dd', {}, week)),
    rate ? h('div', {}, h('dt', {}, 'Week gross'), h('dd', {}, pay)) : null,
  );
}
