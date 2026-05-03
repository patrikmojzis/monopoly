export type Player = string;
export type Phase = "roll" | "buy" | "auction" | "end" | "finished";

export type Space = {
  id: number;
  name: string;
  kind: "go" | "property" | "tax" | "chance" | "chest" | "jail" | "go_to_jail" | "free_parking" | "railroad" | "utility";
  price: number;
  rent: number;
  currentRent: number;
  color: string | null;
  houseCost: number;
  rents: number[];
  isBuyable: boolean;
  mortgageValue: number;
  unmortgageCost: number;
};

export type PlayerInfo = {
  cash: number;
  position: number;
  jailTurns: number;
  jailCards: number;
  active: boolean;
  netWorth: number;
};

export type GameAction =
  | { type: "roll" }
  | { type: "buy" }
  | { type: "skip_buy" }
  | { type: "end_turn" }
  | { type: "pay_jail" }
  | { type: "use_jail_card" }
  | { type: "build"; spaceId: number }
  | { type: "sell_building"; spaceId: number }
  | { type: "mortgage"; spaceId: number }
  | { type: "unmortgage"; spaceId: number }
  | { type: "bid_auction"; spaceId?: number; amount: number }
  | { type: "pass_auction"; spaceId?: number }
  | { type: "trade"; toPlayer: Player; cashFrom?: number; cashTo?: number; propertiesFrom?: number[]; propertiesTo?: number[] };

export type LegalAction = GameAction & { label?: string; spaceId?: number; amount?: number };

export type GameState = {
  id: string;
  version: number;
  viewer: Player;
  turn: Player;
  phase: Phase;
  winner: Player | null;
  canAct: boolean;
  players: Player[];
  names: Record<string, string>;
  playerState: Record<string, PlayerInfo>;
  owners: Record<string, Player>;
  buildings: Record<string, number>;
  mortgaged: Record<string, boolean>;
  auction: { spaceId: number; currentBid: number; highBidder: Player | null; active: Player[]; afterTurn: Player } | null;
  lastRoll: [number, number] | null;
  doublesInRow: number;
  pendingSpace: number | null;
  board: Space[];
  legalActions: LegalAction[];
  history: Array<Record<string, unknown> & { message?: string }>;
  links: Record<string, string>;
};

export type CreateGameResponse = {
  gameId: string;
  turn: Player;
  browserUrl: string;
  spectatorUrl: string;
  playerUrls: Record<string, string>;
  agentConfigs: Record<string, unknown>;
};
