import { Copy, Home, ListMusic } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { PlayerAvatar, TrackRow } from '@/components/game-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { playerById } from '@/game/engine'
import { useGame } from '@/hooks/use-game'

export function RecapScreen({ onExit }: { onExit: () => void }) {
  const { state } = useGame()
  const rounds = state.rounds.filter((r) => r.order.length > 0)
  const songs = rounds.reduce((n, r) => n + r.order.length, 0)

  const copyList = async () => {
    const text = rounds
      .map((r) => {
        const lines = r.order.map((pid) => {
          const p = r.picks.find((x) => x.playerId === pid)!
          return `  • ${p.track.title} — ${p.track.artist} (${playerById(state, pid)?.name ?? '?'})`
        })
        return `“${r.prompt}”\n${lines.join('\n')}`
      })
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(`Side B — game ${state.code}\n\n${text}`)
      toast.success('Song list copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto grid w-full max-w-2xl gap-6 py-6">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold">
          That's a <span className="brand-text">wrap</span>.
        </h2>
        <p className="mt-2 text-muted-foreground">
          {rounds.length} {rounds.length === 1 ? 'question' : 'questions'} · {songs} songs · {state.players.length} friends
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" disabled>
          <ListMusic /> Save to Spotify <Badge variant="secondary">Soon</Badge>
        </Button>
        <Button variant="outline" onClick={copyList} disabled={!songs}>
          <Copy /> Copy song list
        </Button>
      </div>

      {rounds.map((r) => (
        <Card key={r.id} className="p-3">
          <div className="flex items-start gap-3 px-2 pt-1 pb-3">
            {playerById(state, r.askerId) && <PlayerAvatar player={playerById(state, r.askerId)!} size="sm" />}
            <p className="font-display text-lg leading-snug font-bold">“{r.prompt}”</p>
          </div>
          {r.order.map((pid) => {
            const p = r.picks.find((x) => x.playerId === pid)!
            const who = playerById(state, pid)
            return <TrackRow key={pid} track={p.track} right={who && <span className="text-sm text-muted-foreground">{who.name}</span>} />
          })}
        </Card>
      ))}

      <Button variant="brand" size="lg" onClick={onExit}>
        <Home /> Back to start
      </Button>
    </motion.div>
  )
}
