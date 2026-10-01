// Tiny DOM toolkit: element builder, bottom sheet, toast, two-tap confirm.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key in el && typeof value !== 'string') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

const ICON_PATHS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  jobs: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  gear: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  log: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pin: '<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
};

export function icon(name, size = 22) {
  const span = h('span', { class: 'icon', 'aria-hidden': 'true' });
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
  return span;
}

// ── bottom sheet ─────────────────────────────────────────

let activeSheet = null;

/** Open a sheet. `build(close)` returns its body; call `close()` to dismiss. */
export function openSheet(title, build) {
  closeSheet();
  const close = () => closeSheet();
  const body = h('div', { class: 'sheet-body' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', { class: 'sheet-head' },
      h('h2', {}, title),
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: close }, icon('close')),
    ),
    body,
  );
  const backdrop = h('div', { class: 'backdrop', onClick: (e) => e.target === backdrop && close() }, sheet);
  activeSheet = { backdrop, body, build, close };
  renderSheet();
  document.body.append(backdrop);
  return close;
}

/** Re-run the open sheet's builder so it reflects new state. */
export function renderSheet() {
  if (!activeSheet) return;
  const scroll = activeSheet.body.scrollTop;
  activeSheet.body.replaceChildren(activeSheet.build(activeSheet.close));
  activeSheet.body.scrollTop = scroll;
}

export function closeSheet() {
  activeSheet?.backdrop.remove();
  activeSheet = null;
}

// ── toast ────────────────────────────────────────────────

export function toast(message) {
  const el = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), 2400);
}

// ── two-tap confirm (the viewer blocks confirm()) ────────

export function confirmButton(label, onConfirm, className = 'btn danger') {
  let armed = false;
  const button = h('button', {
    type: 'button', // never submit a surrounding form
    class: className,
    onClick: () => {
      if (armed) return onConfirm();
      armed = true;
      button.textContent = 'Tap again to confirm';
      setTimeout(() => {
        armed = false;
        button.textContent = label;
      }, 3000);
    },
  }, label);
  return button;
}

/** Older copy route for WebViews that refuse the async clipboard. */
function copyWithSelection(text) {
  const area = h('textarea', { readonly: true, class: 'offscreen' }, text);
  document.body.append(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  return copied;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied');
  } catch {
    toast(copyWithSelection(text) ? 'Copied' : 'Copy is blocked on this device.');
  }
}

// ── shared controls ──────────────────────────────────────

/** − value + control. `onStep(delta)` is called; the caller owns the value. */
export function stepper({ value, label, onStep, min = 0, max = Infinity }) {
  return h('div', { class: 'stepper', role: 'group', 'aria-label': label },
    h('button', { class: 'step', type: 'button', 'aria-label': `Fewer ${label}`, disabled: value <= min, onClick: () => onStep(-1) }, icon('minus', 18)),
    h('output', { class: 'step-value' }, value),
    h('button', { class: 'step', type: 'button', 'aria-label': `More ${label}`, disabled: value >= max, onClick: () => onStep(1) }, icon('plus', 18)),
  );
}

/** <select> of the ute plus every active job. */
export function jobSelect({ id, jobs, value, onChange, uteLabel }) {
  return h('select', { id, class: 'select', onChange: (e) => onChange(e.target.value || null) },
    h('option', { value: '', selected: value == null }, uteLabel),
    jobs.map((job) => h('option', { value: job.id, selected: job.id === value }, job.name)),
  );
}

/** "1 item", "3 items" */
export function counted(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function pill(text, tone = '') {
  return h('span', { class: `pill ${tone}` }, text);
}
