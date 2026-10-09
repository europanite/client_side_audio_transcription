import test from 'node:test';
import assert from 'node:assert/strict';
import {jointAngularSpeedReport} from './inspect-emage-motion.mjs';
test('motion source diagnostics detect known 90 degree frame spike',()=>{
  const q=new Float32Array(3*55*4);
  for(let i=3;i<q.length;i+=4)q[i]=1;
  q.set([Math.SQRT1_2,0,0,Math.SQRT1_2],(2*55+16)*4);
  const r=jointAngularSpeedReport({frames:3,fps:30,quaternions:q});
  assert.ok(Math.abs(r[16].max-90)<.01);
  assert.equal(r[16].spikes,1);
  assert.equal(r[17].spikes,0);
});
