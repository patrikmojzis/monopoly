import type { CreateGameResponse, GameAction, GameState } from "./types";

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = `${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    message = body.detail || message;
  } catch {
    message = await response.text();
  }
  throw new Error(message);
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function createGame(playerNames: string[]): Promise<CreateGameResponse> {
  return fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ humanPlayer: "p1", playerNames })
  }).then(parseResponse<CreateGameResponse>);
}

export function getGame(gameId: string, token: string): Promise<GameState> {
  return fetch(`/api/games/${gameId}`, { headers: authHeaders(token) }).then(parseResponse<GameState>);
}

export function sendAction(gameId: string, token: string, action: GameAction): Promise<GameState> {
  return fetch(`/api/games/${gameId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(action)
  }).then(parseResponse<GameState>);
}

export function botTurn(gameId: string, token: string): Promise<GameState> {
  return fetch(`/api/games/${gameId}/bot-turn`, {
    method: "POST",
    headers: authHeaders(token)
  }).then(parseResponse<GameState>);
}

export function tokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("token");
}

export function gameIdFromPath(): string | null {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("game");
  return idx >= 0 ? parts[idx + 1] : null;
}
