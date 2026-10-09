/**
 * SMPL-X -> VRM normalized-humanoid retargeting.
 * Inspired by VolgaGerm/emage-onnx-export (MIT); reimplemented for precomputed
 * NPZ poses and the existing offline renderer, without ONNX browser inference.
 * https://github.com/VolgaGerm/emage-onnx-export
 *
 * Pure quaternion math lives here to make hierarchy/rest-pose tests independent
 * of GPU, Three.js and a particular VRM asset.
 */
export const SMPLX_PARENT = Object.freeze([-1,0,0,0,1,2,3,4,5,6,7,8,9,9,9,12,13,14,16,17,18,19,15,15,15,20,25,26,20,28,29,20,31,32,20,34,35,20,37,38,21,40,41,21,43,44,21,46,47,21,49,50,21,52,53]);
export const SMPLX_TO_VRM = Object.freeze(['hips','leftUpperLeg','rightUpperLeg','spine','leftLowerLeg','rightLowerLeg','chest','leftFoot','rightFoot','upperChest','leftToes','rightToes','neck','leftShoulder','rightShoulder','head','leftUpperArm','rightUpperArm','leftLowerArm','rightLowerArm','leftHand','rightHand','jaw','leftEye','rightEye','leftIndexProximal','leftIndexIntermediate','leftIndexDistal','leftMiddleProximal','leftMiddleIntermediate','leftMiddleDistal','leftLittleProximal','leftLittleIntermediate','leftLittleDistal','leftRingProximal','leftRingIntermediate','leftRingDistal','leftThumbMetacarpal','leftThumbProximal','leftThumbDistal','rightIndexProximal','rightIndexIntermediate','rightIndexDistal','rightMiddleProximal','rightMiddleIntermediate','rightMiddleDistal','rightLittleProximal','rightLittleIntermediate','rightLittleDistal','rightRingProximal','rightRingIntermediate','rightRingDistal','rightThumbMetacarpal','rightThumbProximal','rightThumbDistal']);
const ID = [0,0,0,1];
export function multiply(a,b) { return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]; }
export function inverse(q) { const n=q.reduce((s,x)=>s+x*x,0); return [-q[0]/n,-q[1]/n,-q[2]/n,q[3]/n]; }
export function slerp(a,b,t) {
  let c=b, dot=a.reduce((s,x,i)=>s+x*b[i],0);
  if(dot<0) { dot=-dot; c=b.map(x=>-x); }
  if(dot>0.9995) { const q=a.map((x,i)=>x+(c[i]-x)*t);const n=Math.hypot(...q);return q.map(x=>x/n); }
  const angle=Math.acos(Math.min(1,dot)), s=Math.sin(angle);
  const u=Math.sin((1-t)*angle)/s, v=Math.sin(t*angle)/s;
  return a.map((x,i)=>x*u+c[i]*v);
}
function sampleLocal(packed, frame, index) {
  const off=(frame*55+index)*4, q=packed.subarray(off,off+4);
  return [q[0],q[1],q[2],q[3]];
}
export function computeWorldRotations(packed, frame) {
  const result=[];
  for(let i=0;i<55;i++) {
    const local=sampleLocal(packed,frame,i), p=SMPLX_PARENT[i];
    result.push(p<0?local:multiply(result[p],local));
  }
  return result;
}
/**
 * restWorld, parentRestWorld, mappedParent and restLocal are arrays of 55 entries.
 * World-frame method mirrors computeTargetQuats in emage-onnx-export.
 */
export function retargetFrame(world, calibration) {
  const result=[];
  for(let i=0;i<55;i++) {
    if(!calibration.restWorld[i]) {result.push(null);continue;}
    const animatedWorld=multiply(world[i],calibration.restWorld[i]);
    const p=calibration.mappedParent[i];
    const parentRest=calibration.parentRestWorld[i] ?? ID;
    const animatedParent=p>=0?multiply(world[p],parentRest):parentRest;
    result.push(multiply(inverse(animatedParent),animatedWorld));
  }
  return result;
}
/** Build a skeleton-dependent calibration in its actual unanimated rest pose. */
export function createVrmRetargeter(vrm, motion) {
  const nodes=SMPLX_TO_VRM.map(name=>vrm.humanoid?.getNormalizedBoneNode(name) ?? null);
  // An EMAGE pose replaces authored gestures rather than being layered over them.
  for(const node of nodes) if(node) node.quaternion.identity();
  vrm.scene.updateMatrixWorld(true);
  const restWorld=[],parentRestWorld=[],mappedParent=[];
  const index=new Map(nodes.flatMap((node,i)=>node?[[node,i]]:[]));
  for(const node of nodes) {
    if(!node){restWorld.push(null);parentRestWorld.push(null);mappedParent.push(-1);continue;}
    const q=node.getWorldQuaternion(node.quaternion.clone());
    restWorld.push(q.toArray());
    const pq=node.parent?.getWorldQuaternion(node.quaternion.clone());
    parentRestWorld.push(pq?.toArray()??ID);
    let parent=node.parent, sourceParent=-1;
    while(parent){if(index.has(parent)){sourceParent=index.get(parent);break;}parent=parent.parent;}
    mappedParent.push(sourceParent);
  }
  const mappedCount=nodes.filter(Boolean).length;
  if (mappedCount < 8 || !nodes[0] || !nodes[16] || !nodes[17] || !nodes[15]) {
    throw new Error(`VRM lacks required normalized hips/head/arms (${mappedCount}/55 mapped)`);
  }
  const calibration={restWorld,parentRestWorld,mappedParent};
  console.log(`EMAGE 55-joint VRM retarget: ${nodes.filter(Boolean).length}/55 normalized bones mapped`);
  let frameCache=-1, first=null, second=null;
  function poseAt(time) {
    const f=Math.max(0,Math.min(motion.frames-1,time*motion.fps));
    const i=Math.floor(f),next=Math.min(i+1,motion.frames-1),t=f-i;
    if(i!==frameCache){first=retargetFrame(computeWorldRotations(motion.quaternions,i),calibration);second=retargetFrame(computeWorldRotations(motion.quaternions,next),calibration);frameCache=i;}
    return first.map((q,k)=>q&&second[k]?slerp(q,second[k],t):q);
  }
  return {
    apply(time) {
      const quats=poseAt(time);
      for(let i=0;i<55;i++) if(nodes[i]&&quats[i])nodes[i].quaternion.fromArray(quats[i]);
      // The current audio-only EMAGE inference saves zero translation: never
      // simulate root locomotion or apply uncalibrated coordinate transforms.
    },
    mappedBones:nodes.filter(Boolean).length,
  };
}
