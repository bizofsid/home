// First run: create the user and pick starter gear.

import { h } from '../ui.js';
import { createUser } from '../actions.js';

const STARTER_GEAR = [
  { name: 'Push mower', group: 'Mowers', qty: 1 },
  { name: 'Ride-on mower', group: 'Mowers', qty: 1 },
  { name: 'Line trimmer', group: 'Trimmers & cutters', qty: 1 },
  { name: 'Hedge trimmer', group: 'Trimmers & cutters', qty: 1 },
  { name: 'Leaf blower', group: 'Blowers', qty: 1 },
  { name: 'Rake', group: 'Hand tools', qty: 2 },
  { name: 'Secateurs', group: 'Hand tools', qty: 1 },
  { name: 'Green waste bags', group: 'Consumables', qty: 6 },
  { name: 'Fuel can', group: 'Consumables', qty: 1 },
  { name: 'Ear muffs', group: 'Safety gear', qty: 1 },
  { name: 'Safety glasses', group: 'Safety gear', qty: 1 },
];

export function renderSetup({ act }) {
  const picked = new Set(STARTER_GEAR.map((g) => g.name));

  const chip = (gear) => {
    const button = h('button', {
      type: 'button',
      class: 'chip on',
      'aria-pressed': 'true',
      onClick: () => {
        const on = !picked.has(gear.name);
        on ? picked.add(gear.name) : picked.delete(gear.name);
        button.classList.toggle('on', on);
        button.setAttribute('aria-pressed', String(on));
      },
    }, gear.name);
    return button;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = String(form.get('name')).trim();
    if (!name) return;
    act(createUser, {
      name,
      employer: String(form.get('employer')).trim(),
      rate: Number(form.get('rate')) || null,
      starterGear: STARTER_GEAR.filter((g) => picked.has(g.name)),
    });
  };

  return h('form', { class: 'setup', onSubmit },
    h('div', { class: 'setup-brand' },
      h('div', { class: 'wordmark' }, 'iTrim', h('span', {}, 'It')),
      h('p', { class: 'lede' }, 'Your hours, your gear, your jobs. Stays on this phone.'),
    ),
    h('label', { class: 'field' }, h('span', {}, 'Your name'),
      h('input', { id: 'setup-name', name: 'name', required: true, autocomplete: 'given-name', placeholder: 'e.g. Tane' })),
    h('label', { class: 'field' }, h('span', {}, 'Who you work for ', h('em', {}, 'optional')),
      h('input', { id: 'setup-employer', name: 'employer', placeholder: 'e.g. North Shore Gardens' })),
    h('label', { class: 'field' }, h('span', {}, 'Hourly rate ', h('em', {}, 'optional, for checking your pay')),
      h('input', { id: 'setup-rate', name: 'rate', type: 'number', inputMode: 'decimal', step: '0.01', min: '0', placeholder: '$ per hour' })),
    h('fieldset', { class: 'field' },
      h('legend', {}, 'Gear you use. Tap to remove. You can edit later.'),
      h('div', { class: 'chips' }, STARTER_GEAR.map(chip)),
    ),
    h('button', { class: 'btn primary big', type: 'submit' }, 'Create my profile'),
  );
}
