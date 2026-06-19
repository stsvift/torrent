const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  torrents: [],
  view: 'all',
  query: '',
  sort: 'added',
  language: localStorage.getItem('ember-language') || 'ru'
};

const translations = {
  ru: {
    splashSubtitle: 'Запускаем торрент-движок и подготавливаем интерфейс',
    brandSubtitle: 'Готовый торрент-клиент', menuAll: 'Все торренты', menuDownloading: 'Загружаются', menuCompleted: 'Завершены', menuPaused: 'На паузе', menuSettings: 'Настройки',
    openDownloadFolder: 'Открыть папку загрузок', clearCompleted: 'Очистить завершенные', downloadFolder: 'Папка загрузок', changeFolder: 'Изменить папку',
    eyebrow: 'Торрент-клиент для Windows', downloadsTitle: 'Загрузки', pauseVisible: 'Пауза видимых', resumeVisible: 'Возобновить видимые', openTorrent: 'Открыть .torrent',
    torrentInput: 'Magnet-ссылка, info hash или URL торрента', add: 'Добавить', search: 'Поиск', searchPlaceholder: 'Имя или hash', sort: 'Сортировка',
    sortAdded: 'Порядок добавления', sortName: 'Имя', sortProgress: 'Прогресс', sortSpeed: 'Скорость загрузки', sortSize: 'Размер',
    total: 'Всего', downloaded: 'Загружено', downSpeed: 'Скорость ↓', upSpeed: 'Скорость ↑', settingsEyebrow: 'Персонализация', settingsTitle: 'Настройки',
    languageTitle: 'Язык интерфейса', languageDescription: 'Выберите язык приложения. По умолчанию используется русский.', aboutTitle: 'О приложении',
    appNameLabel: 'Название', versionLabel: 'Версия', developerLabel: 'Разработчик', engineLabel: 'Движок',
    all: 'Все торренты', downloading: 'Загружаются', completed: 'Завершены', paused: 'На паузе', shown: 'показано', totalLower: 'всего', empty: 'В этом разделе пока нет торрентов. Добавьте magnet-ссылку или откройте .torrent файл.',
    statusCompleted: 'Завершен', statusPaused: 'На паузе', statusMetadata: 'Получение метаданных', statusDownloading: 'Загружается', files: 'файл(ов)', metadataPending: 'Метаданные загружаются',
    actionResume: 'Продолжить', actionPause: 'Пауза', actionReveal: 'Показать', actionCopy: 'Копировать magnet', actionRemove: 'Удалить', progress: 'Прогресс', peers: 'Пиры', eta: 'Осталось', hash: 'Hash', ratio: 'рейтинг',
    addedToast: 'Торрент добавлен в очередь.', copiedToast: 'Magnet-ссылка скопирована.', clearedToast: 'Очищено завершенных торрентов:', pausedToast: 'Поставлено на паузу:', resumedToast: 'Возобновлено:', langSaved: 'Язык интерфейса обновлен.'
  },
  en: {
    splashSubtitle: 'Starting the torrent engine and preparing the interface',
    brandSubtitle: 'Release torrent client', menuAll: 'All torrents', menuDownloading: 'Downloading', menuCompleted: 'Completed', menuPaused: 'Paused', menuSettings: 'Settings',
    openDownloadFolder: 'Open download folder', clearCompleted: 'Clear completed', downloadFolder: 'Download folder', changeFolder: 'Change folder',
    eyebrow: 'Windows torrent client', downloadsTitle: 'Downloads', pauseVisible: 'Pause visible', resumeVisible: 'Resume visible', openTorrent: 'Open .torrent',
    torrentInput: 'Magnet link, info hash, or torrent URL', add: 'Add', search: 'Search', searchPlaceholder: 'Name or hash', sort: 'Sort',
    sortAdded: 'Added order', sortName: 'Name', sortProgress: 'Progress', sortSpeed: 'Download speed', sortSize: 'Size',
    total: 'Total', downloaded: 'Downloaded', downSpeed: 'Down speed', upSpeed: 'Up speed', settingsEyebrow: 'Personalization', settingsTitle: 'Settings',
    languageTitle: 'Interface language', languageDescription: 'Choose the app language. Russian is used by default.', aboutTitle: 'About app',
    appNameLabel: 'Name', versionLabel: 'Version', developerLabel: 'Developer', engineLabel: 'Engine',
    all: 'All torrents', downloading: 'Downloading', completed: 'Completed', paused: 'Paused', shown: 'shown', totalLower: 'total', empty: 'No torrents match this view. Add a magnet link or open a .torrent file.',
    statusCompleted: 'Completed', statusPaused: 'Paused', statusMetadata: 'Fetching metadata', statusDownloading: 'Downloading', files: 'file(s)', metadataPending: 'Metadata pending',
    actionResume: 'Resume', actionPause: 'Pause', actionReveal: 'Reveal', actionCopy: 'Copy magnet', actionRemove: 'Remove', progress: 'Progress', peers: 'Peers', eta: 'ETA', hash: 'Hash', ratio: 'ratio',
    addedToast: 'Torrent added to the queue.', copiedToast: 'Magnet link copied.', clearedToast: 'Cleared completed torrents:', pausedToast: 'Paused:', resumedToast: 'Resumed:', langSaved: 'Interface language updated.'
  }
};

