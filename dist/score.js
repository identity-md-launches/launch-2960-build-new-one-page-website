import { COL, STEP_SECONDS, SHORT_SECONDS, ACCENT_SECONDS, columnAt, kindOf, lastNightWindow, midiBytes, newNeedle, noteOf, notesOf, paintCloth, readSettlements, rowsInWindow, updateNeedle, walkFeed } from './cloth.js';

const EVENTS_URL = 'https://api.squeekchain.com/v1/events?category=protocol&limit=100';
const STATUS_URL = 'https://api.squeekchain.com/v1/status';
const COPY = {
  zh: {
    skip: '跳到织布', aboutLink: '关于轮谱', headline: '听见昨夜的针脚。', intro: '把 Squeekchain Sepolia 的确认结算，织成一块布、一段旋律。',
    clothTitle: '结算织物', open: '未锁针', past: '较早轮次', now: '最近一轮', needleWaiting: '针停着，等待测量。', notSettled: '确认后才落色', scoreTitle: '昨夜的轮谱', scoreTitlePast: '这一夜的轮谱', scoreWaiting: '正在读取确认结算', play: '播放昨夜', playPast: '播放这一夜', nightBand: '昨夜', nightBandPast: '这一夜', nightEmpty: '这一夜没有确认结算', nightPartial: '这一夜的记录尚未读全，稍后刷新', stop: '停止播放', volume: '音量', png: '保存织物', midi: '保存旋律', sameScore: '同一组轮次，同一段旋律。休止也被保留。', loading: '正在读取公开结算…', refresh: '刷新数据', refreshing: '正在刷新…', inspectTitle: '细看一针', inspectHint: '选择织物，或用方向键逐轮查看。', round: '轮次', noSelection: '等待确认轮次', aboutTitle: '一轮，一针，一音。', aboutIntro: '只记录已经确认的事，也给安静留一个位置。', restTitle: '休止', restWork: '工作量 0', restDescription: '一枚暗针，留下一拍安静。', jogTitle: '短线', jogWork: '工作量 1–499', jogDescription: '一缕金色纬线，一个五声音阶音符。', sprintTitle: '重音', sprintWork: '工作量 ≥ 500', sprintDescription: '浅色纬线与红结，再叠一个五度音。', methodTitle: '这些针脚从哪里来？', methodBody: '只使用 Squeekchain Sepolia 标记为 safe 的 system.settlement_completed 事件，且每次恰好结算一轮。工作量除以 5 的余数，对应 C、D、E、G、A。每轮占用相同大小的格子，工作量不会变成柱高。', methodWindow: '“昨夜”固定指最近一个已结束的夜晚：北京时间（UTC+8）20:00 至次日 08:00。播放和两个下载只使用这段时间内的结算；织物会继续织到现在，供逐针查看。这一夜没有结算时，播放和下载会停用。读不到公开数据时，页面改用随页面保存的真实结算，并标明它属于哪一夜。', eventSource: '查看公开结算', measurementSource: '查看轮子测量', footer: '轮谱只静静记录。不催仓鼠跑，也不花钱包。', footerNote: '一块可以听的布。', rest: '休止', jog: '短线', sprint: '重音', silent: '静音', noData: '暂无可用结算。请刷新数据重试。', noConfirmed: '最近的协议事件中暂无 safe 单轮结算。稍后刷新。', audioError: '无法开启声音。请检查浏览器的声音权限，再试一次。', pngDone: '织物已导出。只包含确认针脚。', midiDone: '旋律已导出，包含全部休止。', downloadError: '无法导出文件。请重试，或换一个浏览器。', archive: '存档', live: '已同步', failed: '暂时无法连接，仍可播放存档。', stale: '刷新失败，保留上次确认的数据。', measurementUnavailable: '测量暂不可用，针停着。', frozen: '播放结束后更新织物。', allRest: '这些轮次都是休止；播放将保持安静。',
    /** @param {string} a @param {string} b */
    nightSpan: (a, b) => `${a} – ${b}`,
    /** @param {number} n @param {number} sounding */
    summary: (n, sounding) => `${n} 针 · ${sounding} 个发声轮次`,
    /** @param {string} a @param {string} b */
    rounds: (a, b) => `第 ${a}–${b} 轮`,
    /** @param {number} n */
    stitches: n => `${n} 针`,
    /** @param {string} r @param {string} kind @param {string} work @param {string} note */
    picked: (r, kind, work, note) => `第 ${r} 轮 · ${kind} · 工作量 ${work} · ${note}`,
    /** @param {string} r @param {boolean} moving @param {string} rpm */
    needle: (r, moving, rpm) => `${r ? `第 ${r} 轮 · ` : ''}${moving ? '针在走' : '针停着'} · ${rpm} 转/分`,
    /** @param {string} date */
    captured: date => `存档 · ${date} · 真实确认结算`,
    /** @param {string} time */
    updated: time => `已同步 · ${time} · 每 15 秒检查`,
    /** @param {number} n */
    clothAlt: n => `像素织物：${n} 个确认轮次，从左到右排列；最右侧是未落色的开放轮次。下方可逐针查看。`,
    canvasLabel: '织物，可横向滚动；用下方轮次控件查看每一针', progressLabel: '播放进度', instrumentLabel: '像素织布与播放器',
  },
  en: {
    skip: 'Skip to the loom', aboutLink: 'About the score', headline: 'Hear the stitches of night.', intro: 'Confirmed Squeekchain Sepolia settlements, woven into cloth and a melody.', clothTitle: 'Settlement cloth', open: 'Still open', past: 'Earlier rounds', now: 'Latest round', needleWaiting: 'Needle at rest. Waiting for measurements.', notSettled: 'Color follows confirmation', scoreTitle: 'Last night’s score', scoreTitlePast: 'This night’s score', scoreWaiting: 'Reading confirmed settlements', play: 'Play last night', playPast: 'Play this night', nightBand: 'Last night', nightBandPast: 'This night', nightEmpty: 'No confirmed settlements this night', nightPartial: 'This night is not fully read yet. Refresh later', stop: 'Stop playback', volume: 'Volume', png: 'Save cloth', midi: 'Save melody', sameScore: 'The same rounds, the same melody. Every rest stays in the score.', loading: 'Reading public settlements…', refresh: 'Refresh data', refreshing: 'Refreshing…', inspectTitle: 'Read a stitch', inspectHint: 'Select the cloth, or use the arrow keys to explore.', round: 'Round', noSelection: 'Waiting for a confirmed round', aboutTitle: 'One round. One stitch. One note.', aboutIntro: 'A record of what is confirmed, with room for quiet.', restTitle: 'Rest', restWork: 'Work 0', restDescription: 'One dark stitch. One beat of silence.', jogTitle: 'Short weft', jogWork: 'Work 1–499', jogDescription: 'A gold thread and one pentatonic note.', sprintTitle: 'Accent', sprintWork: 'Work ≥ 500', sprintDescription: 'A light thread, a red knot, and an added fifth.', methodTitle: 'Where do the stitches come from?', methodBody: 'Only Squeekchain Sepolia system.settlement_completed events marked safe, settling exactly one round, become stitches. Work modulo 5 selects C, D, E, G, or A. Each round takes the same size cell; work never becomes a bar height.', methodWindow: '“Last night” always means the most recently finished night: 20:00 to 08:00 the next morning, Beijing time (UTC+8). Play and both downloads use only the settlements in that span; the cloth keeps weaving up to now so you can read every stitch. If that night has no settlements, Play and the downloads are disabled. When public data cannot be read, the page uses genuine settlements saved with it and shows which night they belong to.', eventSource: 'View public settlements', measurementSource: 'View wheel measurements', footer: 'A quiet record. No urging the hamster, no wallet spending.', footerNote: 'A cloth you can hear.', rest: 'Rest', jog: 'Short weft', sprint: 'Accent', silent: 'Silence', noData: 'No settlements available. Refresh data to try again.', noConfirmed: 'No safe single-round settlements in the recent events. Refresh later.', audioError: 'Audio could not start. Check your browser’s sound permission and try again.', pngDone: 'Cloth exported. Confirmed stitches only.', midiDone: 'Melody exported, with every rest included.', downloadError: 'Could not export the file. Try again or use another browser.', archive: 'Archive', live: 'Synced', failed: 'Connection unavailable. The archive is still playable.', stale: 'Refresh failed. Keeping the last confirmed data.', measurementUnavailable: 'Measurements unavailable. Needle at rest.', frozen: 'The cloth will update after playback.', allRest: 'Every round is a rest; playback will be silent.',
    /** @param {string} a @param {string} b */
    nightSpan: (a, b) => `${a} – ${b} UTC+8`,
    /** @param {number} n @param {number} sounding */
    summary: (n, sounding) => `${n} stitches · ${sounding} sounding rounds`,
    /** @param {string} a @param {string} b */
    rounds: (a, b) => `Rounds ${a}–${b}`,
    /** @param {number} n */
    stitches: n => `${n} stitches`,
    /** @param {string} r @param {string} kind @param {string} work @param {string} note */
    picked: (r, kind, work, note) => `Round ${r} · ${kind} · work ${work} · ${note}`,
    /** @param {string} r @param {boolean} moving @param {string} rpm */
    needle: (r, moving, rpm) => `${r ? `Round ${r} · ` : ''}${moving ? 'Needle moving' : 'Needle at rest'} · ${rpm} rpm`,
    /** @param {string} date */
    captured: date => `Archive · ${date} · genuine confirmed settlements`,
    /** @param {string} time */
    updated: time => `Synced · ${time} · checks every 15 seconds`,
    /** @param {number} n */
    clothAlt: n => `Pixel cloth: ${n} confirmed rounds, ordered left to right. The rightmost column is open and uncolored. Explore individual stitches below.`,
    canvasLabel: 'Cloth, scroll horizontally; use the round control below to explore each stitch', progressLabel: 'Playback progress', instrumentLabel: 'Pixel cloth and player',
  },
};

