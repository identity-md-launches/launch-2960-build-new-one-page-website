import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COL, CELL_H, HEM, decimal, readSettlements, kindOf, noteOf, notesOf, stitchPixels, newNeedle, updateNeedle, midiBytes, paintCloth, columnAt } from '../cloth.js';
import { readMIDI } from './midi.mjs';

const event = (round, work, overrides = {}) => ({type:'system.settlement_completed',source:{confirmationStatus:'safe',chainId:'11155111'},payload:{previousSettledThroughRound:String(BigInt(round)-1n),settledThroughRound:String(round),workAdded:work},...overrides});
const row = work => ({round:'1',work:String(work),occurredAt:null});

test('accepts safe single-round settlements, including numeric and string zero', () => {
 const rows=readSettlements({events:[event(1,0),event(2,'0'),event(3,'499'),event(4,'500')]});
 assert.deepEqual(rows.map(r=>r.work),['0','0','499','500']);
});
test('ignores pending, unsafe, wrong-chain, unrelated and multi-round events', () => {
 const base=event(3,'3');
 const invalid=[{...base,source:{confirmationStatus:'pending'}},{...base,source:{confirmationStatus:'finalized'}},{...base,source:{confirmationStatus:'safe',chainId:'1'}},{...base,type:'system.mining_checkpointed'},{...base,payload:{...base.payload,previousSettledThroughRound:'1'}},{...base,payload:{...base.payload,settledThroughRound:'2'}}];
 assert.deepEqual(readSettlements({events:invalid}),[]);
});
test('fails closed on malformed feeds and invalid decimal work', () => {
 for(const body of [null,{},[],{events:null}])assert.throws(()=>readSettlements(body));
 assert.deepEqual(readSettlements({events:[null,0,{},...['-1','1.5','1e3','',null,{},9007199254740992].map(w=>event(3,w))]}),[]);
 assert.equal(decimal('00017'),'17');
});
test('sorts large rounds exactly, deduplicates repeated events and omits conflicting rounds', () => {
 const rows=readSettlements({events:[event('9007199254740994','12'),event('9007199254740993','13'),event('9007199254740993','13'),event('5','7'),event('5','8')]});
 assert.deepEqual(rows.map(x=>x.round),['9007199254740993','9007199254740994']);
});
test('maps 0, 1, 499 and 500 correctly; huge work keeps its exact pentatonic degree', () => {
 assert.deepEqual([0,1,499,500].map(kindOf),['rest','jog','jog','sprint']);
 assert.equal(noteOf(0),null);
 assert.deepEqual([5,1,2,3,4].map(noteOf),[60,62,64,67,69]);
 assert.equal(noteOf('9007199254740993'),67);
 assert.deepEqual(notesOf(row(500)),[60,67]);
});
test('renders rests as one dark pixel and work as a one-pixel weft with a 2×2 accent knot', () => {
 assert.deepEqual(stitchPixels(row(0),0).map(p=>[p.role,p.w,p.h]),[['rest',1,1]]);
 for(const work of ['1','499','500','9007199254740993']){
  const pixels=stitchPixels(row(work),1);
  assert.equal(pixels[0].h,1);
  assert(pixels.every(p=>p.x>=COL&&p.x+p.w<=COL*2&&p.y>=HEM&&p.y+p.h<=CELL_H+HEM));
 }
 assert.deepEqual(stitchPixels(row(500),0).map(p=>[p.role,p.w,p.h]),[['weft',5,1],['knot',2,2]]);
});
test('open column contains only warp and a neutral needle; exported cloth has no open cell', () => {
 const fills=[];
 const ctx={canvas:{width:0,height:0},fillStyle:'',imageSmoothingEnabled:true,fillRect(x,y,w,h){fills.push({x,y,w,h,color:this.fillStyle});}};
 paintCloth(ctx,[row(500)],newNeedle());
 assert.deepEqual([ctx.canvas.width,ctx.canvas.height],[16,32]);
 const open=fills.filter(p=>p.x>=8);
 assert(open.every(p=>!['#e1ad62','#f4dfad','#de6047'].includes(p.color)));
 assert.equal(open.filter(p=>p.color==='#f8f0de').length,1);
 paintCloth(ctx,[row(500)]);
 assert.deepEqual([ctx.canvas.width,ctx.canvas.height],[8,32]);
});
test('needle moves only after measured distance increases; RPM alone never advances it', () => {
 let n=updateNeedle(newNeedle(),{rpmMilli:90000,distanceMm:1000},'8');
 assert.equal(n.index,0); assert.equal(n.moving,false);
 n=updateNeedle(n,{rpmMilli:120000,distanceMm:1000,untrustedWork:999999},'8');
 assert.equal(n.index,0); assert.equal(n.moving,false);
 n=updateNeedle(n,{rpmMilli:120000,distanceMm:1160},'8');
 assert.equal(n.index,2); assert.equal(n.moving,true);
 n=updateNeedle(n,{rpmMilli:0,distanceMm:1160},'8');
 assert.equal(n.index,2); assert.equal(n.moving,false);
});
test('needle resets on new round/counter reset, clamps its path, and rejects missing/invalid measurements', () => {
 let n=updateNeedle(newNeedle(),{rpmMilli:1000,distanceMm:1000},'8');
 n=updateNeedle(n,{rpmMilli:1000,distanceMm:100000},'8'); assert.equal(n.index,29);
 n=updateNeedle(n,{rpmMilli:1000,distanceMm:100020},'9'); assert.equal(n.index,0);
 n=updateNeedle(n,{rpmMilli:1000,distanceMm:20},'9'); assert.equal(n.index,0);
 for(const value of [null,{}, {rpmMilli:-1,distanceMm:20},{rpmMilli:5,distanceMm:NaN}]) assert.equal(updateNeedle(n,value,'9').moving,false);
});
test('MIDI contains exactly the playback pitches, added fifths, 110ms short notes and trailing silence', () => {
 const score=[row(0),row(1),row(499),row(500),row(0)];
 const midi=readMIDI(midiBytes(score));
 assert.deepEqual(midi.notes.map(n=>[n.tick,n.note]),[[110,62],[220,69],[330,60],[330,67]]);
 assert.deepEqual(midi.noteOffs.map(n=>[n.tick,n.note]),[[165,62],[275,69],[420,60],[420,67]]);
 assert.equal(midi.seconds,1.1);
 assert.equal(midi.end,550);
 assert.equal(midi.tempo,440000);
 assert.equal(midi.division,220);
});
test('all-rest MIDI preserves the entire duration with zero note-on events', () => {
 const midi=readMIDI(midiBytes(Array.from({length:50},()=>row(0))));
 assert.equal(midi.notes.length,0); assert.equal(midi.seconds,11);
});
test('pointer lookup excludes the open cell and out-of-bounds coordinates', () => {
 assert.equal(columnAt(0,3),0); assert.equal(columnAt(23.9,3),2);
 assert.equal(columnAt(24,3),-1); assert.equal(columnAt(-1,3),-1);
});
test('bundled archive consists of genuine safe single-round events with dated public provenance', async () => {
 const snapshot=JSON.parse(await readFile(new URL('../data/settlements.json',import.meta.url),'utf8'));
 assert.equal(snapshot.source,'https://api.squeekchain.com/v1/events?category=protocol&limit=100');
 assert(Number.isFinite(Date.parse(snapshot.capturedAt)));
 const rows=readSettlements(snapshot);
 assert.equal(rows.length,snapshot.events.length);
 assert(snapshot.events.every(e=>/^0x[a-f0-9]{64}$/.test(e.source.transactionHash)));
});
