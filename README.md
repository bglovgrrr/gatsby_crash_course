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

## Online play (Supabase)

Online rooms use the free Supabase project set in `.env`. One-time setup in the Supabase dashboard:

1. **SQL Editor → New query**: paste all of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. It's safe to run again after changes.
2. **Authentication → Sign In / Providers**: turn on **Allow anonymous sign-ins**.

How it works:
- Nobody makes an account. Each device signs in anonymously and gets a player id that survives refreshes.
- One row per game in `rooms`; the whole game state is JSON in `state`. Every phone runs the same rules (`engine.ts`) and saves with a version check, so two people tapping at once can't overwrite each other.
- Row-level security: you can only read or change games you joined (by creating one or entering its code). Membership can only be added by the `create_room` / `join_room` functions.
- Live updates use Supabase Realtime. Phones also sync their clocks with the server so the progress bar matches.
- The **host's device plays the music**; everyone else's phone is a remote control.
- Invite links look like `https://your-site/?join=ABCD`.

Free-tier note: Supabase pauses a free project after a week without use. Open the dashboard and press **Restore** to wake it.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Vite + React 19 + TypeScript | Fast, simple, and AI tools know it well |
| UI | Tailwind CSS v4 + shadcn/ui components, `motion` for animation, `lucide-react` icons | Modern look; components are plain files you own (`src/components/ui`) |
| Brand | Pastel palette, Fraunces (display) + Figtree (body), bundled locally | Calm and friendly. All colours are tokens in `src/index.css` |
| Install | PWA (`vite-plugin-pwa`) | Add to Home Screen on iPhone and Android |
| Song search | iTunes Search API | Free, no key, 30-second previews |
| Backend | Supabase free tier | Real-time sync, Postgres for history, anonymous sign-in (no accounts), row-level security |
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
    online-client.ts Online mode: Supabase rooms + realtime
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
- [x] Online rooms with Supabase: create, join with a code or invite link, live sync, rejoin after refresh
- [ ] Host it online (Vercel / Netlify, free) so friends can open it
- [ ] Game history screen (games are already saved in the database)
- [ ] Spotify: host logs in, songs play in full, "Save to Spotify" playlist at the end
- [ ] Reactions (❤️ 😂 😭) while a song plays
