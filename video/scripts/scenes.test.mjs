import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,validateScenes,SITE_URL} from './scenes.mjs';
import {FRAME_RATE,VIDEO_SECONDS,FRAME_SIZE} from './timeline.mjs';
import {videoPaths} from './video-paths.mjs';
test('audio transcription demo has silent lead-in and exactly seven spoken scenes',()=>{
  assert.equal(validateScenes(),true);
  assert.equal(SCENES.length,7);
  assert.equal(SCENES[0].at,1.8);
  assert.equal(SCENES.at(-1).at,34);
  assert.ok(SCENES.every(s=>s.speech.length>10));
  assert.equal(VIDEO_SECONDS,40);
  assert.equal(FRAME_RATE,30);
  assert.equal(FRAME_SIZE.width,1280);
  assert.match(SITE_URL,/^https:\/\//);
});
test('rejects out-of-order scenes or no silent introduction',()=>{
  assert.throws(()=>validateScenes([{at:0.1,id:'bad',speech:'hi'}]),/silence/);
  assert.throws(()=>validateScenes([{at:1.8,id:'ok',speech:'hi'},{at:1.1,id:'bad',speech:'hi'}]),/cue/);
});
test('video paths for EMAGE and normal rendering agree',()=>{
  const paths=videoPaths('/out');
  assert.equal(paths.narration,'/out/intermediate/narration.wav');
  assert.equal(paths.finalVideo,'/out/video.mp4');
  assert.equal(paths.narratedFallback,'/out/intermediate/narrated-without-avatar.mp4');
});
