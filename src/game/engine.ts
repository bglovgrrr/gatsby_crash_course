import { clock } from '@/lib/clock'
import type { Action, GameState, Pick, Player, Round } from './types'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 8
export const MAX_PROMPT_LENGTH = 160
export const MAX_NOTE_LENGTH = 140

export class GameError extends Error {}

const fail = (msg: string): never => {
  throw new GameError(msg)
}

export function createGame(host: Player, code: string, now = clock.now()): GameState {
  return {
    id: `game_${code}_${now}`,
    code,
    hostId: host.id,
    phase: 'lobby',
    players: [host],
    rounds: [],
    turn: 0,
    playback: { isPlaying: false, positionMs: 0, updatedAt: now },
    createdAt: now,
  }
}

export const currentRound = (s: GameState): Round | undefined => s.rounds[s.rounds.length - 1]

export const askerOf = (s: GameState): Player | undefined =>
  s.players.length ? s.players[s.turn % s.players.length] : undefined

export const playerById = (s: GameState, id: string) => s.players.find((p) => p.id === id)

export function currentPick(s: GameState): Pick | undefined {
  const r = currentRound(s)
  if (!r) return undefined
  const pid = r.order[r.current]
  return r.picks.find((p) => p.playerId === pid)
}

export function playbackPosition(s: GameState, now = clock.now()) {
  const pb = s.playback
  const pos = pb.isPlaying ? pb.positionMs + (now - pb.updatedAt) : pb.positionMs
  const max = currentPick(s)?.track.durationMs ?? Infinity
  return Math.min(Math.max(0, pos), max)
}

/** Play order: start with the asker, then go around the circle. */
function playOrder(s: GameState, r: Round): string[] {
  const pickedIds = new Set(r.picks.map((p) => p.playerId))
  const start = Math.max(0, s.players.findIndex((p) => p.id === r.askerId))
  const seats = [...s.players.slice(start), ...s.players.slice(0, start)]
  return seats.map((p) => p.id).filter((id) => pickedIds.has(id))
}

function withRound(s: GameState, r: Round): GameState {
  return { ...s, rounds: [...s.rounds.slice(0, -1), r] }
}

function startListening(s: GameState, now: number): GameState {
  const r = currentRound(s)!
  return {
    ...withRound(s, { ...r, order: playOrder(s, r), current: 0 }),
    phase: 'listening',
    playback: { isPlaying: false, positionMs: 0, updatedAt: now },
  }
}

function loadTrack(s: GameState, index: number, autoplay: boolean, now: number): GameState {
  const r = currentRound(s)!
  return {
    ...withRound(s, { ...r, current: index }),
    playback: { isPlaying: autoplay, positionMs: 0, updatedAt: now },
  }
}

/**
 * The whole game's rules. Pure function: (state, action, who did it) -> new state.
 * The same rules run in demo mode and (later) online mode.
 */
