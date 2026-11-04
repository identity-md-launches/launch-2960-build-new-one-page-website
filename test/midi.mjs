/** Small independent format-0 MIDI reader used to verify exported notes and silence. */
export function readMIDI(bytes) {
  const data = Buffer.from(bytes);
  if (data.toString('ascii', 0, 4) !== 'MThd' || data.toString('ascii', 14, 18) !== 'MTrk') throw new Error('Invalid MIDI chunks');
  const division = data.readUInt16BE(12);
  const length = data.readUInt32BE(18);
  if (data.length !== length + 22) throw new Error('Incorrect track length');
  let offset = 22, tick = 0, tempo = 500000;
  const notes = [], noteOffs = [];
  let end = -1;
  const variable = () => { let n = 0, b; do { b = data[offset++]; n = (n << 7) | (b & 127); } while (b & 128); return n; };
  while (offset < data.length) {
    tick += variable();
    const status = data[offset++];
    if (status === 0xff) {
      const type = data[offset++], size = variable();
      if (type === 0x51) tempo = data.readUIntBE(offset, size);
      if (type === 0x2f) end = tick;
      offset += size;
    } else if ((status & 0xf0) === 0xc0) offset++;
    else {
      const note = data[offset++], velocity = data[offset++];
      if ((status & 0xf0) === 0x90 && velocity > 0) notes.push({ tick, note, velocity });
      if ((status & 0xf0) === 0x80) noteOffs.push({ tick, note });
    }
  }
  return { notes, noteOffs, end, tempo, division, seconds: end / division * tempo / 1e6 };
}
