import { Client } from "@colyseus/sdk";

import { OffstageState } from "../src/world/offstage-state";

const endpoint = process.env["OFFSTAGE_WS_URL"] ?? "ws://127.0.0.1:2567";

async function waitFor(assertion: () => boolean, label: string) {
  const deadline = Date.now() + 4_000;
  while (Date.now() < deadline) {
    if (assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const firstClient = new Client(endpoint);
const secondClient = new Client(endpoint);
const first = await firstClient.joinOrCreate(
  "offstage_plaza",
  { displayName: "Browser A" },
  OffstageState,
);
const second = await secondClient.joinOrCreate(
  "offstage_plaza",
  { displayName: "Browser B" },
  OffstageState,
);

try {
  await waitFor(
    () => first.state.players.size === 2 && second.state.players.size === 2,
    "both players to join",
  );
  first.send("move", { x: 2.5, z: 5.5, yaw: 0.75, movement: "walk" });
  await waitFor(
    () => Math.abs((second.state.players.get(first.sessionId)?.x ?? 0) - 2.5) < 0.01,
    "movement to synchronize",
  );
  console.log("Multiplayer smoke passed: two clients joined one room and movement synchronized.");
} finally {
  await Promise.all([first.leave(), second.leave()]);
}
