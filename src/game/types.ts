export type Track = {
  id: string
  title: string
  artist: string
  album?: string
  artwork?: string
  /** 30s preview clip (iTunes). Full playback comes later via Spotify. */
  previewUrl?: string
  /** Length of what we can actually play, in ms. */
  durationMs: number
  externalUrl?: string
  source: 'itunes' | 'demo' | 'spotify'
  /** Used to draw a gradient cover when there is no artwork. */
  hue?: number
}

export type Player = {
  id: string
  name: string
  color: string
  isBot?: boolean
}

export type Pick = {
  playerId: string
  track: Track
  /** Optional "why I picked it", revealed when the song plays. */
  note?: string
  pickedAt: number
}

export type Round = {
  id: string
  number: number
  askerId: string
  prompt: string
  themeId?: string
  picks: Pick[]
  /** Player ids in play order (only players who picked). */
  order: string[]
  /** Index into `order` of the song that is up now. */
  current: number
  startedAt: number
}

export type Phase = 'lobby' | 'asking' | 'picking' | 'listening' | 'between' | 'recap'

/** Shared playback state. Position is `positionMs` at time `updatedAt`. */
export type Playback = {
  isPlaying: boolean
  positionMs: number
  updatedAt: number
}

export type GameState = {
  id: string
  code: string
  hostId: string
  phase: Phase
  players: Player[]
  rounds: Round[]
  /** Whose turn it is to ask: index into `players`. */
  turn: number
  playback: Playback
  createdAt: number
}

export type Action =
  | { type: 'join'; player: Player }
  | { type: 'leave'; playerId: string }
  | { type: 'start' }
  | { type: 'ask'; prompt: string; themeId?: string }
  | { type: 'pick'; track: Track; note?: string }
  | { type: 'unpick' }
  | { type: 'startListening' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'seek'; positionMs: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'jump'; index: number }
  | { type: 'trackEnded' }
  | { type: 'nextRound' }
  | { type: 'end' }
