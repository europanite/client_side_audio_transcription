import test from 'node:test';
import assert from 'node:assert/strict';
import {SMPLX_PARENT,SMPLX_TO_VRM,multiply,inverse,slerp,computeWorldRotations,retargetFrame} from './smplx-retarget.mjs';
import {EMAGE_FORMAT,validateEmageMotion,unpackEmageMotion} from './emage-motion.mjs';
const I=[0,0,0,1];
const angle=(rad,axis)=>[axis===0?Math.sin(rad/2):0,axis===1?Math.sin(rad/2):0,axis===2?Math.sin(rad/2):0,Math.cos(rad/2)];
const approx=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-5);
test('SMPL-X 55-joint hierarchy and VRM mapping are complete',()=>{
  assert.equal(SMPLX_PARENT.length,55);assert.equal(SMPLX_TO_VRM.length,55);
  assert.equal(SMPLX_TO_VRM[39],'leftThumbDistal');
});
test('identity poses preserve nontrivial VRM rest local rotations',()=>{
  const r=angle(0.8,2),parent=angle(0.35,1);
  const calibration={restWorld:Array(55).fill(null),parentRestWorld:Array(55).fill(null),mappedParent:Array(55).fill(-1)};
  calibration.restWorld[16]=multiply(parent,r);
  calibration.parentRestWorld[16]=parent;
  const output=retargetFrame(Array(55).fill(I),calibration);
  assert.ok(approx(output[16],r));
});
test('source shoulder rotation survives without clamping or gain reduction',()=>{
  const source=angle(1.3,0),quats=new Float32Array(55*4);
  for(let i=0;i<55;i++)quats[i*4+3]=1;
  quats.set(source,16*4);
  const world=computeWorldRotations(quats,0);
  const calibration={restWorld:Array(55).fill(null),parentRestWorld:Array(55).fill(null),mappedParent:Array(55).fill(-1)};
  calibration.restWorld[16]=I; calibration.parentRestWorld[16]=I;
  assert.ok(approx(retargetFrame(world,calibration)[16],source));
  assert.ok(approx(multiply(inverse(source),source),I));
  assert.ok(approx(slerp(I,source,1),source));
});
test('packed payload validator accepts valid data and rejects bad byte length',()=>{
  const frameCount=1140,buf=new Float32Array(frameCount*55*4);
  for(let i=3;i<buf.length;i+=4)buf[i]=1;
  const data={format:EMAGE_FORMAT,fps:30,frames:frameCount,audioSha256:'a'.repeat(64),
    quaternions:{encoding:'base64-f32le',layout:'frame-joint-xyzw',joints:55,data:Buffer.from(buf.buffer).toString('base64')}};
  assert.equal(validateEmageMotion(data,40),data);
  assert.equal(unpackEmageMotion(data).quaternions.length,buf.length);
  assert.throws(()=>validateEmageMotion({...data,quaternions:{...data.quaternions,data:'bad'}}));
});
