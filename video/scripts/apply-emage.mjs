/** Composite motion from EMAGE onto an already-generated narrated video. */
import {existsSync,readFileSync} from 'node:fs';
import {copyFile,rename,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {overlayTalkingAvatar} from './avatar-overlay.mjs';
import {VIDEO_SECONDS} from './timeline.mjs';
import {videoPaths} from './video-paths.mjs';
const output=process.env.OUTPUT_DIR||'/out';
const paths=videoPaths(output);
const evidence=JSON.parse(readFileSync(paths.evidence,'utf8'));
const cues=evidence.narration?.cues;
if(evidence.outputSeconds!==VIDEO_SECONDS || !Array.isArray(cues) || cues.length!==7)
  throw new Error('Expected a completed narrated 40s demo with seven cues');
for (const path of [paths.narratedFallback,paths.narration]) {
  if(!existsSync(path)) throw new Error(`Missing original recording ${path}`);
}
if(process.env.VIDEO_MOTION_MODE!=='emage') throw new Error('Set VIDEO_MOTION_MODE=emage');
const temp=join(output,`video.emage.${randomUUID()}.tmp.mp4`);
try {
  await copyFile(paths.narratedFallback,temp);
  await overlayTalkingAvatar(temp,paths.narration,output,cues);
  await rename(temp,paths.finalVideo);
  console.log(`EMAGE composite: ${paths.finalVideo}`);
} finally {await rm(temp,{force:true});}