function t(key) {
  return translations[state.language]?.[key] || translations.ru[key] || key;
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  $('[data-i18n-placeholder]');
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  $('#languageSelect').value = state.language;
  render();
}

function hideSplash() {
  setTimeout(() => $('#splash').classList.add('splash-hidden'), 950);
}




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
  if (torrent.done) return t('statusCompleted');
  if (torrent.paused) return t('statusPaused');
  if (!torrent.length) return t('statusMetadata');
  return t('statusDownloading');
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
  $('#viewTitle').textContent = t(state.view);
  $('#statusText').textContent = `${visible.length} ${t('shown')} · ${state.torrents.length} ${t('totalLower')}`;
  renderCounts();
}

function torrentCard(torrent) {
  const percent = Math.round((torrent.progress || 0) * 1000) / 10;
  const files = torrent.files?.length ? `${torrent.files.length} ${t('files')}` : t('metadataPending');

  return `
    <article class="torrent-card" data-id="${torrent.id}">
      <div class="torrent-top">
        <div>
          <div class="torrent-name">${escapeHtml(torrent.name)}</div>
          <div class="torrent-meta">${getStatus(torrent)} · ${files} · ${formatBytes(torrent.length)} · ${t('ratio')} ${torrent.ratio.toFixed(2)}</div>
        </div>
        <div class="actions">
          <button data-action="toggle">${torrent.paused ? t('actionResume') : t('actionPause')}</button>
          <button data-action="reveal">${t('actionReveal')}</button>
          <button data-action="copy">${t('actionCopy')}</button>
          <button class="remove" data-action="remove">${t('actionRemove')}</button>
        </div>
      </div>
      <div class="progress"><span style="width: ${percent}%"></span></div>
      <div class="torrent-stats">
        <span>${t('progress')}<strong>${percent}%</strong></span>
        <span>Down<strong>${formatSpeed(torrent.downloadSpeed)}</strong></span>
        <span>Up<strong>${formatSpeed(torrent.uploadSpeed)}</strong></span>
        <span>${t('peers')}<strong>${torrent.numPeers}</strong></span>
        <span>${t('eta')}<strong>${formatTime(torrent.timeRemaining)}</strong></span>
        <span>${t('hash')}<strong>${torrent.id.slice(0, 8)}</strong></span>
      </div>
    </article>
  `;
}

function render() {
  const visible = filteredTorrents();
  const list = $('#torrentList');
  list.classList.toggle('empty', visible.length === 0);
  list.style.setProperty('--empty-text', `'${t('empty')}'`);
  list.innerHTML = visible.map(torrentCard).join('');
  renderStats(visible);
}

async function addTorrent() {
  const input = $('#torrentInput');
  try {
    await window.emberTorrent.add(input.value);
    input.value = '';
    toast(t('addedToast'));
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
  toast(`${paused ? t('pausedToast') : t('resumedToast')} ${visible.length}`);
}

applyLanguage();
hideSplash();

$('.menu').addEventListener('click', (event) => {
  const item = event.target.closest('.nav-item[data-view]');
  if (!item) return;
  state.view = item.dataset.view;
  $('#downloadsView').classList.toggle('hidden', state.view === 'settings');
  $('#settingsView').classList.toggle('hidden', state.view !== 'settings');
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
$('#languageSelect').addEventListener('change', (event) => {
  state.language = event.target.value;
  localStorage.setItem('ember-language', state.language);
  applyLanguage();
  toast(t('langSaved'));
});

$('#clearCompleted').addEventListener('click', async () => {
  const count = await window.emberTorrent.clearCompleted();
  toast(`${t('clearedToast')} ${count}`);
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
    toast(t('copiedToast'));
  }
  if (button.dataset.action === 'remove') await window.emberTorrent.remove(id, false);
});

window.emberTorrent.onTorrents((torrents) => {
  state.torrents = torrents;
  render();
});
window.emberTorrent.onToast(({ message }) => toast(message));
window.emberTorrent.getAppInfo().then(({ version }) => {
  $('#appVersion').textContent = version;
});

window.emberTorrent.getState().then(({ downloadPath, torrents }) => {
  $('#downloadPath').textContent = downloadPath;
  state.torrents = torrents;
  render();
});
