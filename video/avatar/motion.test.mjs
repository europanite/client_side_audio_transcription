import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_GESTURES,sampleAvatarMotion,validateMotionCues} from './motion.mjs';
import {SCENES} from '../scripts/scenes.mjs';
test('VRM presenter synchronizes with all seven cues after opening silence',()=>{
  assert.equal(SCENE_GESTURES.length,7);
  const cues=SCENES.map(s=>({startSeconds:s.at}));
  assert.equal(validateMotionCues(cues,40).length,7);
  const idle=sampleAvatarMotion(0,null,0);
  const active=sampleAvatarMotion(19,SCENES.map(s=>s.at),0.2);
  assert.notDeepEqual(active.bones.leftUpperArm,idle.bones.leftUpperArm);
});
