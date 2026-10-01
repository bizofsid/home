// Pack-check a gear list: count each item onto the ute, see what's missing.
// Shared by the Jobs tab and the Gear › Lists sheet.

import { h, icon, stepper, pill } from '../ui.js';
import { countPacked, packAll } from '../actions.js';
import { gearById, listProgress, bitsSummary } from '../select.js';

export function progressPill(list) {
  const { needed, packed, complete } = listProgress(list);
  if (needed === 0) return pill('Empty', 'muted');
  return pill(complete ? 'All packed' : `${packed}/${needed} packed`, complete ? 'good' : 'warn');
}

/** Gear name, with its bits underneath so the small stuff gets packed too. */
function packLabel(gear) {
  return h('span', { class: 'pack-label' },
    gear.name,
    gear.bits.length ? h('small', {}, `with ${bitsSummary(gear)}`) : null,
  );
}

export function packChecklist({ state, act }, list) {
  if (list.items.length === 0) {
    return h('p', { class: 'empty' }, 'No gear in this list yet. Add items from Gear › Lists.');
  }

  const rows = list.items.map((item) => {
    const gear = gearById(state, item.gearId);
    if (!gear) return null;
    const done = item.packed === item.qty;
    return h('li', { class: `pack-row ${done ? 'done' : ''}` },
      h('button', {
        type: 'button',
        class: 'pack-name',
        'aria-label': `Mark all ${gear.name} packed`,
        onClick: () => act(countPacked, { listId: list.id, gearId: gear.id, delta: item.qty }),
      }, h('span', { class: 'tick' }, done ? icon('check', 16) : null), packLabel(gear)),
      h('span', { class: 'pack-of' }, `of ${item.qty}`),
      stepper({
        value: item.packed,
        max: item.qty,
        label: gear.name,
        onStep: (delta) => act(countPacked, { listId: list.id, gearId: gear.id, delta }),
      }),
    );
  });

  return h('div', { class: 'pack' },
    h('ul', { class: 'pack-list' }, rows),
    listProgress(list).complete
      ? null
      : h('button', { class: 'btn secondary', onClick: () => act(packAll, { listId: list.id }) }, 'Everything’s packed'),
  );
}
