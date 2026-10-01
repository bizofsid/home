// Gear tab: gear under subheadings with maintenance notes, and gear lists (kits).

import { h, icon, openSheet, stepper, confirmButton, pill, counted, jobSelect, toast } from '../ui.js';
import {
  addGear, updateGear, deleteGear, checkGear, addGearNote, deleteGearNote,
  addList, renameList, deleteList, setListItemQty, pinList, addBit, setBitQty,
} from '../actions.js';
import { gearByGroup, groupNames, bitNames, hasOpenFault, activeJobs, jobName, UTE_LABEL } from '../select.js';
import { isSameDay, formatDay, formatTime } from '../time.js';
import { packChecklist, progressPill } from './packing.js';
import { usedAtSection } from './usage.js';

const NOTE_KINDS = [
  { kind: 'note', label: 'Note' },
  { kind: 'service', label: 'Serviced' },
  { kind: 'fault', label: 'Fault' },
  { kind: 'fixed', label: 'Fixed' },
];

let mode = 'gear'; // 'gear' | 'lists'

export function renderGear(ctx) {
  const switchTo = (next) => () => { mode = next; ctx.rerender(); };
  return h('section', { class: 'view' },
    h('header', { class: 'view-head' },
      h('h1', {}, 'Gear'),
      h('div', { class: 'segmented', role: 'tablist' },
        h('button', { role: 'tab', 'aria-selected': String(mode === 'gear'), onClick: switchTo('gear') }, 'All gear'),
        h('button', { role: 'tab', 'aria-selected': String(mode === 'lists'), onClick: switchTo('lists') }, 'Lists'),
      ),
    ),
    mode === 'gear' ? gearPanel(ctx) : listsPanel(ctx),
  );
}

// ── all gear ─────────────────────────────────────────────

function gearPanel(ctx) {
  const groups = gearByGroup(ctx.state.gear);
  return h('div', { class: 'stack' },
    h('button', { class: 'btn secondary', onClick: () => openAddGear(ctx) }, icon('plus', 18), 'Add gear'),
    groups.length ? null : h('p', { class: 'empty' }, 'No gear yet. Add your first item.'),
    groups.map(({ group, items }) => h('section', { class: 'group' },
      h('h2', { class: 'subhead' }, group, h('span', { class: 'count' }, items.length)),
      h('ul', { class: 'rows' }, items.map((gear) => gearRow(ctx, gear))),
    )),
  );
}

function gearRow(ctx, gear) {
  const checkedToday = gear.checkedAt && isSameDay(gear.checkedAt, ctx.now);
  return h('li', { class: 'gear-row' },
    h('button', { class: 'gear-main', onClick: () => openGearSheet(ctx, gear.id) },
      h('span', { class: 'gear-name' }, gear.name),
      h('span', { class: 'gear-meta' },
        gear.qty > 1 ? h('span', { class: 'qty' }, `×${gear.qty}`) : null,
        gear.bits.length ? h('span', { class: 'bit-count' }, `+${counted(gear.bits.length, 'bit')}`) : null,
        hasOpenFault(gear) ? pill('Fault', 'bad') : null,
      ),
    ),
    h('button', {
      class: `check-btn ${checkedToday ? 'on' : ''}`,
      'aria-pressed': String(Boolean(checkedToday)),
      'aria-label': checkedToday ? `${gear.name} checked today` : `Pre-start check ${gear.name}`,
      onClick: () => ctx.act(checkGear, { id: gear.id }),
    }, icon('check', 18), checkedToday ? 'Checked' : 'Check'),
  );
}

function groupInput(state, id, value = '') {
  const listId = `${id}-groups`;
  return [
    h('input', { id, name: 'group', list: listId, value, placeholder: 'e.g. Mowers', required: true }),
    h('datalist', { id: listId }, groupNames(state).map((g) => h('option', { value: g }))),
  ];
}

