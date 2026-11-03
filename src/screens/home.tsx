import { ArrowRight, Headphones, MessageCircleQuestion, Music2, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Logo } from '@/components/game-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { safeStorage } from '@/lib/utils'

const STEPS = [
  { icon: MessageCircleQuestion, title: 'Ask', text: '“What song reminds you of your dad?”' },
  { icon: Music2, title: 'Pick', text: 'Everyone secretly picks a song.' },
  { icon: Headphones, title: 'Listen & talk', text: 'Play each one and share the story.' },
]

export function HomeScreen({ onDemo }: { onDemo: (name: string) => void }) {
  const [name, setName] = useState(() => safeStorage.get('sideb:name') ?? '')
  const trimmed = name.trim()

  const start = () => {
    if (!trimmed) return
    safeStorage.set('sideb:name', trimmed)
    onDemo(trimmed)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pt-safe pb-safe sm:px-8">
      <header className="flex h-14 items-center">
        <Logo />
      </header>

      <div className="grid flex-1 items-center gap-10 py-8 md:grid-cols-2 md:gap-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge variant="secondary" className="mb-4">
            <Users /> 2–8 friends · one speaker
          </Badge>
          <h1 className="text-5xl leading-[1.05] font-extrabold sm:text-6xl">
            Every song
            <br />
            has a <span className="brand-text">story</span>.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            A music game for friends. Answer a question with a song, then play them all and talk about why.
          </p>

          <ol className="mt-8 grid gap-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="font-semibold">{title}</span>
                  <span className="text-muted-foreground"> — {text}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Card className="p-5 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                start()
              }}
              className="grid gap-4"
            >
              <label className="grid gap-2">
                <span className="text-sm font-medium">Your name</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brian"
                  maxLength={24}
                  autoComplete="nickname"
                  enterKeyHint="go"
                />
              </label>
              <Button type="submit" variant="brand" size="lg" disabled={!trimmed}>
                Play a demo game <ArrowRight />
              </Button>
              <p className="text-center text-xs text-muted-foreground">Demo mode: you play with three bot friends on this device.</p>

              <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> with real friends <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" disabled>
                  Create room
                </Button>
                <Button type="button" variant="outline" disabled>
                  Join with code
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">Online rooms are coming next.</p>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
