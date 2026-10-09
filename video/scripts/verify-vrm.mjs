/** Verify VRM-1 metadata before WebGL startup, including permitted uses and credit. */
import { readFileSync } from 'node:fs';

export function inspectVRM(path) {
  const data = readFileSync(path);
  if (data.length < 32 || data.toString('ascii',0,4) !== 'glTF' || data.readUInt32LE(4) !== 2) {
    throw new Error(`Invalid binary glTF/VRM: ${path}`);
  }
  if (data.readUInt32LE(8) !== data.length || data.toString('ascii',16,20) !== 'JSON') {
    throw new Error(`Invalid VRM JSON chunk: ${path}`);
  }
  const jsonLength = data.readUInt32LE(12);
  const root = JSON.parse(data.toString('utf8',20,20+jsonLength).trim());
  const vrm = root.extensions?.VRMC_vrm;
  if (!vrm || !String(vrm.specVersion).startsWith('1.')) {
    throw new Error('Talking-avatar stage requires a VRM 1.x model');
  }
  const presets = vrm.expressions?.preset || {};
  for (const expression of ['aa','blink']) {
    if (!Object.hasOwn(presets,expression)) {
      throw new Error(`VRM lacks ${expression} expression for speech/blinking`);
    }
  }
  const meta = vrm.meta || {};
  return {
    name: meta.name || null,
    authors: meta.authors || [],
    redistributionAllowed: meta.allowRedistribution === true,
    creditRequired: meta.creditNotation === 'required',
    commercialUsage: meta.commercialUsage || 'unspecified',
  };
}
