import { ExternalLink, MessageCircle, Pause, Play, SkipBack, SkipForward, Speaker } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { AlbumArt, Equalizer, PlayerAvatar, PromptCard } from '@/components/game-ui'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { currentPick, currentRound, playbackPosition, playerById } from '@/game/engine'
import { useGame, useNow } from '@/hooks/use-game'
import { spotifySearchUrl } from '@/music/search'
import { cn, formatTime } from '@/lib/utils'

export function ListeningScreen() {
  const { state, dispatch, meId, client } = useGame()
  const host = playerById(state, state.hostId)
  const round = currentRound(state)!
  const pick = currentPick(state)!
  const picker = playerById(state, pick.playerId)
  const asker = playerById(state, round.askerId)
  const { isPlaying } = state.playback
  const now = useNow(isPlaying)
  const pos = playbackPosition(state, now)
  const dur = pick.track.durationMs
  const ended = !isPlaying && pos >= dur - 250
  const fresh = !isPlaying && pos === 0
  const isLast = round.current === round.order.length - 1
  const pct = Math.min(100, (pos / dur) * 100)

  return (
    <div className="grid gap-6 py-4 md:grid-cols-[1fr_320px] md:gap-8">
      <div className="grid min-w-0 content-start gap-5">
        <PromptCard prompt={round.prompt} asker={asker} compact />

        <AnimatePresence mode="wait">
          <motion.div
            key={pick.playerId}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="grid justify-items-center gap-5 text-center"
          >
            {/* Record + sleeve */}
            <div className="relative w-[min(62vw,300px)]">
              <div
                className={cn(
                  'vinyl absolute inset-y-[4%] right-0 aspect-square rounded-full transition-transform duration-700 ease-out',
                  isPlaying ? 'translate-x-[24%] animate-spin-slow' : 'translate-x-[6%]',
                )}
                style={{ width: '92%' }}
              >
                <div className="absolute inset-[34%] overflow-hidden rounded-full">
                  <AlbumArt track={pick.track} rounded="rounded-full" className="size-full" />
                </div>
              </div>
              <AlbumArt track={pick.track} className="relative w-full shadow-[0_24px_48px_-20px_rgb(40_30_80/0.45)]" />
            </div>

            <div className="grid gap-1">
              <h2 className="text-3xl font-medium font-soft sm:text-4xl">{pick.track.title}</h2>
              <p className="text-lg text-muted-foreground">{pick.track.artist}</p>
            </div>

            {picker && (
              <div className="flex items-center gap-2 rounded-full bg-secondary py-1 pr-4 pl-1 text-secondary-foreground">
                <PlayerAvatar player={picker} size="sm" />
                <span className="text-sm font-medium">Picked by {picker.id === meId ? 'you' : picker.name}</span>
                <Equalizer playing={isPlaying} className="ml-1 text-accent" />
              </div>
            )}
            {pick.note && <p className="max-w-sm text-balance text-muted-foreground italic">“{pick.note}”</p>}
          </motion.div>
        </AnimatePresence>

        {/* Progress */}
        <div className="mx-auto grid w-full max-w-md gap-1.5">
          <div
            className="group relative h-1.5 cursor-pointer rounded-full bg-muted"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              dispatch({ type: 'seek', positionMs: ((e.clientX - r.left) / r.width) * dur })
            }}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--text-grad-1),var(--text-grad-2))]" style={{ width: `${pct}%` }} />
            <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground opacity-0 shadow transition-opacity group-hover:opacity-100" style={{ left: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(pos)}</span>
            <span>{pick.track.previewUrl || pick.track.source === 'demo' ? 'Preview · ' : ''}{formatTime(dur)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'prev' })} aria-label="Previous">
            <SkipBack className="size-6" />
          </Button>
          <Button
            variant="brand"
            size="icon-lg"
            onClick={() => dispatch({ type: isPlaying ? 'pause' : 'play' })}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="size-7" fill="currentColor" /> : <Play className="size-7 translate-x-0.5" fill="currentColor" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'next' })} aria-label={isLast ? 'Finish round' : 'Next song'}>
            <SkipForward className="size-6" />
          </Button>
        </div>

        {!client.isSpeaker && host && (
          <p className="-mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Speaker className="size-3.5" /> Playing on {host.name}'s device
          </p>
        )}

        <AnimatePresence>
          {(ended || (!isPlaying && !fresh)) && picker && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="mx-auto flex max-w-md items-start gap-3 p-4">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-accent" />
                <div className="grid gap-3">
                  <p>
                    <span className="font-semibold">{picker.id === meId ? 'Your turn to talk' : `${picker.name}, tell us`}</span>
                    <span className="text-muted-foreground"> — what does this song mean to you?</span>
                  </p>
                  <Button variant={ended ? 'brand' : 'secondary'} size="sm" className="justify-self-start" onClick={() => dispatch({ type: 'next' })}>
                    {isLast ? 'Finish round' : 'Next song'} <SkipForward />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-2 text-sm">
          <Button variant="link" size="sm" asChild>
            <a href={spotifySearchUrl(pick.track)} target="_blank" rel="noreferrer">
              Open in Spotify <ExternalLink />
            </a>
          </Button>
          {pick.track.externalUrl && (
            <Button variant="link" size="sm" asChild>
              <a href={pick.track.externalUrl} target="_blank" rel="noreferrer">
                Apple Music <ExternalLink />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Queue */}
      <aside className="md:sticky md:top-20 md:self-start">
        <Card className="p-3">
          <h3 className="px-2 pt-1 pb-2 text-lg font-medium font-soft">This round's mixtape</h3>
          <ol className="grid gap-1">
            {round.order.map((pid, i) => {
              const p = round.picks.find((x) => x.playerId === pid)!
              const who = playerById(state, pid)
              const revealed = i <= round.current
              const active = i === round.current
              return (
                <li key={pid}>
                  <button
                    disabled={!revealed}
                    onClick={() => dispatch({ type: 'jump', index: i })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors',
                      revealed && 'cursor-pointer hover:bg-muted',
                      active && 'bg-secondary',
                    )}
                  >
                    <AlbumArt track={p.track} hidden={!revealed} className="size-11 shrink-0" rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{revealed ? p.track.title : 'Mystery song'}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {revealed ? p.track.artist : `${who?.id === meId ? 'Your' : `${who?.name}'s`} pick`}
                      </div>
                    </div>
                    {who && <PlayerAvatar player={who} size="sm" />}
                  </button>
                </li>
              )
            })}
          </ol>
        </Card>
      </aside>
    </div>
  )
}
