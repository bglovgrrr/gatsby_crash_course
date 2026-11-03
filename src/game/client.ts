import type { Action, GameState } from './types'

/**
 * How the UI talks to a game. Demo mode runs everything on this device with bots;
 * online mode (next step: Supabase) will sync the same state between phones.
 */
export interface GameClient {
  readonly mode: 'demo' | 'online'
  readonly meId: string
  /** True when this device plays the audio (the one hooked up to the speaker). */
  readonly isSpeaker: boolean
  getState(): GameState
  subscribe(listener: () => void): () => void
  dispatch(action: Action): void
  dispose(): void
}
