import { sample, shuffle, uid } from '@/lib/utils'
import { searchTracks } from '@/music/search'
import { DEMO_CATALOG } from '@/music/demo-catalog'
import type { GameClient } from './client'
import { askerOf, createGame, currentRound, reduce } from './engine'
import { ALL_PROMPTS } from './prompts'
import type { Action, GameState, Player, Track } from './types'
import { PLAYER_COLORS } from './colors'

/** Same song regardless of where it came from (demo list or live search). */
const songKey = (t: Track) => `${t.title}|${t.artist}`.toLowerCase()

const BOTS = [
  { name: 'Maya', notes: ['This was on every mixtape I made', 'Instant goosebumps', 'Long story, ask me'] },
  { name: 'Jordan', notes: ['Do not judge me', 'My dad played this every Sunday', 'Windows down, volume up'] },
  { name: 'Theo', notes: ['Still knows every word', 'This one hits different', ''] },
  { name: 'Priya', notes: ['Road trip classic', 'This song saved my senior year', 'Cried to this. A lot.'] },
]

/** Demo game: everything runs on this device, with bot friends who join, ask and pick. */
export class LocalGameClient implements GameClient {
  readonly mode = 'demo' as const
  readonly isSpeaker = true
  readonly meId: string
  private state: GameState
  private listeners = new Set<() => void>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private disposed = false

  constructor(myName: string, botCount = 3) {
    const me: Player = { id: uid('p_'), name: myName, color: PLAYER_COLORS[0] }
    this.meId = me.id
    const code = Array.from({ length: 4 }, () => sample('ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''))).join('')
    this.state = createGame(me, code)

    shuffle(BOTS)
      .slice(0, botCount)
      .forEach((b, i) => {
        const bot: Player = { id: uid('bot_'), name: b.name, color: PLAYER_COLORS[i + 1], isBot: true }
        this.later(`join-${bot.id}`, 700 + i * 900, () => this.apply({ type: 'join', player: bot }, bot.id))
      })
  }

  getState = () => this.state

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispatch = (action: Action) => this.apply(action, this.meId)

  dispose() {
    this.disposed = true
    this.timers.forEach(clearTimeout)
    this.timers.clear()
    this.listeners.clear()
  }

  private apply(action: Action, actorId: string) {
    if (this.disposed) return
    this.state = reduce(this.state, action, actorId) // throws GameError on invalid moves
    this.listeners.forEach((l) => l())
    this.driveBots()
  }

  private later(key: string, ms: number, fn: () => void) {
    if (this.timers.has(key)) return
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key)
        try {
          fn()
        } catch {
          /* a bot move that became invalid; ignore */
        }
      }, ms),
    )
  }

  /** Bots react to the current phase. Each move is scheduled once per round. */
  private driveBots() {
    const s = this.state
    const round = currentRound(s)
    const asker = askerOf(s)

    if (s.phase === 'asking' && asker?.isBot) {
      const { prompt, themeId } = sample(ALL_PROMPTS)
      this.later(`ask-${s.rounds.length}`, 2600, () => this.apply({ type: 'ask', prompt, themeId }, asker.id))
    }

    if (s.phase === 'picking' && round) {
      for (const bot of s.players.filter((p) => p.isBot)) {
        if (round.picks.some((p) => p.playerId === bot.id)) continue
        this.later(`pick-${round.id}-${bot.id}`, 2500 + Math.random() * 5000, async () => {
          const taken = () => (currentRound(this.state)?.picks ?? []).map((p) => songKey(p.track))
          let track = await this.botTrack(taken())
          if (taken().includes(songKey(track))) track = await this.botTrack(taken())
          const notes = BOTS.find((b) => b.name === bot.name)?.notes ?? ['']
          this.apply({ type: 'pick', track, note: sample(notes) }, bot.id)
        })
      }
    }
  }

  /** Pick a random well-known song; use live search to get real artwork + audio when possible. */
  private async botTrack(taken: string[]): Promise<Track> {
    const base = sample(DEMO_CATALOG.filter((t) => !taken.includes(songKey(t))))
    try {
      const { tracks, offline } = await searchTracks(`${base.title} ${base.artist}`)
      if (!offline && tracks[0] && !taken.includes(songKey(tracks[0]))) return tracks[0]
    } catch {
      /* fall through */
    }
    return base
  }
}
