import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createOriginalWalkClip } from "./avatar-animation";

describe("createOriginalWalkClip", () => {
  it("creates a distinct gait that drives the rig's legs, arms, and hips", () => {
    const character = new THREE.Group();
    for (const name of ["LeftUpLeg", "RightUpLeg", "LeftForeArm", "RightForeArm", "Hips"]) {
      const bone = new THREE.Bone();
      bone.name = name;
      character.add(bone);
    }
    const clip = createOriginalWalkClip(character);
    expect(clip.name).toBe("OFFSTAGE Original Walk");
    expect(clip.tracks).toHaveLength(5);

    const mixer = new THREE.AnimationMixer(character);
    mixer.clipAction(clip).play();
    mixer.update(0.25);

    const leftLeg = character.getObjectByName("LeftUpLeg")!;
    const rightLeg = character.getObjectByName("RightUpLeg")!;
    expect(leftLeg.quaternion.x).not.toBeCloseTo(0);
    expect(rightLeg.quaternion.x).toBeCloseTo(-leftLeg.quaternion.x, 3);
  });
});
