import { Room, Server, type Client } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { resolvePlazaMovement } from "../src/components/world/layout";
import { OffstageState, PlayerState } from "../src/world/offstage-state";

type JoinOptions = { displayName?: string };
type MoveMessage = { x?: number; z?: number; yaw?: number; movement?: string };

class OffstagePlazaRoom extends Room {
  override state = new OffstageState();

  override onCreate() {
    this.maxClients = 24;
    this.patchRate = 50;
    this.maxMessagesPerSecond = 30;
    this.onMessage("move", (client, message: MoveMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !Number.isFinite(message.x) || !Number.isFinite(message.z)) return;
      const x = message.x;
      const z = message.z;
      if (x === undefined || z === undefined) return;
      const point = resolvePlazaMovement({ x, z });
      player.x = point.x;
      player.z = point.z;
      const yaw = message.yaw;
      player.yaw = yaw !== undefined && Number.isFinite(yaw) ? yaw : player.yaw;
      player.movement =
        message.movement === "run" || message.movement === "walk" ? message.movement : "idle";
    });
  }

  override onJoin(client: Client, options: JoinOptions) {
    const index = this.state.players.size;
    const name = options.displayName?.trim().slice(0, 24) || `Builder ${index + 1}`;
    this.state.players.set(
      client.sessionId,
      new PlayerState({
        name,
        x: index % 2 === 0 ? -1 : 1,
        z: 7 + Math.floor(index / 2) * 1.2,
        yaw: Math.PI,
        movement: "idle",
      }),
    );
  }

  override onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}

const port = Number.parseInt(process.env["OFFSTAGE_WS_PORT"] ?? "2567", 10);
const server = new Server({
  transport: new WebSocketTransport(),
  express: (app) => {
    app.use((_request, response, next) => {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.setHeader("Access-Control-Allow-Headers", "content-type");
      next();
    });
  },
});

server.define("offstage_plaza", OffstagePlazaRoom);
await server.listen(port, "127.0.0.1");
console.log(`OFFSTAGE multiplayer server listening on ws://127.0.0.1:${port}`);
