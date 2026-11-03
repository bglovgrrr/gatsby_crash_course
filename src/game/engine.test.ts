import { describe, expect, it } from 'vitest'
import {
  askerOf,
  createGame,
  currentPick,
  currentRound,
  GameError,
  MAX_PLAYERS,
  playbackPosition,
  reduce,
} from './engine'
import type { Action, GameState, Player, Track } from './types'

// ---------- helpers ----------
const T0 = 1_000_000
const player = (id: string, name = id): Player => ({ id, name, color: '#cfcaff' })
const track = (id: string, durationMs = 30_000): Track => ({ id, title: `Song ${id}`, artist: 'Artist', durationMs, source: 'demo' })

/** Apply actions in order; each item is [actorId, action, time?]. */
function play(s: GameState, steps: [string, Action, number?][]) {
  return steps.reduce((acc, [who, action, now]) => reduce(acc, action, who, now ?? T0), s)
}

/** A started game with players a (host), b, c and the asker on turn 0 (a). */
function started(n = 3) {
  const ids = ['a', 'b', 'c', 'd', 'e'].slice(0, n)
  let s = createGame(player('a'), 'ABCD', T0)
  for (const id of ids.slice(1)) s = reduce(s, { type: 'join', player: player(id) }, id, T0)
  return reduce(s, { type: 'start' }, 'a', T0)
}

/** Everyone has picked: now listening. */
function listening(n = 3) {
  const s = started(n)
  const ids = s.players.map((p) => p.id)
  return play(s, [['a', { type: 'ask', prompt: 'A song for a rainy day' }], ...ids.map((id): [string, Action] => [id, { type: 'pick', track: track(id) }])])
}

const expectError = (fn: () => unknown, msg: RegExp) => {
  expect(fn).toThrow(GameError)
  expect(fn).toThrow(msg)
}

// ---------- lobby ----------
describe('lobby', () => {
  it('creates a game with the host as the only player', () => {
    const s = createGame(player('a', 'Brian'), 'WXYZ', T0)
    expect(s).toMatchObject({ code: 'WXYZ', hostId: 'a', phase: 'lobby', turn: 0, rounds: [] })
    expect(s.players.map((p) => p.name)).toEqual(['Brian'])
  })

  it('lets players join, trims names, and ignores a second join', () => {
    let s = createGame(player('a'), 'ABCD', T0)
    s = reduce(s, { type: 'join', player: player('b', '  Maya  ') }, 'b')
    const again = reduce(s, { type: 'join', player: player('b', 'Maya') }, 'b')
    expect(s.players.map((p) => p.name)).toEqual(['a', 'Maya'])
    expect(again).toBe(s)
  })

  it('rejects blank names and full games', () => {
    const s = createGame(player('a'), 'ABCD', T0)
    expectError(() => reduce(s, { type: 'join', player: player('b', '   ') }, 'b'), /name/)
    let full = s
    for (let i = 1; i < MAX_PLAYERS; i++) full = reduce(full, { type: 'join', player: player(`p${i}`) }, `p${i}`)
    expect(full.players).toHaveLength(MAX_PLAYERS)
    expectError(() => reduce(full, { type: 'join', player: player('late') }, 'late'), /full/)
  })

  it('only lets the host start, and only with 2+ players', () => {
    const solo = createGame(player('a'), 'ABCD', T0)
    expectError(() => reduce(solo, { type: 'start' }, 'a'), /at least 2/)
    const duo = reduce(solo, { type: 'join', player: player('b') }, 'b')
    expectError(() => reduce(duo, { type: 'start' }, 'b'), /host/)
    expect(reduce(duo, { type: 'start' }, 'a').phase).toBe('asking')
  })

  it('rejects actions from people who are not in the game', () => {
    expectError(() => reduce(started(), { type: 'ask', prompt: 'hi' }, 'stranger'), /not in this game/)
  })
})

