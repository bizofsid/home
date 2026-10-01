// Profile sheet: edit details, back up and restore data, start over.

import { h, openSheet, confirmButton, copyText, toast } from '../ui.js';
import { updateUser, replaceAll } from '../actions.js';
import { EMPTY_STATE, isBackup } from '../store.js';

export function openProfile(ctx) {
  openSheet('Profile', (close) => profileBody(ctx.current(), close));
}

function profileBody({ state, act }, close) {
  const { user } = state;

  const save = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    act(updateUser, {
      name: String(form.get('name')).trim() || user.name,
      employer: String(form.get('employer')).trim(),
      rate: Number(form.get('rate')) || null,
    });
    toast('Saved');
  };

  const restoreInput = h('textarea', { id: 'restore-json', rows: 3, placeholder: 'Paste a backup here' });
  const restore = () => {
    try {
      const data = JSON.parse(restoreInput.value);
      if (!isBackup(data)) throw new Error('shape');
      close(); // first: this sheet can't render while the state is swapped out
      act(replaceAll, { next: data });
      toast('Backup restored');
    } catch {
      toast('That isn’t an iTrimIt backup. Paste the whole copied text.');
    }
  };

  return h('div', { class: 'stack' },
    h('form', { class: 'stack', onSubmit: save },
      h('label', { class: 'field' }, h('span', {}, 'Name'), h('input', { id: 'profile-name', name: 'name', value: user.name })),
      h('label', { class: 'field' }, h('span', {}, 'Who you work for'), h('input', { id: 'profile-employer', name: 'employer', value: user.employer ?? '' })),
      h('label', { class: 'field' }, h('span', {}, 'Hourly rate'), h('input', { id: 'profile-rate', name: 'rate', type: 'number', step: '0.01', min: '0', inputMode: 'decimal', value: user.rate ?? '' })),
      h('button', { class: 'btn primary', type: 'submit' }, 'Save details'),
    ),
    h('section', { class: 'stack' },
      h('h3', { class: 'subhead' }, 'Backup'),
      h('p', { class: 'muted' }, 'Everything lives on this phone only. Copy a backup now and then, and keep it somewhere safe, like a message to yourself.'),
      h('button', { class: 'btn secondary', onClick: () => copyText(JSON.stringify(state)) }, 'Copy backup'),
      restoreInput,
      h('button', { class: 'btn secondary', onClick: restore }, 'Restore from backup'),
    ),
    confirmButton('Erase everything', () => { close(); act(replaceAll, { next: EMPTY_STATE }); }),
  );
}