/** @template {HTMLElement} T @param {string} id @returns {T} */
function el(id) { const node = document.getElementById(id); if (!node) throw new Error(`Missing element: ${id}`); return /** @type {T} */ (node); }
/** @type {HTMLCanvasElement} */ const canvas = el('cloth');
/** @type {HTMLButtonElement} */ const playButton = el('play');
/** @type {HTMLButtonElement} */ const pngButton = el('png');
/** @type {HTMLButtonElement} */ const midiButton = el('midi');
/** @type {HTMLButtonElement} */ const refreshButton = el('refresh');
/** @type {HTMLInputElement} */ const picker = el('round-picker');
/** @type {HTMLInputElement} */ const volume = el('volume');
/** @type {HTMLProgressElement} */ const progress = el('progress');
/** @type {HTMLButtonElement} */ const languageButton = el('lang');
const scroller = el('canvas-scroll');
/** @type {'zh' | 'en'} */ let lang = 'zh';
try { if (localStorage.getItem('burrowkeep-language') === 'en') lang = 'en'; } catch { /* Storage is optional. */ }
/** @type {import('./cloth.js').Stitch[]} */ let stitches = [];
/** @type {import('./cloth.js').Stitch[]} */ let nightRows = []; // Play, PNG and MIDI use only these; stitches may run on past the night.
/** @type {import('./cloth.js').NightWindow | null} */ let nightWindow = null;
let nightKnown = true;
/** @type {{start: number, events: unknown[]} | null} */ let walked = null;
let needle = newNeedle();
/** @type {'loading' | 'archive' | 'live' | 'empty' | 'error'} */ let mode = 'loading';
let archiveDate = '';
let updatedAt = '';
let busy = false;
/** @type {'failed' | 'stale' | null} */ let failure = null;
let measurementAvailable = false;
let selected = -1;
let playing = false;
let startingAudio = false;
let startAt = 0;
let frame = 0;
/** @type {AudioContext | null} */ let audio = null;
/** @type {GainNode | null} */ let master = null;
/** @type {Set<OscillatorNode>} */ const voices = new Set();
/** @type {{rows: import('./cloth.js').Stitch[], time:string, night: import('./cloth.js').NightWindow, known: boolean} | null} */ let pendingFeed = null;
/** @type {'audioError' | 'pngDone' | 'midiDone' | 'downloadError' | null} */ let actionMessage = null;
const t = () => COPY[lang];
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas is unavailable');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** @param {number} seconds */
function timeText(seconds) { const whole = Math.max(0, Math.floor(seconds)); return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`; }
/** @param {string} iso @param {boolean} [full] */
function dateText(iso, full = false) {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.valueOf())) return iso;
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', { timeZone: 'UTC', ...(full ? { year:'numeric', month:'2-digit', day:'2-digit' } : {}), hour:'2-digit', minute:'2-digit', hour12:false }).format(date) + ' UTC';
}

/** @param {number} time */
function nightStamp(time) { return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(time)); }

function renderCopy() {
  const copy = t();
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  document.title = lang === 'zh' ? '轮谱 · Burrowkeep | 让结算成为旋律' : 'Burrowkeep · A cloth you can hear';
  for (const node of document.querySelectorAll('[data-copy]')) {
    const key = node.getAttribute('data-copy');
    if (key && key in copy) { const value = copy[/** @type {keyof typeof copy} */ (key)]; if (typeof value === 'string') node.textContent = value; }
  }
  const languageLabel = languageButton.querySelector('span');
  if (languageLabel) languageLabel.textContent = lang === 'zh' ? 'English' : '简体中文';
  languageButton.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到简体中文');
  el('instrument').setAttribute('aria-label', copy.instrumentLabel);
  scroller.setAttribute('aria-label', copy.canvasLabel);
  progress.setAttribute('aria-label', copy.progressLabel);
  renderState();
}

function renderState() {
  const copy = t();
  const count = stitches.length;
  const nightCount = nightRows.length;
  const sounding = nightRows.filter(row => kindOf(row.work) !== 'rest').length;
  const pastNight = nightWindow !== null && nightWindow.start !== lastNightWindow(Date.now()).start;
  const disabled = nightCount === 0;
  playButton.disabled = disabled || startingAudio;
  pngButton.disabled = disabled;
  midiButton.disabled = disabled;
  picker.disabled = count === 0;
  refreshButton.disabled = busy;
  const refreshLabel = refreshButton.querySelector('span');
  if (refreshLabel) refreshLabel.textContent = busy ? copy.refreshing : copy.refresh;
  playButton.setAttribute('aria-pressed', String(playing));
  el('play-label').textContent = playing ? copy.stop : pastNight ? copy.playPast : copy.play;
  el('play-icon').setAttribute('href', playing ? '#i-stop' : '#i-play');
  el('score-title').textContent = pastNight ? copy.scoreTitlePast : copy.scoreTitle;
  el('night-band').textContent = pastNight ? copy.nightBandPast : copy.nightBand;
  const nightState = nightCount ? copy.summary(nightCount, sounding) : nightKnown ? copy.nightEmpty : copy.nightPartial;
  el('score-summary').textContent = nightWindow ? `${copy.nightSpan(nightStamp(nightWindow.start), nightStamp(nightWindow.end))} · ${nightState}` : mode === 'loading' ? copy.scoreWaiting : mode === 'error' ? copy.noData : mode === 'empty' ? copy.noConfirmed : copy.noSelection;
  document.getElementById('player-all-rest')?.remove();
  if (nightCount && !sounding) {
    const note = document.createElement('p'); note.id = 'player-all-rest'; note.className = 'player-note'; note.textContent = copy.allRest; el('score-summary').after(note);
  }
  picker.max = String(Math.max(0, count - 1));
  picker.value = String(Math.max(0, selected));
  el('duration').textContent = timeText(nightCount * STEP_SECONDS);
  el('round-range').textContent = count ? copy.rounds(stitches[0].round, stitches[count - 1].round) : mode === 'loading' ? copy.noSelection : '';
  el('cloth-count').textContent = count ? copy.stitches(count) : '';
  canvas.setAttribute('aria-label', copy.clothAlt(count));
  el('feed-mode').textContent = mode === 'archive' ? copy.archive : mode === 'live' ? copy.live : '';
  let feed = copy.loading;
  if (mode === 'archive') feed = copy.captured(dateText(archiveDate, true)) + (failure ? ` · ${copy[failure]}` : '');
  if (mode === 'live') feed = copy.updated(dateText(updatedAt)) + (failure ? ` · ${copy.stale}` : '');
  if (mode === 'empty') feed = copy.noConfirmed;
  if (mode === 'error') feed = copy.noData;
  if (pendingFeed) feed += ` · ${copy.frozen}`;
  el('feed-status').textContent = feed;
  el('needle-status').textContent = measurementAvailable ? copy.needle(needle.round, needle.moving, needle.rpm.toFixed(1)) : copy.measurementUnavailable;
  el('action-status').textContent = actionMessage ? copy[actionMessage] : '';
  renderPicked();
}

function renderPicked() {
  const row = stitches[selected];
  const copy = t();
  if (!row) { el('picked').textContent = mode === 'loading' ? copy.noSelection : ''; picker.removeAttribute('aria-valuetext'); return; }
  const note = noteOf(row.work);
  const noteName = note === null ? copy.silent : ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][note % 12] + '4' + (kindOf(row.work) === 'sprint' ? (lang === 'zh' ? ' + 五度' : ' + fifth') : '');
  const value = copy.picked(row.round, copy[kindOf(row.work)], row.work, noteName);
  el('picked').textContent = value;
  picker.setAttribute('aria-valuetext', value);
}

function draw() {
  if (!ctx) return;
  paintCloth(ctx, stitches, needle);
  const scale = window.innerWidth <= 720 ? 3 : 4;
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  const line = el('selection-line');
  line.style.display = selected >= 0 && selected < stitches.length ? 'block' : 'none';
  line.style.left = `${canvas.offsetLeft + selected * COL * scale}px`;
  line.style.width = `${COL * scale}px`;
  const band = el('night-band');
  band.style.display = nightRows.length ? 'block' : 'none';
  band.style.left = `${canvas.offsetLeft + stitches.indexOf(nightRows[0]) * COL * scale}px`;
  band.style.width = `${nightRows.length * COL * scale}px`;
}

/** @param {number} index @param {boolean} [reveal] */
function select(index, reveal = false) {
  selected = Math.min(stitches.length - 1, Math.max(0, index));
  picker.value = String(Math.max(0, selected));
  renderPicked();
  draw();
  if (reveal && selected >= 0) {
    const scale = window.innerWidth <= 720 ? 3 : 4;
    const start = canvas.offsetLeft + selected * COL * scale;
    const end = start + COL * scale;
    if (start < scroller.scrollLeft) scroller.scrollLeft = start;
    else if (end > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = end - scroller.clientWidth;
  }
}

/** @param {import('./cloth.js').Stitch[]} rows @param {'archive' | 'live'} nextMode @param {string} time @param {import('./cloth.js').NightWindow} night @param {boolean} [known] */
function setFeed(rows, nextMode, time, night, known = true) {
  const round = stitches[selected]?.round;
  stitches = rows;
  nightWindow = rows.length ? night : null;
  nightRows = known ? rowsInWindow(rows, night) : []; // A partly read night is never played as if it were whole.
  nightKnown = known;
  mode = rows.length ? nextMode : 'empty';
  if (nextMode === 'archive') archiveDate = time; else updatedAt = time;
  selected = round ? rows.findIndex(row => row.round === round) : -1;
  if (selected < 0) selected = rows.length - 1;
  if (rows.length) {
    const nextRound = (BigInt(rows[rows.length - 1].round) + 1n).toString();
    if (needle.round !== nextRound) needle = { ...newNeedle(), round: nextRound };
  } else { needle = newNeedle(); }
  renderState(); draw();
  scroller.scrollLeft = scroller.scrollWidth;
}

/** @param {string} url @returns {Promise<unknown>} */
async function readJSON(url) {
  const controller = new AbortController(); // AbortSignal.timeout is missing before Safari 16.
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, mode: 'cors', credentials: 'omit', cache: 'no-store' });
    if (!response.ok) throw new Error(`Read failed: ${response.status}`);
    return await response.json();
  } finally { window.clearTimeout(timer); }
}

/** Walks back past the night's start once; later reads stop at events that walk already holds. @param {import('./cloth.js').NightWindow} night */
async function readFeed(night) {
  const read = await walkFeed(cursor => readJSON(cursor ? `${EVENTS_URL}&cursor=${encodeURIComponent(cursor)}` : EVENTS_URL), night.start, walked?.start === night.start ? walked.events : []);
  if (read.covered) walked = { start: night.start, events: read.events };
  const rows = readSettlements({ events: read.events }).filter(row => row.occurredAt === null || Date.parse(row.occurredAt) >= night.start);
  return { rows, covered: read.covered };
}

async function pull() {
  if (busy) return;
  busy = true; renderState();
  const night = lastNightWindow(Date.now());
  const [feed, status] = await Promise.allSettled([readFeed(night), readJSON(STATUS_URL)]);
  failure = null;
  if (feed.status === 'fulfilled') {
    const { rows, covered } = feed.value;
    // An empty or unfinished read says nothing about the night, so whatever is already shown stays.
    if ((!covered || !rows.length) && stitches.length) failure = 'stale';
    else {
      const time = new Date().toISOString();
      if (playing) pendingFeed = { rows, time, night, known: covered }; else setFeed(rows, 'live', time, night, covered);
    }
  } else failure = 'failed';
  if (failure && mode === 'loading') mode = 'error';
  measurementAvailable = false;
  if (status.status === 'fulfilled' && status.value && typeof status.value === 'object' && 'measurement' in status.value) {
    const measurement = status.value.measurement;
    if (measurement && typeof measurement === 'object' && 'rpmMilli' in measurement && 'distanceMm' in measurement) {
      const freshness = 'freshness' in measurement ? measurement.freshness : 'online';
      let stale = freshness !== 'online';
      if ('observedAt' in measurement && typeof measurement.observedAt === 'string') {
        const age = Date.now() - Date.parse(measurement.observedAt);
        const maxAge = 'staleAfterSeconds' in measurement && typeof measurement.staleAfterSeconds === 'number' ? measurement.staleAfterSeconds * 1000 : 120000;
        stale ||= !Number.isFinite(age) || age > maxAge || age < -60000;
      }
      if (!stale && typeof measurement.rpmMilli === 'number' && Number.isFinite(measurement.rpmMilli) && measurement.rpmMilli >= 0 && typeof measurement.distanceMm === 'number' && Number.isFinite(measurement.distanceMm) && measurement.distanceMm >= 0) {
        needle = updateNeedle(needle, measurement, needle.round);
        measurementAvailable = true;
      }
    }
  }
  if (!measurementAvailable) needle = { ...needle, rpm: 0, moving: false };
  busy = false; renderState(); draw();
}

/** @param {number} midi @param {number} when @param {number} duration @param {number} gain */
function beep(midi, when, duration, gain) {
  if (!audio || !master) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  amp.gain.setValueAtTime(0, when);
  amp.gain.linearRampToValueAtTime(gain, when + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(amp); amp.connect(master);
  voices.add(osc);
  osc.onended = () => { osc.disconnect(); amp.disconnect(); voices.delete(osc); };
  osc.start(when); osc.stop(when + duration);
}

function stopPlay() {
  playing = false;
  cancelAnimationFrame(frame);
  for (const voice of voices) { try { voice.stop(); } catch { /* Already finished. */ } }
  voices.clear();
  if (pendingFeed) { const pending = pendingFeed; pendingFeed = null; setFeed(pending.rows, 'live', pending.time, pending.night, pending.known); }
  renderState(); draw();
}

function tick() {
  if (!playing || !audio) return;
  const elapsed = Math.max(0, audio.currentTime - startAt);
  progress.value = Math.min(1, elapsed / (nightRows.length * STEP_SECONDS));
  el('elapsed').textContent = timeText(elapsed);
  const index = stitches.indexOf(nightRows[Math.min(nightRows.length - 1, Math.floor(elapsed / STEP_SECONDS))]);
  if (index !== selected) select(index, !reducedMotion.matches);
  if (elapsed >= nightRows.length * STEP_SECONDS) { stopPlay(); return; }
  frame = requestAnimationFrame(tick);
}

async function play() {
  if (playing) { stopPlay(); return; }
  if (!nightRows.length || startingAudio) return;
  startingAudio = true; actionMessage = null; renderState();
  try {
    audio ??= new AudioContext();
    await audio.resume();
    if (audio.state !== 'running') throw new Error('Audio suspended');
    if (!master) { master = audio.createGain(); master.connect(audio.destination); }
    master.gain.value = Number(volume.value) / 100 * 0.35;
    startAt = audio.currentTime + 0.04;
    playing = true;
    progress.value = 0; el('elapsed').textContent = '0:00';
    nightRows.forEach((stitch, index) => {
      const accent = kindOf(stitch.work) === 'sprint';
      notesOf(stitch).forEach((note, i) => beep(note, startAt + index * STEP_SECONDS, accent ? ACCENT_SECONDS : SHORT_SECONDS, i ? 0.25 : accent ? 0.4 : 0.3));
    });
    select(stitches.indexOf(nightRows[0]), !reducedMotion.matches);
    frame = requestAnimationFrame(tick);
  } catch { playing = false; actionMessage = 'audioError'; }
  startingAudio = false; renderState();
}

/** @param {Blob} blob @param {string} name */
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function savePNG() {
  if (!nightRows.length) return;
  try {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) throw new Error('Canvas unavailable');
    paintCloth(exportCtx, nightRows); // No selection, playback marker, or unconfirmed needle in the export.
    exportCanvas.toBlob(blob => {
      if (!blob) actionMessage = 'downloadError';
      else { download(blob, 'burrowkeep-cloth.png'); actionMessage = 'pngDone'; }
      renderState();
    }, 'image/png');
  } catch { actionMessage = 'downloadError'; renderState(); }
}

function saveMIDI() {
  if (!nightRows.length) return;
  try { download(new Blob([midiBytes(nightRows)], { type: 'audio/midi' }), 'burrowkeep-score.mid'); actionMessage = 'midiDone'; }
  catch { actionMessage = 'downloadError'; }
  renderState();
}

languageButton.addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem('burrowkeep-language', lang); } catch { /* Locale works without storage. */ }
  renderCopy();
});
playButton.addEventListener('click', play);
pngButton.addEventListener('click', savePNG);
midiButton.addEventListener('click', saveMIDI);
refreshButton.addEventListener('click', () => { void pull(); });
picker.addEventListener('input', () => select(Number(picker.value), true));
volume.addEventListener('input', () => {
  el('volume-value').textContent = `${volume.value}%`;
  if (master && audio) master.gain.setTargetAtTime(Number(volume.value) / 100 * 0.35, audio.currentTime, 0.02);
});
canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();
  const index = columnAt((event.clientX - rect.left) * canvas.width / rect.width, stitches.length);
  if (index >= 0) select(index);
});
scroller.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    select(event.key === 'Home' ? 0 : event.key === 'End' ? stitches.length - 1 : selected + (event.key === 'ArrowRight' ? 1 : -1), true);
  }
});
window.addEventListener('resize', () => { draw(); if (selected === stitches.length - 1) scroller.scrollLeft = scroller.scrollWidth; else select(selected, true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stopPlay(); else if (!document.hidden) void pull(); });
window.addEventListener('pagehide', stopPlay);

async function init() {
  renderCopy(); draw();
  try {
    const snapshot = await readJSON('./data/settlements.json');
    const rows = readSettlements(snapshot);
    const capturedAt = snapshot && typeof snapshot === 'object' && 'capturedAt' in snapshot && typeof snapshot.capturedAt === 'string' ? snapshot.capturedAt : '';
    const captured = Date.parse(capturedAt);
    if (!Number.isFinite(captured)) throw new Error('Archive has no capture time');
    setFeed(rows, 'archive', capturedAt, lastNightWindow(captured));
  } catch { /* A live read still works if the local archive is missing. */ }
  await pull();
  window.setInterval(() => { if (!document.hidden) void pull(); }, 15000);
}
void init();
