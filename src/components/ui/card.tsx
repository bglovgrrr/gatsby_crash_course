import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-2xl border bg-card/80 text-card-foreground shadow-sm backdrop-blur', className)}
      {...props}
    />
  )
}

export { Card }
