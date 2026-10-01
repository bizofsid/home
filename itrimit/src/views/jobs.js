// Jobs tab: the jobs he's on, which gear lists are pinned where, and moving them.

import { h, icon, openSheet, jobSelect, confirmButton, toast } from '../ui.js';
import { addJob, pinList, setJobDone, deleteJob } from '../actions.js';
import { activeJobs, listsAt, overcommitted, UTE_LABEL } from '../select.js';
import { packChecklist, progressPill } from './packing.js';
import { usedHereSection } from './usage.js';

export function renderJobs(ctx) {
  const { state } = ctx;
  const places = [{ id: null, name: UTE_LABEL }, ...activeJobs(state)];

  return h('section', { class: 'view' },
    h('header', { class: 'view-head' }, h('h1', {}, 'Jobs')),
    shortfallBanner(state),
    addJobForm(ctx),
    h('ul', { class: 'cards' }, places.map((place) => jobCard(ctx, place))),
    finishedJobs(ctx),
  );
}

function shortfallBanner(state) {
  const short = overcommitted(state);
  if (!short.length) return null;
  return h('div', { class: 'banner warn', role: 'alert' },
    h('strong', {}, 'Not enough gear for what’s pinned'),
    h('ul', {}, short.map(({ gear, pinned, owned }) => h('li', {}, `${gear.name}: ${pinned} pinned, you have ${owned}`))),
  );
}

function addJobForm({ act }) {
  const input = h('input', { id: 'jobs-new', placeholder: 'Add a job, e.g. Vauxhall Rd lawns', enterKeyHint: 'done' });
  return h('form', {
    class: 'inline-add',
    onSubmit: (event) => {
      event.preventDefault();
      const name = input.value.trim();
      if (name) act(addJob, { name });
    },
  }, input, h('button', { class: 'icon-btn', 'aria-label': 'Add job' }, icon('plus')));
}

function jobCard(ctx, place) {
  const lists = listsAt(ctx.state, place.id);
  return h('li', {},
    h('button', { class: 'card job-card', onClick: () => openJobSheet(ctx, place.id) },
      h('div', { class: 'card-top' },
        h('h2', {}, place.name),
        icon('chevron', 18),
      ),
      lists.length
        ? h('ul', { class: 'pinned' }, lists.map((list) => h('li', {}, icon('pin', 14), h('span', {}, list.name), progressPill(list))))
        : h('p', { class: 'muted' }, place.id == null ? 'Lists not pinned to a job live here.' : 'No gear pinned yet.'),
    ),
  );
}

function openJobSheet(ctx, jobId) {
  const title = jobId == null ? UTE_LABEL : ctx.state.jobs.find((j) => j.id === jobId)?.name ?? 'Job';
  openSheet(title, (close) => jobSheetBody(ctx.current(), jobId, close));
}

function jobSheetBody(ctx, jobId, close) {
  const { state, act } = ctx;
  const pinned = listsAt(state, jobId);
  const elsewhere = state.lists.filter((l) => l.jobId !== jobId);
  const jobs = activeJobs(state);

  const pinHere = h('select', {
    id: 'job-pin-list',
    class: 'select',
    onChange: (e) => {
      if (!e.target.value) return;
      act(pinList, { listId: e.target.value, jobId });
      toast('List pinned');
    },
  },
    h('option', { value: '' }, 'Pin a gear list here…'),
    elsewhere.map((l) => h('option', { value: l.id }, l.name)),
  );

  const listBlock = (list) => h('article', { class: 'list-block' },
    h('header', { class: 'list-block-head' }, h('h3', {}, list.name), progressPill(list)),
    packChecklist(ctx, list),
    h('label', { class: 'field inline' }, h('span', {}, 'Move to'),
      jobSelect({
        id: `move-${list.id}`,
        jobs,
        value: list.jobId,
        uteLabel: UTE_LABEL,
        onChange: (target) => {
          act(pinList, { listId: list.id, jobId: target });
          toast('Moved. Re-check it at the new site.');
        },
      })),
  );

  return h('div', { class: 'stack' },
    pinned.length ? pinned.map(listBlock) : h('p', { class: 'empty' }, 'Nothing pinned here.'),
    elsewhere.length ? pinHere : h('p', { class: 'muted' }, 'Make gear lists in Gear › Lists.'),
    jobId == null ? null : usedHereSection(ctx, jobId),
    jobId == null ? null : h('div', { class: 'row' },
      h('button', { class: 'btn secondary', onClick: () => { act(setJobDone, { id: jobId, done: true }); close(); toast('Job finished. Its gear is back on the ute.'); } }, 'Finish job'),
      confirmButton('Delete job', () => { act(deleteJob, { id: jobId }); close(); }),
    ),
  );
}

function finishedJobs({ state, act }) {
  const done = state.jobs.filter((j) => j.done);
  if (!done.length) return null;
  return h('details', { class: 'finished' },
    h('summary', {}, `Finished jobs (${done.length})`),
    h('ul', {}, done.map((job) => h('li', { class: 'finished-row' },
      h('span', {}, job.name),
      h('button', { class: 'link', onClick: () => act(setJobDone, { id: job.id, done: false }) }, 'Reopen'),
    ))),
  );
}
