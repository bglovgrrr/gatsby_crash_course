import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ThemeChoice, useTheme } from '@/hooks/use-theme'

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<ThemeChoice, string> = { system: 'Theme: match device', light: 'Theme: light', dark: 'Theme: dark' }

/** Cycles device → light → dark. */
export function ThemeToggle() {
  const { choice, setTheme } = useTheme()
  const Icon = choice === 'light' ? Sun : choice === 'dark' ? Moon : Monitor
  return (
    <Button variant="ghost" size="icon-sm" onClick={() => setTheme(NEXT[choice])} aria-label={LABEL[choice]} title={LABEL[choice]}>
      <Icon />
    </Button>
  )
}
