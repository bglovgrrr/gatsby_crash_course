import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { currentPick, playbackPosition } from '@/game/engine'
import { useGame, useNow } from '@/hooks/use-game'

/**
 * Plays the current song on the "speaker" device and keeps it in sync with the shared
 * playback state. Songs without audio (offline demo) are simulated with a timer.
 */
export function AudioEngine() {
  const { state, dispatch, client } = useGame()
  const audio = useRef<HTMLAudioElement | null>(null)
  const pick = currentPick(state)
  const src = pick?.track.previewUrl
  const { isPlaying } = state.playback
  const now = useNow(isPlaying && !src, 300)

  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    audio.current = el
    return () => {
      el.pause()
      el.src = ''
    }
  }, [])

  // Load the song
  useEffect(() => {
    const el = audio.current
    if (!el) return
    if (src) {
      if (el.src !== src) el.src = src
    } else {
      el.pause()
      el.removeAttribute('src')
    }
  }, [src])

  // Follow play / pause / seek
  useEffect(() => {
    const el = audio.current
    if (!el || !src || !client.isSpeaker) return
    const target = playbackPosition(state) / 1000
    if (Math.abs(el.currentTime - target) > 1) el.currentTime = target
    if (isPlaying) {
      el.play().catch(() => {
        toast('Tap play to start the music', { description: 'Your browser blocked autoplay.' })
        dispatch({ type: 'pause' })
      })
    } else el.pause()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isPlaying, state.playback.positionMs, state.playback.updatedAt])

  // Song finished
  useEffect(() => {
    const el = audio.current
    if (!el || !client.isSpeaker) return
    const onEnded = () => dispatch({ type: 'trackEnded' })
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  // Simulated playback end (no audio)
  useEffect(() => {
    if (!client.isSpeaker || src || !isPlaying || !pick) return
    if (playbackPosition(state, now) >= pick.track.durationMs) dispatch({ type: 'trackEnded' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  return null
}
