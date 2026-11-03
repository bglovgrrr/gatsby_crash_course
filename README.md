# Side B 🎵

**Every song has a story.** Side B is a music game for 2–8 friends sitting together:

1. **Ask.** One person asks a question, either their own or one from a theme: *"What song reminds you of your dad?"*
2. **Pick.** Everyone secretly picks a song on their phone.
3. **Listen & talk.** The songs play one by one on the speaker. When each one plays, the person who picked it shares the story.
4. The next person asks, and you go round again. At the end you get a recap of every round's mixtape.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also open it on your phone (same Wi-Fi)
npm run build          # production build (installable PWA) in dist/
npm run lint
```

`npm run build:preview` builds a single self-contained HTML file in `dist-preview/`. It runs in demo mode and is used to preview the app inside the Claude app. `node scripts/claude-preview.mjs` turns it into a page ready to publish as an artifact.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Vite + React 19 + TypeScript | Fast, simple, and AI tools know it well |
| UI | Tailwind CSS v4 + shadcn/ui components, `motion` for animation, `lucide-react` icons | Modern look; components are plain files you own (`src/components/ui`) |
| Brand | Pastel palette, Fraunces (display) + Figtree (body), bundled locally | Calm and friendly. All colours are tokens in `src/index.css` |
| Install | PWA (`vite-plugin-pwa`) | Add to Home Screen on iPhone and Android |
| Song search | iTunes Search API | Free, no key, 30-second previews |
| Backend (next) | Supabase free tier | Real-time sync, Postgres for history, anonymous sign-in (no accounts), row-level security |
| Spotify (later) | Spotify Web API | Full-length playback on the host device + save a game as a playlist |

To add more shadcn components: `npx shadcn@latest add dialog` (config is in `components.json`).

## How the code is organised

```
src/
  game/
    types.ts         Game data: players, rounds, picks, playback
    engine.ts        ALL the game rules: reduce(state, action, playerId) -> new state
    prompts.ts       Question themes
    client.ts        GameClient interface: how the UI talks to a game
    local-client.ts  Demo mode: runs on one device with bot friends
  music/
    search.ts        iTunes search (+ offline fallback)
    demo-catalog.ts  Built-in songs for offline / sandboxed previews
  screens/           One file per game phase: lobby, asking, picking, listening, between, recap
  components/        game-ui.tsx (avatars, album art, prompt card), audio-engine.tsx, ui/ (shadcn)
  hooks/use-game.ts  useGame() hook used by every screen
```

The rules live in one pure function (`engine.ts`), and the same rules run in demo mode now and online mode later. To change how the game works, start there.

## Roadmap

- [x] Game loop: lobby → ask → secret picks → listen & talk → next asker → recap
- [x] Question themes, custom questions, "Surprise me"
- [x] Song search with previews, optional "why I picked it" note
- [x] Shared play / pause / skip / seek; songs revealed one at a time
- [x] Phone + desktop layouts, installable
- [x] Light / dark / match-device theme switch
- [ ] **Online rooms with Supabase.** Create a room, friends join with a 4-letter code, and everything stays in sync. Uses anonymous sign-in and row-level security, so only players in a room can see it.
- [ ] Game history saved to the database
- [ ] Spotify: host logs in, songs play in full, "Save to Spotify" playlist at the end
- [ ] Reactions (❤️ 😂 😭) while a song plays
