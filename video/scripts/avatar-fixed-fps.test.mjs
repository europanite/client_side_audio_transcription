import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {recordFixedFps,fixedFpsArgs} from './avatar-fixed-fps.mjs';

test('ffmpeg consumes PNG frames at explicit fixed frame rate', async()=>{
  const dir=mkdtempSync(join(tmpdir(),'fixed-avatar-test-'));
  try {
    const sourceA=join(dir,'red.png'),sourceB=join(dir,'blue.png');
    const target=join(dir,'output.webm');
    for(const [color,source] of [['red',sourceA],['blue',sourceB]]) {
      execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=${color}:s=64x64:r=30`,'-frames:v','1','-threads','1',source]);
    }
    const pngA=readFileSync(sourceA).toString('base64'),pngB=readFileSync(sourceB).toString('base64');
    let sampled=0;
    const calls=[];
    const page={evaluate:async (fn,args)=>{
      calls.push(args);
      if(typeof args === 'number') return sampled++ % 2 ? pngB : pngA;
      return undefined;
    }};
    await recordFixedFps({page,raw:target,levels:[0.1],cues:[],seconds:1,fps:10});
    const frames=Number(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=nb_read_frames','-of','csv=p=0',target],{encoding:'utf8'}).trim());
    assert.equal(frames,10);
    const raw=execFileSync('ffmpeg',['-v','error','-i',target,'-frames:v','2','-f','rawvideo','-pix_fmt','rgb24','-']);
    const frameBytes=64*64*3;
    assert.equal(raw.length,frameBytes*2);
    assert.notDeepEqual(raw.subarray(0,frameBytes),raw.subarray(frameBytes,frameBytes*2));
    assert.deepEqual(calls.filter(v=>typeof v==='number'),Array.from({length:10},(_,i)=>i/10));
    assert.ok(fixedFpsArgs(target,30,1200).join(' ').includes('-frames:v 1200'));
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
