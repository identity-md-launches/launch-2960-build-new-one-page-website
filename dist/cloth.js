/** Pure settlement, weave, measurement and score logic. No network or audio side effects. */
/** @typedef {{round: string, work: string, occurredAt: string | null}} Stitch */
/** @typedef {{index: number, rpm: number, moving: boolean, baseMm: number | null, lastMm: number | null, round: string}} Needle */
/** @typedef {{x:number, y:number, w:number, h:number, color:string, role:string}} Pixel */
/** @typedef {{start: number, end: number}} NightWindow */

export const COL = 8;
export const CELL_H = 24;
export const HEM = 4;
export const STEP_SECONDS = 0.22;
export const SHORT_SECONDS = 0.11;
export const ACCENT_SECONDS = 0.18;
const SCALE = [0, 2, 4, 7, 9];
const WEFTS = [4, 8, 12, 16, 20];
export const THREAD = Object.freeze({ warp: '#5b4737', warpAlt: '#503d30', hem: '#35291f', rest: '#30251d', gold: '#e1ad62', light: '#f4dfad', knot: '#de6047', needle: '#f8f0de' });
const HOUR = 3600000;
const DAY = 24 * HOUR;
const UTC8 = 8 * HOUR;
const MAX_PAGES = 30;

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }

/** Canonical unsigned decimal; never round a large work value through Number. @param {unknown} value */
export function decimal(value) {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  return /^\d{1,100}$/.test(text) ? BigInt(text).toString() : null;
}

/** @param {unknown} body @returns {Stitch[]} */
export function readSettlements(body) {
  if (!record(body) || !Array.isArray(body.events)) throw new Error('Invalid event feed');
  /** @type {Map<string, Stitch>} */
  const rounds = new Map();
  const conflicts = new Set();
  for (const event of body.events) {
    if (!record(event) || event.type !== 'system.settlement_completed') continue;
    const source = event.source;
    const payload = event.payload;
    if (!record(source) || source.confirmationStatus !== 'safe' || !record(payload)) continue;
    if (source.chainId !== undefined && String(source.chainId) !== '11155111') continue;
    const prev = decimal(payload.previousSettledThroughRound);
    const round = decimal(payload.settledThroughRound);
    const work = decimal(payload.workAdded);
    if (prev === null || round === null || work === null || BigInt(round) !== BigInt(prev) + 1n) continue;
    if (rounds.has(round) && rounds.get(round)?.work !== work) conflicts.add(round);
    rounds.set(round, { round, work, occurredAt: typeof event.occurredAt === 'string' && Number.isFinite(Date.parse(event.occurredAt)) ? event.occurredAt : null });
  }
  return [...rounds.values()].filter(row => !conflicts.has(row.round)).sort((a, b) => BigInt(a.round) < BigInt(b.round) ? -1 : 1);
}

/** The most recently finished night: 20:00 to 08:00 Asia/Shanghai (no daylight saving), start inclusive, end exclusive. @param {number} now @returns {NightWindow} */
export function lastNightWindow(now) {
  const local = now + UTC8;
  let end = Math.floor(local / DAY) * DAY + 8 * HOUR;
  if (end > local) end -= DAY;
  return { start: end - 12 * HOUR - UTC8, end: end - UTC8 };
}

/** @param {Stitch[]} rows @param {NightWindow} night */
export function rowsInWindow(rows, night) {
  return rows.filter(row => { const at = row.occurredAt === null ? NaN : Date.parse(row.occurredAt); return at >= night.start && at < night.end; });
}

/** @param {unknown} event */
function eventTime(event) { return record(event) && typeof event.occurredAt === 'string' ? Date.parse(event.occurredAt) : NaN; }
/** @param {unknown[]} events */
function oldestTime(events) { return events.reduce((/** @type {number} */ oldest, event) => { const at = eventTime(event); return at < oldest ? at : oldest; }, Infinity); }
/** @param {unknown[]} events */
function newestTime(events) { return events.reduce((/** @type {number} */ newest, event) => { const at = eventTime(event); return at > newest ? at : newest; }, -Infinity); }

/**
 * Follows nextCursor until the feed is older than start, or reaches events an earlier walk already holds.
 * covered is false when the read cannot vouch for the whole span: nothing came back, a later page failed, or the page limit ran out.
 * @param {(cursor: string) => Promise<unknown>} readPage @param {number} start @param {unknown[]} [known]
 * @returns {Promise<{events: unknown[], covered: boolean}>}
 */
export async function walkFeed(readPage, start, known = []) {
  const joinAt = newestTime(known);
  /** @type {unknown[]} */
  const events = [];
  let cursor = '';
  for (let page = 0; page < MAX_PAGES; page++) {
    /** @type {unknown} */
    let body;
    try { body = await readPage(cursor); } catch (error) {
      if (page === 0) throw error;
      return { events, covered: false };
    }
    if (!record(body) || !Array.isArray(body.events)) {
      if (page === 0) throw new Error('Invalid event feed');
      return { events, covered: false };
    }
    events.push(...body.events);
    const oldest = oldestTime(body.events);
    if (oldest < start) return { events, covered: true };
    if (oldest <= joinAt) {
      const seen = new Set(events.map(event => JSON.stringify(event)));
      return { events: [...events, ...known.filter(event => eventTime(event) <= oldest && !seen.has(JSON.stringify(event)))], covered: true };
    }
    if (typeof body.nextCursor !== 'string' || !body.nextCursor) return { events, covered: events.length > 0 };
    cursor = body.nextCursor;
  }
  return { events, covered: false };
}

