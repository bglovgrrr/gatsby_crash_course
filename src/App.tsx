import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { AudioEngine } from '@/components/audio-engine'
import { Toaster } from '@/components/ui/sonner'
import type { GameClient } from '@/game/client'
import { LocalGameClient } from '@/game/local-client'
import { GameContext, useGame } from '@/hooks/use-game'
import { AskingScreen } from '@/screens/asking'
import { BetweenScreen } from '@/screens/between'
import { GameShell } from '@/screens/game-shell'
import { HomeScreen } from '@/screens/home'
import { ListeningScreen } from '@/screens/listening'
import { LobbyScreen } from '@/screens/lobby'
import { PickingScreen } from '@/screens/picking'
import { RecapScreen } from '@/screens/recap'

function Game({ onExit }: { onExit: () => void }) {
  const { state, client } = useGame()
  const screens = {
    lobby: <LobbyScreen />,
    asking: <AskingScreen />,
    picking: <PickingScreen />,
    listening: <ListeningScreen />,
    between: <BetweenScreen />,
    recap: <RecapScreen onExit={onExit} />,
  }
  return (
    <GameShell onExit={onExit}>
      {client.isSpeaker && state.phase === 'listening' && <AudioEngine />}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${state.phase}-${state.rounds.length}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex flex-1 flex-col"
        >
          {screens[state.phase]}
        </motion.div>
      </AnimatePresence>
    </GameShell>
  )
}

export default function App() {
  const [client, setClient] = useState<GameClient | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [client])

  const exit = () => {
    client?.dispose()
    setClient(null)
  }

  return (
    <>
      <div className="app-backdrop" />
      {client ? (
        <GameContext.Provider value={client}>
          <Game onExit={exit} />
        </GameContext.Provider>
      ) : (
        <HomeScreen onDemo={(name) => setClient(new LocalGameClient(name))} />
      )}
      <Toaster />
    </>
  )
}
