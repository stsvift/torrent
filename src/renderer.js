const $ = (selector) => document.querySelector(selector);

const state = { torrents: [] };

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

function renderStats() {
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
  $('#statusText').textContent = state.torrents.length ? `${state.torrents.length} torrent(s) in queue` : 'No torrents yet';
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

function torrentCard(torrent) {
  const percent = Math.round((torrent.progress || 0) * 1000) / 10;
  const status = torrent.done ? 'Completed' : torrent.paused ? 'Paused' : 'Downloading';
  const files = torrent.files?.length ? `${torrent.files.length} file(s)` : 'Metadata pending';

  return `
    <article class="torrent-card" data-id="${torrent.id}">
      <div class="torrent-top">
        <div>
          <div class="torrent-name">${escapeHtml(torrent.name)}</div>
          <div class="torrent-meta">${status} · ${files} · ${formatBytes(torrent.length)}</div>
        </div>
        <div class="actions">
          <button data-action="toggle">${torrent.paused ? 'Resume' : 'Pause'}</button>
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
      </div>
    </article>
  `;
}

function renderTorrents(torrents) {
  state.torrents = torrents;
  const list = $('#torrentList');
  list.classList.toggle('empty', torrents.length === 0);
  list.innerHTML = torrents.map(torrentCard).join('');
  renderStats();
}

async function addTorrent() {
  const input = $('#torrentInput');
  try {
    await window.emberTorrent.add(input.value);
    input.value = '';
  } catch (error) {
    toast(error.message);
  }
}

$('#addTorrent').addEventListener('click', addTorrent);
$('#torrentInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addTorrent();
});
$('#openTorrent').addEventListener('click', () => window.emberTorrent.addFile());
$('#openDownloads').addEventListener('click', () => window.emberTorrent.openDownloads());
$('#chooseFolder').addEventListener('click', async () => {
  $('#downloadPath').textContent = await window.emberTorrent.selectFolder();
});
$('#torrentList').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = event.target.closest('.torrent-card').dataset.id;
  if (button.dataset.action === 'toggle') await window.emberTorrent.togglePause(id);
  if (button.dataset.action === 'remove') await window.emberTorrent.remove(id);
});

window.emberTorrent.onTorrents(renderTorrents);
window.emberTorrent.onToast(({ message }) => toast(message));
window.emberTorrent.getState().then(({ downloadPath, torrents }) => {
  $('#downloadPath').textContent = downloadPath;
  renderTorrents(torrents);
});
