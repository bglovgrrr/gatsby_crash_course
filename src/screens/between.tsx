import { ArrowRight, Flag } from 'lucide-react'
import { motion } from 'motion/react'
import { PlayerAvatar, PromptCard, TrackRow } from '@/components/game-ui'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { currentRound, playerById } from '@/game/engine'
import { useGame } from '@/hooks/use-game'

export function BetweenScreen() {
  const { state, dispatch, isHost, meId } = useGame()
  const round = currentRound(state)!
  const nextAsker = state.players[(state.turn + 1) % state.players.length]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto grid w-full max-w-xl gap-5 py-6">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Round {round.number} complete</p>
        <h2 className="mt-1.5 text-4xl font-medium font-soft">What a mixtape.</h2>
      </div>
      <PromptCard prompt={round.prompt} asker={playerById(state, round.askerId)} compact />
      <Card className="p-2">
        {round.order.map((pid) => {
          const p = round.picks.find((x) => x.playerId === pid)!
          const who = playerById(state, pid)
          return <TrackRow key={pid} track={p.track} right={who && <PlayerAvatar player={who} size="sm" />} />
        })}
      </Card>
      <Button variant="brand" size="lg" onClick={() => dispatch({ type: 'nextRound' })}>
        Next: {nextAsker.id === meId ? 'you ask' : `${nextAsker.name} asks`} <ArrowRight />
      </Button>
      {isHost && (
        <Button variant="ghost" onClick={() => dispatch({ type: 'end' })}>
          <Flag /> End game & see recap
        </Button>
      )}
    </motion.div>
  )
}
