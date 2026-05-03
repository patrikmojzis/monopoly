export type Player = "p1" | "p2" | "spectator";
export type Phase = "roll" | "buy" | "end" | "finished";

export type Space = {
  id: number;
  name: string;
  kind: "go" | "property" | "tax" | "chance" | "chest" | "jail" | "railroad" | "utility";
  price: number;
  rent: number;
  color: string | null;
};

export type PlayerInfo = {
  cash: number;
  position: number;
  jailTurns: number;
  netWorth: number;
};

export type GameAction = { type: "roll" | "buy" | "skip_buy" | "end_turn" };

export type GameState = {
  id: string;
  version: number;
  viewer: Player;
  turn: "p1" | "p2";
  phase: Phase;
  winner: "p1" | "p2" | null;
  canAct: boolean;
  players: Array<"p1" | "p2">;
  names: Record<"p1" | "p2", string>;
  playerState: Record<"p1" | "p2", PlayerInfo>;
  owners: Record<string, "p1" | "p2">;
  lastRoll: [number, number] | null;
  pendingSpace: number | null;
  board: Space[];
  legalActions: GameAction[];
  history: Array<Record<string, unknown> & { message?: string }>;
  links: Record<string, string>;
};

export type CreateGameResponse = {
  gameId: string;
  turn: "p1" | "p2";
  browserUrl: string;
  spectatorUrl: string;
  playerUrls: Record<string, string>;
  agentConfigs: Record<string, unknown>;
};