function openAddGear(ctx) {
  openSheet('Add gear', (close) => {
    const { state, act } = ctx.current();
    return h('form', {
      class: 'stack',
      onSubmit: (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        act(addGear, {
          name: String(form.get('name')).trim(),
          group: String(form.get('group')).trim(),
          qty: Math.max(1, Number(form.get('qty')) || 1),
        });
        close();
        toast('Gear added');
      },
    },
      h('label', { class: 'field' }, h('span', {}, 'Name'), h('input', { id: 'gear-name', name: 'name', required: true, placeholder: 'e.g. Stihl FS 91' })),
      h('label', { class: 'field' }, h('span', {}, 'Subheading'), groupInput(state, 'gear-group')),
      h('label', { class: 'field' }, h('span', {}, 'How many you have'), h('input', { id: 'gear-qty', name: 'qty', type: 'number', min: '1', value: '1', inputMode: 'numeric' })),
      h('button', { class: 'btn primary big', type: 'submit' }, 'Add gear'),
    );
  });
}

function openGearSheet(ctx, gearId) {
  const gear = ctx.state.gear.find((g) => g.id === gearId);
  openSheet(gear.name, (close) => gearSheetBody(ctx.current(), gearId, close));
}

function gearSheetBody({ state, act, now }, gearId, close) {
  const gear = state.gear.find((g) => g.id === gearId);
  if (!gear) return h('p', { class: 'empty' }, 'This gear was removed.');

  let kind = 'note';
  const kindButtons = NOTE_KINDS.map((k) => h('button', {
    type: 'button',
    class: `chip ${k.kind === kind ? 'on' : ''}`,
    'data-kind': k.kind,
    onClick: (e) => {
      kind = k.kind;
      kindButtons.forEach((b) => b.classList.toggle('on', b === e.currentTarget));
    },
  }, k.label));

  const noteInput = h('textarea', { id: `note-${gear.id}`, rows: 2, placeholder: 'e.g. New blade fitted, sharpened chain, pull cord fraying' });
  const addNote = (event) => {
    event.preventDefault();
    const text = noteInput.value.trim();
    if (!text) return;
    act(addGearNote, { id: gear.id, kind, text });
  };

  return h('div', { class: 'stack' },
    h('div', { class: 'row spread' },
      h('label', { class: 'field inline' }, h('span', {}, 'You have'),
        stepper({ value: gear.qty, min: 1, label: gear.name, onStep: (d) => act(updateGear, { id: gear.id, changes: { qty: gear.qty + d } }) })),
      h('button', { class: 'btn secondary', onClick: () => act(checkGear, { id: gear.id }) },
        gear.checkedAt && isSameDay(gear.checkedAt, now) ? 'Checked today' : 'Pre-start check'),
    ),
    h('label', { class: 'field' }, h('span', {}, 'Subheading'),
      groupInput(state, `group-${gear.id}`, gear.group).map((el) => {
        if (el.tagName === 'INPUT') el.addEventListener('change', () => act(updateGear, { id: gear.id, changes: { group: el.value.trim() || 'Other' } }));
        return el;
      })),
    bitsSection({ state, act }, gear),
    h('form', { class: 'note-form', onSubmit: addNote },
      h('span', { class: 'label' }, 'Maintenance notes'),
      h('div', { class: 'chips' }, kindButtons),
      noteInput,
      h('button', { class: 'btn primary', type: 'submit' }, 'Add note'),
    ),
    gear.notes.length
      ? h('ol', { class: 'timeline' }, gear.notes.map((note) => h('li', { class: `note ${note.kind}` },
          h('div', { class: 'note-head' },
            pill(NOTE_KINDS.find((k) => k.kind === note.kind)?.label ?? note.kind, toneFor(note.kind)),
            h('time', {}, `${formatDay(note.at)}, ${formatTime(note.at)}`),
            h('button', { class: 'link', 'aria-label': 'Delete note', onClick: () => act(deleteGearNote, { gearId: gear.id, noteId: note.id }) }, icon('close', 16)),
          ),
          h('p', {}, note.text),
        )))
      : h('p', { class: 'muted' }, 'No notes yet.'),
    usedAtSection(state, gear.id),
    confirmButton('Remove this gear', () => { act(deleteGear, { id: gear.id }); close(); }),
  );
}

// ── bits & spares ────────────────────────────────────────

