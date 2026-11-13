import { describe, expect, it } from "vitest";
import { BUILDINGS, PLAYER_RADIUS, PLAZA_BOUNDS, resolvePlazaMovement } from "./layout";

describe("resolvePlazaMovement", () => {
  it("keeps the player inside the plaza boundary", () =>
    expect(resolvePlazaMovement({ x: 99, z: -99 })).toEqual({
      x: PLAZA_BOUNDS.maxX - PLAYER_RADIUS,
      z: PLAZA_BOUNDS.minZ + PLAYER_RADIUS,
    }));
  it("pushes the player out of a building collider", () => {
    const building = BUILDINGS[0];
    if (!building) throw new Error("Expected a building");
    const [width, , depth] = building.size;
    const [x, , z] = building.position;
    const point = resolvePlazaMovement({ x, z });
    expect(
      point.x > x - width / 2 - PLAYER_RADIUS &&
        point.x < x + width / 2 + PLAYER_RADIUS &&
        point.z > z - depth / 2 - PLAYER_RADIUS &&
        point.z < z + depth / 2 + PLAYER_RADIUS,
    ).toBe(false);
  });
});
