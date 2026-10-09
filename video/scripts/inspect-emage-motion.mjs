/** Diagnose whether jerky joint motion originates in the EMAGE pose data.
 * Run against smplx-vrm-retarget-v3 JSON; this requires no GPU or VRM asset.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SMPLX_TO_VRM } from '../avatar/smplx-retarget.mjs';
import { validateEmageMotion, unpackEmageMotion } from '../avatar/emage-motion.mjs';

export function jointAngularSpeedReport(motion) {
  const {frames,fps,quaternions:q} = motion;
  const reports=[];
  for (let bone=0;bone<55;bone++) {
    const speeds=[];
    for(let frame=1;frame<frames;frame++) {
      const a=((frame-1)*55+bone)*4,b=(frame*55+bone)*4;
      let dot=0;
      for(let axis=0;axis<4;axis++)dot+=q[a+axis]*q[b+axis];
      dot=Math.min(1,Math.max(-1,Math.abs(dot)));
      speeds.push(2*Math.acos(dot)*180/Math.PI);
    }
    speeds.sort((a,b)=>a-b);
    const percentile=p=>speeds[Math.min(speeds.length-1,Math.floor((speeds.length-1)*p))]||0;
    reports.push({name:SMPLX_TO_VRM[bone],mean: speeds.reduce((a,b)=>a+b,0)/speeds.length,
      p95:percentile(.95),max:percentile(1), spikes:speeds.filter(x=>x>15).length});
  }
  return reports;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const path=process.argv[2]||'video/output/intermediate/emage-vrm-motion.json';
  const motion=unpackEmageMotion(validateEmageMotion(JSON.parse(readFileSync(path,'utf8'))));
  const report=jointAngularSpeedReport(motion);
  console.log(`EMAGE input: ${motion.frames} frames, ${motion.fps} fps`);
  console.log('Joint                      avg °/frame   p95 °/frame   max °/frame   jumps >15°');
  for(const x of [...report].sort((a,b)=>b.max-a.max).slice(0,22)) {
    console.log(`${x.name.padEnd(28)} ${x.mean.toFixed(2).padStart(8)}  ${x.p95.toFixed(2).padStart(10)}  ${x.max.toFixed(2).padStart(10)}  ${String(x.spikes).padStart(8)}`);
  }
  console.log('A high jump count in this SOURCE report implicates EMAGE; low counts implicate rendering/retargeting.');
}
