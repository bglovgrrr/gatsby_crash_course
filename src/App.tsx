import { useState } from 'react'

type Tab = { id: string; label: string; icon: string }

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function App() {
  const [active, setActive] = useState('home')
  const tab = TABS.find((t) => t.id === active)!

  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <div className="brand">My App</div>
        {TABS.map((t) => (
          <button
            key={t.id}
            className="nav-item"
            aria-current={t.id === active ? 'page' : undefined}
            onClick={() => setActive(t.id)}
          >
            <span className="nav-icon" aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <header className="topbar">
        <h1>{tab.label}</h1>
      </header>

      <main className="content">
        <section className="card">
          <h2>{tab.label}</h2>
          <p>
            This is a placeholder screen. Tell Claude what the app should do and this is where
            it will go.
          </p>
        </section>
      </main>
    </div>
  )
}
