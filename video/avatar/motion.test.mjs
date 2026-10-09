import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_GESTURES,sampleAvatarMotion,validateMotionCues} from './motion.mjs';
import {SCENES} from '../scripts/scenes.mjs';
import {EMAGE_BONES,EMAGE_FORMAT,EMAGE_LIMITS,validateEmageMotion} from './emage-motion.mjs';
test('VRM presenter synchronizes with all seven cues after opening silence',()=>{
  assert.equal(SCENE_GESTURES.length,7);
  const cues=SCENES.map(s=>({startSeconds:s.at}));
  assert.equal(validateMotionCues(cues,40).length,7);
  const idle=sampleAvatarMotion(0,null,0);
  const active=sampleAvatarMotion(19,SCENES.map(s=>s.at),0.2);
  assert.notDeepEqual(active.bones.leftUpperArm,idle.bones.leftUpperArm);
});
test('EMAGE 40-second manifest supports meaningful upper arm rotations',()=>{
  const data={format:EMAGE_FORMAT,fps:30,audioSha256:'a'.repeat(64),
    bones:Object.fromEntries(EMAGE_BONES.map(b=>[b,Array.from({length:1200},()=>[0,0,0])]))};
  data.bones.leftUpperArm[250]=[0.7,0,-1.0];
  assert.ok(EMAGE_LIMITS.leftUpperArm>1);
  assert.equal(validateEmageMotion(data,40),data);
});
