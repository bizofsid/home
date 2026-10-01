// App shell: wires the store to the views, the tab bar and the one-second tick.

import { createStore } from './store.js';
import { h, icon, renderSheet } from './ui.js';
import { renderSetup } from './views/setup.js';
import { renderClock } from './views/clock.js';
import { renderJobs } from './views/jobs.js';
import { renderGear } from './views/gear.js';
import { renderLog } from './views/log.js';
import { openProfile } from './views/profile.js';

const TABS = [
  { id: 'clock', label: 'Clock', icon: 'clock', render: renderClock },
  { id: 'jobs', label: 'Jobs', icon: 'jobs', render: renderJobs },
  { id: 'gear', label: 'Gear', icon: 'gear', render: renderGear },
  { id: 'log', label: 'Log', icon: 'log', render: renderLog },
];

export function startApp(root) {
  const store = createStore();
  let activeTab = TABS.find((t) => `#${t.id}` === location.hash)?.id ?? 'clock';
  let tickers = [];

  /** Everything a view needs. Built fresh so sheets always see current state. */
  const makeContext = () => ({
    state: store.get(),
    now: Date.now(),
    act: (transition, args = {}) => store.apply(transition, { ...args, now: Date.now() }),
    rerender: render,
    current: makeContext,
    onTick: (fn) => tickers.push(fn),
  });

  function render() {
    tickers = [];
    const ctx = makeContext();
    if (!ctx.state.user) {
      root.replaceChildren(h('main', { class: 'screen setup-screen' }, renderSetup(ctx)));
      return;
    }
    const tab = TABS.find((t) => t.id === activeTab);
    const main = h('main', { class: 'screen', id: 'screen' }, tab.render(ctx));
    const scroll = root.querySelector('#screen')?.scrollTop ?? 0;
    root.replaceChildren(topBar(ctx), main, tabBar());
    main.scrollTop = scroll;
  }

  function topBar(ctx) {
    return h('header', { class: 'topbar' },
      h('div', { class: 'wordmark small' }, 'iTrim', h('span', {}, 'It')),
      h('button', { class: 'avatar', 'aria-label': 'Profile and backup', onClick: () => openProfile(ctx) },
        ctx.state.user.name.slice(0, 1).toUpperCase()),
    );
  }

  function tabBar() {
    return h('nav', { class: 'tabbar', 'aria-label': 'Sections' }, TABS.map((tab) => h('button', {
      class: `tab ${tab.id === activeTab ? 'on' : ''}`,
      'aria-current': tab.id === activeTab ? 'page' : null,
      onClick: () => {
        activeTab = tab.id;
        try { history.replaceState(null, '', `#${tab.id}`); } catch { /* sandboxed frame */ }
        render();
        root.querySelector('#screen')?.scrollTo(0, 0);
      },
    }, icon(tab.icon, 24), h('span', {}, tab.label))));
  }

  store.subscribe(() => {
    render();
    renderSheet();
  });
  setInterval(() => {
    const now = Date.now();
    tickers.forEach((tick) => tick(now));
  }, 1000);
  render();
}
