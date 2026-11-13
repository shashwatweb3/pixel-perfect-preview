import { schema, t, type SchemaType } from "@colyseus/schema";

export const PlayerState = schema(
  {
    name: t.string(),
    x: t.float32(),
    z: t.float32(),
    yaw: t.float32(),
    movement: t.string(),
  },
  "PlayerState",
);

export type PlayerState = SchemaType<typeof PlayerState>;

export const OffstageState = schema({ players: t.map(PlayerState) }, "OffstageState");

export type OffstageState = SchemaType<typeof OffstageState>;
