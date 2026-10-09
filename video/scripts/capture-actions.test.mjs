import test from 'node:test';
import assert from 'node:assert/strict';
import {performScene} from './capture-actions.mjs';
test('unknown action IDs do not silently produce a misleading demo',async()=>{
  await assert.rejects(()=>performScene({}, {id:'nonexistent'},Buffer.from([])), /Unknown scene/);
});
test('file-upload step passes a real WAV Buffer to the browser file input',async()=>{
  let supplied;
  const page={locator(selector){assert.equal(selector,'input[type="file"]');return {
    async setInputFiles(value){supplied=value;},
  };}};
  const sample=Buffer.from('RIFF-test-sample');
  await performScene(page,{id:'upload'},sample);
  assert.equal(supplied.mimeType,'audio/wav');
  assert.equal(supplied.buffer,sample);
});
