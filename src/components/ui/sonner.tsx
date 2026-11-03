import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      theme="system"
      toastOptions={{
        classNames: {
          toast: '!rounded-2xl !border-border !bg-card !text-card-foreground !shadow-lg',
        },
      }}
      {...props}
    />
  )
}
