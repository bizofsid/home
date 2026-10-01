// Record which gear gets used on a job: a whole set at once, or one item at a time.

import { h, stepper, toast } from '../ui.js';
import { recordUse, undoOneUse } from '../actions.js';
import { usageAtJob, usageOfGear, gearByGroup, jobName } from '../select.js';
import { formatDay } from '../time.js';

export function usedHereSection({ state, act }, jobId) {
  const rows = usageAtJob(state, jobId);

  const addSet = h('select', {
    id: `use-set-${jobId}`,
    class: 'select',
    onChange: (e) => {
      const list = state.lists.find((l) => l.id === e.target.value);
      if (!list?.items.length) return;
      act(recordUse, { jobId, items: list.items.map(({ gearId, qty }) => ({ gearId, qty })) });
      toast(`Recorded the ${list.name} set`);
    },
  },
    h('option', { value: '' }, 'Add a whole set…'),
    state.lists.filter((l) => l.items.length).map((l) => h('option', { value: l.id }, l.name)),
  );

  const addOne = h('select', {
    id: `use-one-${jobId}`,
    class: 'select',
    onChange: (e) => {
      if (!e.target.value) return;
      act(recordUse, { jobId, items: [{ gearId: e.target.value, qty: 1 }] });
    },
  },
    h('option', { value: '' }, 'Add one item…'),
    gearByGroup(state.gear).map(({ group, items }) =>
      h('optgroup', { label: group }, items.map((g) => h('option', { value: g.id }, g.name)))),
  );

  return h('section', { class: 'stack' },
    h('h3', { class: 'subhead' }, 'Gear used here'),
    h('div', { class: 'row' }, addSet, addOne),
    rows.length
      ? h('ul', { class: 'rows' }, rows.map(({ gear, qty, last }) => h('li', { class: 'qty-row in' },
          h('span', { class: 'gear-name' }, gear.name, h('small', {}, ` last ${formatDay(last)}`)),
          stepper({
            value: qty,
            label: gear.name,
            onStep: (delta) => act(delta > 0 ? recordUse : undoOneUse,
              delta > 0 ? { jobId, items: [{ gearId: gear.id, qty: 1 }] } : { jobId, gearId: gear.id }),
          }),
        )))
      : h('p', { class: 'muted' }, 'Nothing recorded on this job yet.'),
  );
}

export function usedAtSection(state, gearId) {
  const rows = usageOfGear(state, gearId);
  if (!rows.length) return null;
  return h('section', { class: 'stack' },
    h('h3', { class: 'subhead' }, 'Used on'),
    h('ul', { class: 'rows' }, rows.map(({ jobId, qty, last }) => h('li', { class: 'used-row' },
      h('span', {}, jobName(state, jobId)),
      h('span', { class: 'muted' }, `×${qty} · ${formatDay(last)}`),
    ))),
  );
}