function bitsSection({ state, act }, gear) {
  const inputId = `bit-name-${gear.id}`;
  const nameInput = h('input', {
    id: inputId, list: 'bit-names', autocomplete: 'off', enterKeyHint: 'done',
    placeholder: 'e.g. Trimmer line, spark plug',
  });
  const add = (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    act(addBit, { gearId: gear.id, name, qty: 1 });
    document.getElementById(inputId)?.focus(); // the sheet re-rendered: keep typing the next one
  };

  return h('section', { class: 'stack' },
    h('h3', { class: 'subhead' }, 'Bits & spares'),
    gear.bits.length
      ? h('ul', { class: 'rows' }, gear.bits.map((bit) => h('li', { class: 'qty-row in' },
          h('span', { class: 'gear-name' }, bit.name),
          stepper({ value: bit.qty, label: bit.name, onStep: (d) => act(setBitQty, { gearId: gear.id, bitId: bit.id, qty: bit.qty + d }) }),
        )))
      : h('p', { class: 'muted' }, 'The small stuff this needs: line, plugs, spare blades, files.'),
    h('form', { class: 'inline-add', onSubmit: add }, nameInput,
      h('button', { class: 'icon-btn', 'aria-label': 'Add bit' }, icon('plus'))),
    h('datalist', { id: 'bit-names' }, bitNames(state).map((name) => h('option', { value: name }))),
  );
}

function toneFor(kind) {
  return { fault: 'bad', fixed: 'good', service: 'good' }[kind] ?? 'muted';
}

// ── lists ────────────────────────────────────────────────

function listsPanel(ctx) {
  const { state, act } = ctx;
  const input = h('input', { id: 'list-new', placeholder: 'New list, e.g. Hedge day', enterKeyHint: 'done' });
  const create = (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    act(addList, { name });
    openListSheet(ctx, ctx.current().state.lists.at(-1).id);
  };

  return h('div', { class: 'stack' },
    h('form', { class: 'inline-add', onSubmit: create }, input, h('button', { class: 'icon-btn', 'aria-label': 'Create list' }, icon('plus'))),
    state.lists.length
      ? h('ul', { class: 'cards' }, state.lists.map((list) => h('li', {},
          h('button', { class: 'card list-card', onClick: () => openListSheet(ctx, list.id) },
            h('div', { class: 'card-top' }, h('h2', {}, list.name), progressPill(list)),
            h('p', { class: 'muted' }, icon('pin', 14), ` ${jobName(state, list.jobId)} · ${counted(list.items.length, 'item')}`),
          ))))
      : h('p', { class: 'empty' }, 'A list is a kit for a kind of job. Make one, set quantities, then pin it to a job.'),
  );
}

function openListSheet(ctx, listId) {
  const list = ctx.current().state.lists.find((l) => l.id === listId);
  openSheet(list.name, (close) => listSheetBody(ctx.current(), listId, close));
}

function listSheetBody(ctx, listId, close) {
  const { state, act } = ctx;
  const list = state.lists.find((l) => l.id === listId);
  if (!list) return h('p', { class: 'empty' }, 'This list was deleted.');
  const qtyIn = (gearId) => list.items.find((i) => i.gearId === gearId)?.qty ?? 0;

  return h('div', { class: 'stack' },
    h('label', { class: 'field' }, h('span', {}, 'List name'),
      h('input', { id: `list-name-${list.id}`, value: list.name, onChange: (e) => act(renameList, { id: list.id, name: e.target.value.trim() || list.name }) })),
    h('label', { class: 'field' }, h('span', {}, 'Pinned to'),
      jobSelect({ id: `list-pin-${list.id}`, jobs: activeJobs(state), value: list.jobId, uteLabel: UTE_LABEL,
        onChange: (jobId) => { act(pinList, { listId: list.id, jobId }); toast('Pinned'); } })),
    h('section', {},
      h('h3', { class: 'subhead' }, 'Pack check'),
      packChecklist(ctx, list),
    ),
    h('section', {},
      h('h3', { class: 'subhead' }, 'What goes in it'),
      gearByGroup(state.gear).map(({ group, items }) => h('div', { class: 'group' },
        h('h4', { class: 'minihead' }, group),
        h('ul', { class: 'rows' }, items.map((gear) => {
          const qty = qtyIn(gear.id);
          return h('li', { class: `qty-row ${qty ? 'in' : ''}` },
            h('span', { class: 'gear-name' }, gear.name, h('small', {}, ` you have ${gear.qty}`)),
            stepper({ value: qty, label: gear.name, onStep: (d) => act(setListItemQty, { listId: list.id, gearId: gear.id, qty: qty + d }) }),
          );
        })),
      )),
    ),
    confirmButton('Delete list', () => { act(deleteList, { id: list.id }); close(); }),
  );
}
