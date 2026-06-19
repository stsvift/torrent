const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  torrents: [],
  view: 'all',
  query: '',
  sort: 'added'
};

const viewLabels = {
  all: 'All torrents',
  downloading: 'Downloading',
  completed: 'Completed',
  paused: 'Paused'
};

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatSpeed(bytes = 0) {
  return `${formatBytes(bytes)}/s`;
}

function formatTime(ms = 0) {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.remove('hidden');
  setTimeout(() => node.classList.add('hidden'), 4200);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function getStatus(torrent) {
  if (torrent.done) return 'Completed';
  if (torrent.paused) return 'Paused';
  if (!torrent.length) return 'Fetching metadata';
  return 'Downloading';
}

function matchesView(torrent) {
  if (state.view === 'completed') return torrent.done;
  if (state.view === 'paused') return torrent.paused;
  if (state.view === 'downloading') return !torrent.done && !torrent.paused;
  return true;
}

function filteredTorrents() {
  const query = state.query.toLowerCase();
  const visible = state.torrents.filter((torrent) => {
    const matchesQuery = !query || torrent.name.toLowerCase().includes(query) || torrent.id.toLowerCase().includes(query);
    return matchesView(torrent) && matchesQuery;
  });

  return visible.sort((a, b) => {
    if (state.sort === 'name') return a.name.localeCompare(b.name);
    if (state.sort === 'progress') return b.progress - a.progress;
    if (state.sort === 'speed') return b.downloadSpeed - a.downloadSpeed;
    if (state.sort === 'size') return b.length - a.length;
    return 0;
  });
}

function renderCounts() {
  $('#countAll').textContent = state.torrents.length;
  $('#countDownloading').textContent = state.torrents.filter((torrent) => !torrent.done && !torrent.paused).length;
  $('#countCompleted').textContent = state.torrents.filter((torrent) => torrent.done).length;
  $('#countPaused').textContent = state.torrents.filter((torrent) => torrent.paused).length;
}

function renderStats(visible) {
  const totals = state.torrents.reduce((acc, torrent) => {
    acc.downloaded += torrent.downloaded;
    acc.down += torrent.downloadSpeed;
    acc.up += torrent.uploadSpeed;
    return acc;
  }, { downloaded: 0, down: 0, up: 0 });

  $('#activeCount').textContent = state.torrents.length;
  $('#downloadedTotal').textContent = formatBytes(totals.downloaded);
  $('#downSpeed').textContent = formatSpeed(totals.down);
  $('#upSpeed').textContent = formatSpeed(totals.up);
  $('#viewTitle').textContent = viewLabels[state.view];
  $('#statusText').textContent = `${visible.length} shown · ${state.torrents.length} total`;
  renderCounts();
}

function torrentCard(torrent) {
  const percent = Math.round((torrent.progress || 0) * 1000) / 10;
  const files = torrent.files?.length ? `${torrent.files.length} file(s)` : 'Metadata pending';

  return `
    <article class="torrent-card" data-id="${torrent.id}">
      <div class="torrent-top">
        <div>
          <div class="torrent-name">${escapeHtml(torrent.name)}</div>
          <div class="torrent-meta">${getStatus(torrent)} · ${files} · ${formatBytes(torrent.length)} · ratio ${torrent.ratio.toFixed(2)}</div>
        </div>
        <div class="actions">
          <button data-action="toggle">${torrent.paused ? 'Resume' : 'Pause'}</button>
          <button data-action="reveal">Reveal</button>
          <button data-action="copy">Copy magnet</button>
          <button class="remove" data-action="remove">Remove</button>
        </div>
      </div>
      <div class="progress"><span style="width: ${percent}%"></span></div>
      <div class="torrent-stats">
        <span>Progress<strong>${percent}%</strong></span>
        <span>Down<strong>${formatSpeed(torrent.downloadSpeed)}</strong></span>
        <span>Up<strong>${formatSpeed(torrent.uploadSpeed)}</strong></span>
        <span>Peers<strong>${torrent.numPeers}</strong></span>
        <span>ETA<strong>${formatTime(torrent.timeRemaining)}</strong></span>
        <span>Hash<strong>${torrent.id.slice(0, 8)}</strong></span>
      </div>
    </article>
  `;
}

function render() {
  const visible = filteredTorrents();
  const list = $('#torrentList');
  list.classList.toggle('empty', visible.length === 0);
  list.innerHTML = visible.map(torrentCard).join('');
  renderStats(visible);
}

async function addTorrent() {
  const input = $('#torrentInput');
  try {
    await window.emberTorrent.add(input.value);
    input.value = '';
    toast('Torrent added to the queue.');
  } catch (error) {
    toast(error.message);
  }
}

function selectedTorrent(id) {
  return state.torrents.find((torrent) => torrent.id === id);
}

async function toggleVisible(paused) {
  const visible = filteredTorrents().filter((torrent) => torrent.paused !== paused);
  await Promise.all(visible.map((torrent) => window.emberTorrent.togglePause(torrent.id)));
  toast(`${paused ? 'Paused' : 'Resumed'} ${visible.length} torrent(s).`);
}

$('.menu').addEventListener('click', (event) => {
  const item = event.target.closest('.nav-item[data-view]');
  if (!item) return;
  state.view = item.dataset.view;
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button === item));
  render();
});
$('#addTorrent').addEventListener('click', addTorrent);
$('#torrentInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addTorrent();
});
$('#searchInput').addEventListener('input', (event) => {
  state.query = event.target.value.trim();
  render();
});
$('#sortSelect').addEventListener('change', (event) => {
  state.sort = event.target.value;
  render();
});
$('#openTorrent').addEventListener('click', () => window.emberTorrent.addFile());
$('#openDownloads').addEventListener('click', () => window.emberTorrent.openDownloads());
$('#pauseVisible').addEventListener('click', () => toggleVisible(true));
$('#resumeVisible').addEventListener('click', () => toggleVisible(false));
$('#clearCompleted').addEventListener('click', async () => {
  const count = await window.emberTorrent.clearCompleted();
  toast(`Cleared ${count} completed torrent(s).`);
});
$('#chooseFolder').addEventListener('click', async () => {
  $('#downloadPath').textContent = await window.emberTorrent.selectFolder();
});
$('#torrentList').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = event.target.closest('.torrent-card').dataset.id;
  const torrent = selectedTorrent(id);
  if (!torrent) return;

  if (button.dataset.action === 'toggle') await window.emberTorrent.togglePause(id);
  if (button.dataset.action === 'reveal') await window.emberTorrent.reveal(id);
  if (button.dataset.action === 'copy') {
    window.emberTorrent.copyText(torrent.magnetURI || torrent.id);
    toast('Magnet link copied.');
  }
  if (button.dataset.action === 'remove') await window.emberTorrent.remove(id, false);
});

window.emberTorrent.onTorrents((torrents) => {
  state.torrents = torrents;
  render();
});
window.emberTorrent.onToast(({ message }) => toast(message));
window.emberTorrent.getState().then(({ downloadPath, torrents }) => {
  $('#downloadPath').textContent = downloadPath;
  state.torrents = torrents;
  render();
});