export function reduce(s: GameState, a: Action, actorId: string, now = clock.now()): GameState {
  const isHost = actorId === s.hostId
  const actor = playerById(s, actorId)
  if (a.type !== 'join' && !actor) fail('You are not in this game.')
  const round = currentRound(s)
  const isAsker = askerOf(s)?.id === actorId

  switch (a.type) {
    case 'join': {
      if (s.players.some((p) => p.id === a.player.id)) return s
      if (s.players.length >= MAX_PLAYERS) fail('This game is full.')
      const name = a.player.name.trim().slice(0, 24)
      if (!name) fail('Pick a name first.')
      return { ...s, players: [...s.players, { ...a.player, name }] }
    }

    case 'leave': {
      if (a.playerId !== actorId && !isHost) fail('Only the host can remove players.')
      const players = s.players.filter((p) => p.id !== a.playerId)
      const hostId = s.hostId === a.playerId ? (players[0]?.id ?? s.hostId) : s.hostId
      return { ...s, players, hostId, turn: players.length ? s.turn % players.length : 0 }
    }

    case 'start': {
      if (s.phase !== 'lobby') fail('The game already started.')
      if (!isHost) fail('Only the host can start the game.')
      if (s.players.length < MIN_PLAYERS) fail(`You need at least ${MIN_PLAYERS} players.`)
      return { ...s, phase: 'asking', turn: 0 }
    }

    case 'ask': {
      if (s.phase !== 'asking') fail('It is not time to ask a question.')
      if (!isAsker && !isHost) fail("It's not your turn to ask.")
      const prompt = a.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
      if (!prompt) fail('Write a question first.')
      const r: Round = {
        id: `r${s.rounds.length + 1}_${now}`,
        number: s.rounds.length + 1,
        askerId: askerOf(s)!.id,
        prompt,
        themeId: a.themeId,
        picks: [],
        order: [],
        current: 0,
        startedAt: now,
      }
      return { ...s, phase: 'picking', rounds: [...s.rounds, r] }
    }

    case 'pick': {
      if (s.phase !== 'picking' || !round) fail('Picking is closed.')
      const pick: Pick = {
        playerId: actorId,
        track: a.track,
        note: a.note?.trim().slice(0, MAX_NOTE_LENGTH) || undefined,
        pickedAt: now,
      }
      const picks = [...round!.picks.filter((p) => p.playerId !== actorId), pick]
      const next = withRound(s, { ...round!, picks })
      return picks.length >= s.players.length ? startListening(next, now) : next
    }

    case 'unpick': {
      if (s.phase !== 'picking' || !round) fail('Picking is closed.')
      return withRound(s, { ...round!, picks: round!.picks.filter((p) => p.playerId !== actorId) })
    }

    case 'startListening': {
      if (s.phase !== 'picking' || !round) fail('Nothing to listen to yet.')
      if (!isAsker && !isHost) fail('Only the asker or host can start early.')
      if (!round!.picks.length) fail('Nobody has picked a song yet.')
      return startListening(s, now)
    }

    case 'play': {
      if (s.phase !== 'listening') fail('Nothing is playing.')
      const pos = playbackPosition(s, now)
      const ended = pos >= (currentPick(s)?.track.durationMs ?? 0) - 250
      return { ...s, playback: { isPlaying: true, positionMs: ended ? 0 : pos, updatedAt: now } }
    }

    case 'pause':
      if (s.phase !== 'listening') return s
      return { ...s, playback: { isPlaying: false, positionMs: playbackPosition(s, now), updatedAt: now } }

    case 'seek': {
      if (s.phase !== 'listening') return s
      const max = currentPick(s)?.track.durationMs ?? 0
      const positionMs = Math.min(Math.max(0, a.positionMs), max)
      return { ...s, playback: { ...s.playback, positionMs, updatedAt: now } }
    }

    case 'trackEnded': {
      if (s.phase !== 'listening') return s
      const max = currentPick(s)?.track.durationMs ?? 0
      return { ...s, playback: { isPlaying: false, positionMs: max, updatedAt: now } }
    }

    case 'next': {
      if (s.phase !== 'listening' || !round) return s
      if (a.from !== undefined && a.from !== round!.current) return s
      if (round!.current < round!.order.length - 1) return loadTrack(s, round!.current + 1, true, now)
      return { ...s, phase: 'between', playback: { isPlaying: false, positionMs: 0, updatedAt: now } }
    }

    case 'prev': {
      if (s.phase !== 'listening' || !round) return s
      if (a.from !== undefined && a.from !== round!.current) return s
      if (playbackPosition(s, now) > 3000 || round!.current === 0) return loadTrack(s, round!.current, s.playback.isPlaying, now)
      return loadTrack(s, round!.current - 1, true, now)
    }

    case 'jump': {
      if (s.phase !== 'listening' || !round) return s
      if (a.index < 0 || a.index >= round!.order.length) return s
      if (a.index > round!.current) fail("No peeking! Songs are revealed in order.")
      return loadTrack(s, a.index, true, now)
    }

    case 'nextRound': {
      if (s.phase !== 'between' && s.phase !== 'listening') fail('Finish this round first.')
      return {
        ...s,
        phase: 'asking',
        turn: (s.turn + 1) % s.players.length,
        playback: { isPlaying: false, positionMs: 0, updatedAt: now },
      }
    }

    case 'end': {
      if (!isHost) fail('Only the host can end the game.')
      return { ...s, phase: 'recap', playback: { isPlaying: false, positionMs: 0, updatedAt: now } }
    }
  }
}
