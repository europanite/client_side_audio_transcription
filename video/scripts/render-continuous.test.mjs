import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {probeDuration} from './render-continuous.mjs';

function makeFixture(format,live=false) {
  const dir=mkdtempSync(join(tmpdir(),'webm-probe-'));
  const file=join(dir,`recording.${format}`);
  const args=['-hide_banner','-loglevel','error','-y',
    '-f','lavfi','-i','color=c=green:s=80x80:r=30','-t','2','-an',
    '-c:v',format==='webm'?'libvpx':'mpeg4'];
  if(live) args.push('-live','1');
  args.push('-f',format,file);
  execFileSync('ffmpeg',args);
  return {dir,file};
}

test('reads duration from normal MP4 metadata',async()=>{
  const {dir,file}=makeFixture('mp4');
  try { assert.ok(Math.abs((await probeDuration(file))-2)<0.1); }
  finally { rmSync(dir,{recursive:true,force:true}); }
});

test('recovers time from MediaRecorder-like WebM without container duration',async()=>{
  const {dir,file}=makeFixture('webm',true);
  try {
    const raw=execFileSync('ffprobe',['-v','error','-show_entries','format=duration',
      '-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).trim();
    assert.equal(raw,'N/A');
    assert.ok(Math.abs((await probeDuration(file))-2)<0.1);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('does not silently accept invalid or empty recordings',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'webm-invalid-'));
  const file=join(dir,'empty.webm');
  writeFileSync(file,'not a recording');
  try {await assert.rejects(()=>probeDuration(file));}
  finally {rmSync(dir,{recursive:true,force:true});}
});