// ---------- asking ----------
describe('asking', () => {
  it('lets the asker ask, trimming the question and opening picks', () => {
    const s = reduce(started(), { type: 'ask', prompt: '  Your karaoke song  ', themeId: 'hype' }, 'a')
    expect(s.phase).toBe('picking')
    expect(currentRound(s)).toMatchObject({ number: 1, askerId: 'a', prompt: 'Your karaoke song', themeId: 'hype', picks: [] })
  })

  it("stops other players from asking on someone else's turn", () => {
    expectError(() => reduce(started(), { type: 'ask', prompt: 'Hi' }, 'b'), /not your turn/)
  })

  it("lets the host ask when it's someone else's turn (stuck asker)", () => {
    const s = play(listening(), [['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'nextRound' }]])
    expect(askerOf(s)!.id).toBe('b')
    const asked = reduce(s, { type: 'ask', prompt: 'Q2' }, 'a')
    expect(currentRound(asked)!.askerId).toBe('b')
  })

  it('rejects an empty question', () => {
    expectError(() => reduce(started(), { type: 'ask', prompt: '   ' }, 'a'), /question/)
  })
})

// ---------- picking ----------
describe('picking', () => {
  const asked = () => reduce(started(), { type: 'ask', prompt: 'Q' }, 'a')

  it('keeps one pick per player; picking again replaces it', () => {
    let s = reduce(asked(), { type: 'pick', track: track('first') }, 'b')
    s = reduce(s, { type: 'pick', track: track('second'), note: '  long story  ' }, 'b')
    const picks = currentRound(s)!.picks
    expect(picks).toHaveLength(1)
    expect(picks[0]).toMatchObject({ playerId: 'b', note: 'long story' })
    expect(picks[0].track.id).toBe('second')
  })

  it('lets a player take their pick back', () => {
    const s = play(asked(), [['b', { type: 'pick', track: track('x') }], ['b', { type: 'unpick' }]])
    expect(currentRound(s)!.picks).toHaveLength(0)
  })

  it('starts listening automatically when everyone has picked, asker first', () => {
    const s = listening()
    expect(s.phase).toBe('listening')
    expect(currentRound(s)!.order).toEqual(['a', 'b', 'c'])
    expect(currentPick(s)!.playerId).toBe('a')
    expect(s.playback.isPlaying).toBe(false)
  })

  it('goes around the circle starting from the asker', () => {
    let s = play(started(), [['a', { type: 'ask', prompt: 'Q' }], ...['a', 'b', 'c'].map((id): [string, Action] => [id, { type: 'pick', track: track(id) }])])
    s = play(s, [['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'nextRound' }]])
    expect(askerOf(s)!.id).toBe('b')
    s = play(s, [['b', { type: 'ask', prompt: 'Q2' }], ...['c', 'a', 'b'].map((id): [string, Action] => [id, { type: 'pick', track: track(id) }])])
    expect(currentRound(s)!.order).toEqual(['b', 'c', 'a'])
  })

  it('lets the asker start early, but not with zero picks and not other players', () => {
    const s = asked()
    expectError(() => reduce(s, { type: 'startListening' }, 'a'), /Nobody/)
    const one = reduce(s, { type: 'pick', track: track('b') }, 'b')
    expectError(() => reduce(one, { type: 'startListening' }, 'c'), /asker or host/)
    const early = reduce(one, { type: 'startListening' }, 'a')
    expect(early.phase).toBe('listening')
    expect(currentRound(early)!.order).toEqual(['b'])
  })

  it('closes picking once listening starts', () => {
    expectError(() => reduce(listening(), { type: 'pick', track: track('late') }, 'a'), /closed/)
  })
})

// ---------- listening ----------
describe('listening & playback', () => {
  it('tracks position from the time play was pressed', () => {
    const s = reduce(listening(), { type: 'play' }, 'b', T0)
    expect(s.playback).toEqual({ isPlaying: true, positionMs: 0, updatedAt: T0 })
    expect(playbackPosition(s, T0 + 4_000)).toBe(4_000)
    const paused = reduce(s, { type: 'pause' }, 'c', T0 + 4_000)
    expect(paused.playback).toMatchObject({ isPlaying: false, positionMs: 4_000 })
    expect(playbackPosition(paused, T0 + 60_000)).toBe(4_000)
  })

  it('never reports a position past the end of the song', () => {
    const s = reduce(listening(), { type: 'play' }, 'a', T0)
    expect(playbackPosition(s, T0 + 999_999)).toBe(30_000)
  })

  it('clamps seeking to the song', () => {
    const s = listening()
    expect(reduce(s, { type: 'seek', positionMs: -50 }, 'a').playback.positionMs).toBe(0)
    expect(reduce(s, { type: 'seek', positionMs: 90_000 }, 'a').playback.positionMs).toBe(30_000)
  })

  it('stops at the end of a song, and play after that starts it over', () => {
    const ended = reduce(listening(), { type: 'trackEnded' }, 'a', T0)
    expect(ended.playback).toMatchObject({ isPlaying: false, positionMs: 30_000 })
    expect(reduce(ended, { type: 'play' }, 'a', T0 + 10).playback).toMatchObject({ isPlaying: true, positionMs: 0 })
  })

  it('next plays the following song, and after the last one the round ends', () => {
    let s = reduce(listening(), { type: 'next' }, 'c', T0)
    expect(currentRound(s)!.current).toBe(1)
    expect(s.playback.isPlaying).toBe(true)
    s = play(s, [['c', { type: 'next' }], ['c', { type: 'next' }]])
    expect(s.phase).toBe('between')
  })

  it('ignores a duplicate next/prev tap aimed at a song that already changed', () => {
    const s = listening()
    const once = reduce(s, { type: 'next', from: 0 }, 'a')
    const twice = reduce(once, { type: 'next', from: 0 }, 'b')
    expect(currentRound(twice)!.current).toBe(1)
    expect(twice).toBe(once)
    expect(reduce(once, { type: 'prev', from: 0 }, 'b')).toBe(once)
  })

  it('prev restarts the song if more than 3s in, otherwise goes back', () => {
    const second = reduce(listening(), { type: 'next' }, 'a', T0)
    expect(currentRound(reduce(second, { type: 'prev' }, 'a', T0 + 1_000))!.current).toBe(0)
    const restarted = reduce(second, { type: 'prev' }, 'a', T0 + 5_000)
    expect(currentRound(restarted)!.current).toBe(1)
    expect(restarted.playback.positionMs).toBe(0)
  })

  it('lets you jump back to a revealed song but not peek ahead', () => {
    const s = play(listening(), [['a', { type: 'next' }]])
    expect(currentRound(reduce(s, { type: 'jump', index: 0 }, 'b'))!.current).toBe(0)
    expectError(() => reduce(s, { type: 'jump', index: 2 }, 'b'), /peeking/)
  })
})

// ---------- rounds & leaving ----------
describe('rounds, ending and leaving', () => {
  it('passes the question to the next player and wraps around', () => {
    let s = started(2)
    for (const expected of ['a', 'b', 'a']) {
      expect(askerOf(s)!.id).toBe(expected)
      s = play(s, [[expected, { type: 'ask', prompt: 'Q' }], ['a', { type: 'pick', track: track('a') }], ['b', { type: 'pick', track: track('b') }], ['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'nextRound' }]])
    }
    expect(s.rounds).toHaveLength(3)
  })

  it('only lets the host end the game', () => {
    expectError(() => reduce(listening(), { type: 'end' }, 'b'), /host/)
    const s = reduce(listening(), { type: 'end' }, 'a')
    expect(s.phase).toBe('recap')
    expect(s.playback.isPlaying).toBe(false)
  })

  it('hands the host role to the next player when the host leaves', () => {
    const s = reduce(started(), { type: 'leave', playerId: 'a' }, 'a')
    expect(s.hostId).toBe('b')
    expect(s.players.map((p) => p.id)).toEqual(['b', 'c'])
  })

  it("keeps the turn valid when players leave, and doesn't let players remove each other", () => {
    // Finish two rounds so it's c's turn (turn = 2), then c leaves.
    const round = (s: GameState, asker: string) =>
      play(s, [[asker, { type: 'ask', prompt: 'Q' }], ...['a', 'b', 'c'].map((id): [string, Action] => [id, { type: 'pick', track: track(id) }]), ['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'next' }], ['a', { type: 'nextRound' }]])
    const s = round(round(started(), 'a'), 'b')
    expect(askerOf(s)!.id).toBe('c')
    expectError(() => reduce(s, { type: 'leave', playerId: 'c' }, 'b'), /host/)
    const after = reduce(s, { type: 'leave', playerId: 'c' }, 'c')
    expect(after.players).toHaveLength(2)
    expect(after.turn).toBeLessThan(after.players.length)
    expect(askerOf(after)).toBeDefined()
  })

  it('never mutates the state it was given', () => {
    const s = listening()
    const snapshot = structuredClone(s)
    reduce(s, { type: 'play' }, 'a')
    reduce(s, { type: 'next' }, 'a')
    reduce(s, { type: 'end' }, 'a')
    expect(s).toEqual(snapshot)
  })
})