/** @param {string | number | bigint} work */
export function kindOf(work) { const value = BigInt(work); return value === 0n ? 'rest' : value < 500n ? 'jog' : 'sprint'; }
/** @param {string | number | bigint} work */
export function noteOf(work) { return BigInt(work) === 0n ? null : 60 + SCALE[Number(BigInt(work) % 5n)]; }
/** @param {Stitch} stitch */
export function notesOf(stitch) { const note = noteOf(stitch.work); return note === null ? [] : kindOf(stitch.work) === 'sprint' ? [note, note + 7] : [note]; }

/** Pixel geometry is independent of work magnitude: every round occupies exactly 8 × 24 pixels. @param {Stitch} stitch @param {number} index @returns {Pixel[]} */
export function stitchPixels(stitch, index) {
  const x = index * COL;
  const kind = kindOf(stitch.work);
  if (kind === 'rest') return [{ x: x + 3, y: HEM + 12, w: 1, h: 1, color: THREAD.rest, role: 'rest' }];
  const y = HEM + WEFTS[Number(BigInt(stitch.work) % 5n)];
  /** @type {Pixel[]} */
  const pixels = [{ x: x + (BigInt(stitch.round) % 2n === 1n ? 3 : 1), y, w: kind === 'sprint' ? 5 : 4, h: 1, color: kind === 'sprint' ? THREAD.light : THREAD.gold, role: 'weft' }];
  if (kind === 'sprint') pixels.push({ x: x + 3, y, w: 2, h: 2, color: THREAD.knot, role: 'knot' });
  return pixels;
}

/** @returns {Needle} */
export function newNeedle() { return { index: 0, rpm: 0, moving: false, baseMm: null, lastMm: null, round: '' }; }

/** The only motion inputs are measured RPM and positive distance increments. Round changes reset the path. @param {Needle} previous @param {unknown} measurement @param {string} round @returns {Needle} */
export function updateNeedle(previous, measurement, round) {
  if (!record(measurement)) return { ...previous, rpm: 0, moving: false };
  const mm = measurement.distanceMm;
  const rpmMilli = measurement.rpmMilli;
  if (typeof mm !== 'number' || !Number.isFinite(mm) || mm < 0 || typeof rpmMilli !== 'number' || !Number.isFinite(rpmMilli) || rpmMilli < 0) return { ...previous, rpm: 0, moving: false };
  const reset = previous.round !== round || previous.lastMm === null || mm < previous.lastMm;
  const baseMm = reset ? mm : previous.baseMm ?? mm;
  const increase = !reset && previous.lastMm !== null && mm > previous.lastMm;
  return { round, baseMm, lastMm: mm, rpm: rpmMilli / 1000, moving: rpmMilli > 0 && increase, index: reset ? 0 : Math.min(29, Math.floor(Math.max(0, mm - baseMm) / 80)) };
}

/** @param {CanvasRenderingContext2D} ctx @param {Stitch[]} stitches @param {Needle | null} needle */
export function paintCloth(ctx, stitches, needle = null) {
  const count = stitches.length + (needle ? 1 : 0);
  const width = Math.max(1, count) * COL;
  const height = CELL_H + HEM * 2;
  if (ctx.canvas.width !== width) ctx.canvas.width = width;
  if (ctx.canvas.height !== height) ctx.canvas.height = height;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = THREAD.hem;
  ctx.fillRect(0, 0, width, height);
  for (let py = 0; py < CELL_H; py += 2) {
    for (let px = 0; px < width; px += 2) {
      ctx.fillStyle = ((px + py) / 2) % 2 === 0 ? THREAD.warp : THREAD.warpAlt;
      ctx.fillRect(px, HEM + py, 2, 2);
    }
  }
  for (let i = 0; i < stitches.length; i++) {
    for (const pixel of stitchPixels(stitches[i], i)) { ctx.fillStyle = pixel.color; ctx.fillRect(pixel.x, pixel.y, pixel.w, pixel.h); }
  }
  if (needle) {
    // A single neutral needle; no colored weft or trail is committed to the open column.
    const row = Math.floor(needle.index / 6) % 5;
    const col = needle.index % 6;
    ctx.fillStyle = THREAD.needle;
    ctx.fillRect(stitches.length * COL + (row % 2 ? 6 - col : 1 + col), HEM + WEFTS[row], 1, 1);
  }
}

/** @param {number} x @param {number} count */
export function columnAt(x, count) { const index = Math.floor(x / COL); return index >= 0 && index < count ? index : -1; }

/** @param {number} value */
function vlq(value) {
  const bytes = [value & 127];
  while ((value = Math.floor(value / 128)) > 0) bytes.unshift((value & 127) | 128);
  return bytes;
}

/** Format 0, 220 PPQN, 440000 µs/quarter. A 110-tick rest is exactly 220 ms, matching Web Audio. @param {Stitch[]} stitches */
export function midiBytes(stitches) {
  /** @type {{tick:number, data:number[]}[]} */
  const events = [];
  let tick = 0;
  for (const stitch of stitches) {
    const accent = kindOf(stitch.work) === 'sprint';
    notesOf(stitch).forEach((note, i) => {
      events.push({ tick, data: [0x90, note, i ? 72 : accent ? 100 : 78] });
      events.push({ tick: tick + (accent ? 90 : 55), data: [0x80, note, 0] });
    });
    tick += 110;
  }
  events.sort((a, b) => a.tick - b.tick || a.data[0] - b.data[0]);
  const track = [0, 0xff, 0x51, 3, 0x06, 0xb6, 0xc0, 0, 0xc0, 10];
  let last = 0;
  for (const event of events) { track.push(...vlq(event.tick - last), ...event.data); last = event.tick; }
  track.push(...vlq(tick - last), 0xff, 0x2f, 0);
  const size = track.length;
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 220, 0x4d, 0x54, 0x72, 0x6b, size >>> 24, (size >>> 16) & 255, (size >>> 8) & 255, size & 255, ...track]);
}
