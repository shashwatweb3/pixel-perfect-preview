import * as THREE from "three";

export function createOriginalWalkClip(character: THREE.Object3D) {
  const times = [0, 0.25, 0.5, 0.75, 1];
  const swingBones = [
    { name: "LeftUpLeg", amount: 0.46, offset: 0 },
    { name: "RightUpLeg", amount: 0.46, offset: Math.PI },
    { name: "LeftForeArm", amount: 0.34, offset: Math.PI },
    { name: "RightForeArm", amount: 0.34, offset: 0 },
  ];
  const tracks: THREE.KeyframeTrack[] = [];
  for (const { name, amount, offset } of swingBones) {
    const bone = character.getObjectByName(name);
    if (!bone) continue;
    const values: number[] = [];
    for (const time of times) {
      const rotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        Math.sin(time * Math.PI * 2 + offset) * amount,
      );
      const quaternion = bone.quaternion.clone().multiply(rotation);
      values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values));
  }
  const hips = character.getObjectByName("Hips");
  if (hips) {
    const values: number[] = [];
    for (const time of times) {
      values.push(
        hips.position.x,
        hips.position.y + Math.sin(time * Math.PI * 4) * 1.1,
        hips.position.z,
      );
    }
    tracks.push(new THREE.VectorKeyframeTrack("Hips.position", times, values));
  }
  return new THREE.AnimationClip("OFFSTAGE Original Walk", 1, tracks);
}
