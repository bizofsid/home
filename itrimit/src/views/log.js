// Log tab: past shifts by week, with totals to check against a payslip.

import { h, openSheet, confirmButton, copyText, toast } from '../ui.js';
import { updateShift, deleteShift } from '../actions.js';
import { jobName } from '../select.js';
import { workedMs, breakMs } from '../shift.js';
import { formatDay, formatTime, formatDuration, formatHours, startOfWeek, toTimeInput, withTime, HOUR } from '../time.js';

export function renderLog(ctx) {
  const weeks = groupByWeek(ctx.state.shifts);
  return h('section', { class: 'view' },
    h('header', { class: 'view-head' }, h('h1', {}, 'Log')),
    weeks.length
      ? weeks.map((week) => weekBlock(ctx, week))
      : h('p', { class: 'empty' }, 'Shifts show up here after you clock in.'),
  );
}

function groupByWeek(shifts) {
  const weeks = new Map();
  for (const shift of [...shifts].sort((a, b) => b.start - a.start)) {
    const key = startOfWeek(shift.start);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(shift);
  }
  return [...weeks.entries()].map(([weekStart, list]) => ({ weekStart, shifts: list }));
}

function weekBlock(ctx, { weekStart, shifts }) {
  const { state, now } = ctx;
  const total = shifts.reduce((sum, s) => sum + workedMs(s, now), 0);
  const rate = state.user?.rate;

  return h('section', { class: 'week' },
    h('header', { class: 'week-head' },
      h('div', {},
        h('h2', {}, `Week of ${formatDay(weekStart)}`),
        h('p', { class: 'week-total' },
          h('strong', {}, formatDuration(total)),
          rate ? ` · $${((total / HOUR) * rate).toFixed(2)} gross` : null),
      ),
      h('button', { class: 'btn secondary small', onClick: () => copyText(weekSummary(state, weekStart, shifts, now)) }, 'Copy week'),
    ),
    h('ul', { class: 'rows' }, shifts.map((shift) => h('li', {},
      h('button', { class: 'shift-row', onClick: () => openShiftSheet(ctx, shift.id) },
        h('span', { class: 'shift-day' }, formatDay(shift.start)),
        h('span', { class: 'shift-site' }, shift.site || jobName(state, shift.jobId)),
        h('span', { class: 'shift-span' }, `${formatTime(shift.start)}–${shift.end ? formatTime(shift.end) : 'now'}`),
        h('strong', { class: 'shift-hours' }, formatDuration(workedMs(shift, now))),
      ),
    ))),
  );
}

function weekSummary(state, weekStart, shifts, now) {
  const lines = [...shifts].sort((a, b) => a.start - b.start).map((s) =>
    `${formatDay(s.start)}  ${formatTime(s.start)}–${s.end ? formatTime(s.end) : 'now'}  ` +
    `${formatHours(workedMs(s, now))} h  (breaks ${formatDuration(breakMs(s, now))})  ${s.site || jobName(state, s.jobId)}`);
  const total = shifts.reduce((sum, s) => sum + workedMs(s, now), 0);
  return [`${state.user?.name ?? ''}: week of ${formatDay(weekStart)}`, ...lines, `Total: ${formatHours(total)} h`].join('\n');
}

function openShiftSheet(ctx, shiftId) {
  openSheet('Edit shift', (close) => shiftSheetBody(ctx.current(), shiftId, close));
}

function shiftSheetBody({ state, act, now }, shiftId, close) {
  const shift = state.shifts.find((s) => s.id === shiftId);
  if (!shift) return h('p', { class: 'empty' }, 'This shift was deleted.');

  const save = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const start = withTime(shift.start, String(form.get('start')));
    const endValue = String(form.get('end') ?? '');
    let end = shift.end && endValue ? withTime(shift.start, endValue) : shift.end;
    if (end != null && end <= start) end += 24 * HOUR; // finished after midnight
    act(updateShift, { id: shift.id, changes: { start, end, site: String(form.get('site')).trim(), note: String(form.get('note')).trim() } });
    close();
    toast('Shift saved');
  };

  return h('form', { class: 'stack', onSubmit: save },
    h('p', { class: 'muted' }, `${formatDay(shift.start)} · ${formatDuration(workedMs(shift, now))} worked, ${formatDuration(breakMs(shift, now))} on breaks`),
    h('div', { class: 'row' },
      h('label', { class: 'field' }, h('span', {}, 'Start'), h('input', { id: 'shift-start', name: 'start', type: 'time', value: toTimeInput(shift.start), required: true })),
      shift.end
        ? h('label', { class: 'field' }, h('span', {}, 'Finish'), h('input', { id: 'shift-end', name: 'end', type: 'time', value: toTimeInput(shift.end), required: true }))
        : h('p', { class: 'field muted' }, 'Still on the clock'),
    ),
    h('label', { class: 'field' }, h('span', {}, 'Job'), h('input', { id: 'shift-site', name: 'site', value: shift.site || jobName(state, shift.jobId) })),
    h('label', { class: 'field' }, h('span', {}, 'Note'), h('textarea', { id: 'shift-note', name: 'note', rows: 2, placeholder: 'Anything to remember about this day' }, shift.note)),
    h('button', { class: 'btn primary big', type: 'submit' }, 'Save'),
    confirmButton('Delete shift', () => { act(deleteShift, { id: shift.id }); close(); }),
  );
}
