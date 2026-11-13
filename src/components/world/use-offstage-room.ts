import { Client, type Room } from "@colyseus/sdk";
import { useCallback, useEffect, useRef, useState } from "react";

import { OffstageState, type PlayerState } from "@/world/offstage-state";

export type MultiplayerStatus = "connecting" | "connected" | "offline" | "error";
export type MoveUpdate = { x: number; z: number; yaw: number; movement: "idle" | "walk" | "run" };

const endpoint = import.meta.env.VITE_OFFSTAGE_WS_URL ?? "ws://127.0.0.1:2567";

export function useOffstageRoom(displayName: string) {
  const roomRef = useRef<Room<unknown, OffstageState> | null>(null);
  const [status, setStatus] = useState<MultiplayerStatus>("connecting");
  const [remoteIds, setRemoteIds] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const signature = useRef("");

  useEffect(() => {
    let cancelled = false;
    const client = new Client(endpoint);
    client
      .joinOrCreate("offstage_plaza", { displayName }, OffstageState)
      .then((room) => {
        if (cancelled) {
          void room.leave();
          return;
        }
        roomRef.current = room;
        setStatus("connected");
        room.onStateChange((state) => {
          const ids = Array.from(state.players.keys());
          const nextSignature = ids.join(":");
          if (signature.current === nextSignature) return;
          signature.current = nextSignature;
          setOnlineCount(ids.length);
          setRemoteIds(ids.filter((id) => id !== room.sessionId));
        });
        room.onError(() => setStatus("error"));
        room.onLeave(() => {
          roomRef.current = null;
          if (!cancelled) setStatus("offline");
        });
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      const room = roomRef.current;
      roomRef.current = null;
      if (room) void room.leave();
    };
  }, [displayName, attempt]);

  const sendMove = useCallback((update: MoveUpdate) => roomRef.current?.send("move", update), []);
  const getPlayer = useCallback(
    (id: string): PlayerState | undefined => roomRef.current?.state.players.get(id),
    [],
  );
  const reconnect = useCallback(() => {
    setStatus("connecting");
    setAttempt((current) => current + 1);
  }, []);
  return { status, remoteIds, onlineCount, sendMove, getPlayer, reconnect };
}
