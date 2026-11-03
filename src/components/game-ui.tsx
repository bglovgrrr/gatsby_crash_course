import { Check, Disc3 } from 'lucide-react'
import { useState } from 'react'
import type { Player, Track } from '@/game/types'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="brand-gradient grid size-8 place-items-center rounded-xl text-white shadow-md shadow-fuchsia-500/30">
        <Disc3 className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">Side B</span>
    </div>
  )
}

export function PlayerAvatar({
  player,
  size = 'md',
  done,
  ring,
  className,
}: {
  player: Player
  size?: 'sm' | 'md' | 'lg' | 'xl'
  done?: boolean
  ring?: boolean
  className?: string
}) {
  const sizes = { sm: 'size-7 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }
  return (
    <span className={cn('relative inline-grid shrink-0', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-full font-display font-bold text-white shadow-sm',
          sizes[size],
          ring && 'ring-2 ring-offset-2 ring-offset-background',
        )}
        style={{ backgroundColor: player.color, ...(ring ? { ['--tw-ring-color' as string]: player.color } : {}) }}
        title={player.name}
      >
        {player.name.slice(0, 1).toUpperCase()}
      </span>
      {done && (
        <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-background bg-emerald-500 text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </span>
  )
}

export function AvatarStack({ players, max = 5 }: { players: Player[]; max?: number }) {
  return (
    <div className="flex -space-x-2">
      {players.slice(0, max).map((p) => (
        <PlayerAvatar key={p.id} player={p} size="sm" className="rounded-full ring-2 ring-background" />
      ))}
      {players.length > max && (
        <span className="grid size-7 place-items-center rounded-full bg-muted text-xs ring-2 ring-background">
          +{players.length - max}
        </span>
      )}
    </div>
  )
}

/** Album cover, or a generated gradient cover when there's no artwork. `hidden` = mystery song. */
export function AlbumArt({
  track,
  hidden,
  className,
  rounded = 'rounded-xl',
}: {
  track?: Track
  hidden?: boolean
  className?: string
  rounded?: string
}) {
  const [broken, setBroken] = useState(false)
  if (hidden || !track) {
    return (
      <div className={cn('relative grid aspect-square place-items-center overflow-hidden bg-muted', rounded, className)}>
        <Disc3 className="size-1/2 text-muted-foreground/40" />
        <span className="absolute font-display text-lg font-bold text-muted-foreground">?</span>
      </div>
    )
  }
  if (track.artwork && !broken) {
    return (
      <img
        src={track.artwork}
        alt=""
        onError={() => setBroken(true)}
        className={cn('aspect-square object-cover', rounded, className)}
        draggable={false}
      />
    )
  }
  const hue = track.hue ?? [...track.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return (
    <div
      className={cn('relative flex aspect-square flex-col justify-end overflow-hidden p-[8%] text-white [container-type:inline-size]', rounded, className)}
      style={{
        background: `radial-gradient(circle at 30% 20%, hsl(${hue} 90% 70%), transparent 60%), linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 30%))`,
      }}
    >
      <span className="line-clamp-3 font-display text-[clamp(0.4rem,11cqw,2rem)] leading-tight font-bold drop-shadow-sm">
        {track.title}
      </span>
    </div>
  )
}

export function PromptCard({ prompt, asker, compact }: { prompt: string; asker?: Player; compact?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl brand-gradient text-white shadow-lg shadow-fuchsia-500/20', compact ? 'p-4' : 'p-5 sm:p-6')}>
      <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
      {asker && (
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/85">
          <PlayerAvatar player={asker} size="sm" className="rounded-full ring-2 ring-white/40" />
          {asker.name} asks
        </div>
      )}
      <p className={cn('font-display font-bold leading-snug text-balance', compact ? 'text-lg' : 'text-2xl sm:text-3xl')}>
        “{prompt}”
      </p>
    </div>
  )
}

export function Equalizer({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex h-3.5 items-end gap-[2px]', className)} aria-hidden>
      {[0, 0.2, 0.4, 0.1].map((d, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full bg-current', playing ? 'eq-bar' : 'h-1')}
          style={playing ? { animationDelay: `${d}s`, height: '100%' } : undefined}
        />
      ))}
    </span>
  )
}

export function TrackRow({
  track,
  onClick,
  right,
  active,
}: {
  track: Track
  onClick?: () => void
  right?: React.ReactNode
  active?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors',
        onClick && 'cursor-pointer hover:bg-muted active:bg-muted',
        active && 'bg-secondary',
      )}
    >
      <AlbumArt track={track} className="size-12 shrink-0" rounded="rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{track.title}</div>
        <div className="truncate text-sm text-muted-foreground">{track.artist}</div>
      </div>
      {right}
    </Comp>
  )
}
