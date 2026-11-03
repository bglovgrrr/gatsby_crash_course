# Side B

**Every song has a story.**

Side B is a relaxed music game for 2–8 friends in the same room. Someone asks a question, everyone secretly answers with a song, and then you listen to each one together and talk about why it was picked.

> **Status:** in development. Demo mode and online rooms work. The database is live on Supabase; the app isn't hosted yet.

## How a game works

1. **Ask.** The asker writes a question or picks one from a theme, such as *"What song reminds you of your dad?"*
2. **Pick.** Everyone searches for a song on their own phone and locks it in. Picks stay secret, and you can add a short note about why.
3. **Listen & talk.** Songs are revealed one at a time and play on the host's phone, hooked up to a speaker. Anyone can play, pause, or skip. After each song, the person who picked it tells the story.
4. **Next round.** The next person asks. When you're done, the recap shows every round's mixtape.

## Features

- **No accounts.** Start a game, share the 4-letter code or invite link, and friends join with just a name.
- **Live sync.** Every phone stays in step: questions, picks, play/pause, and the progress bar.
- **Rejoin anytime.** Refresh or lock your phone and you land back in the same game.
- **Question themes.** Throwback, Family, Love & heartbreak, Hype, Deep cuts, Places, and Wildcard, plus your own questions and "Surprise me".
- **Song search with previews.** Uses iTunes search with 30-second clips. No API key needed.
- **Demo mode.** Play a full game on one device with three bot friends.
- **Made for phones and desktops.** Light, dark, or match-device theme. You can add it to your home screen like an app.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also open it on your phone (same Wi-Fi)
npm run build          # production build in dist/
npm run lint
```

Online play reads the Supabase project from `.env`. The publishable key in that file is meant to be public; the database's row-level security rules control access.

## Putting it online

Friends need a web address to join. Any static host works. The easiest free option is **Vercel**:

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. Choose **Add New → Project** and import this repository.
3. Keep the detected settings (Vite, `npm run build`, output `dist`) and deploy.

Vercel deploys the repository's default branch, so merge your work there first, or pick a different production branch in the project settings.

## Backend (Supabase)

The project uses Supabase's free tier for live rooms.

| What | How |
| --- | --- |
| Sign-in | Anonymous. Each device gets a player id with no account needed. Turn on **Authentication → Sign In / Providers → Allow anonymous sign-ins**. |
| Games | One row per game in `rooms`, with the whole game state stored as JSON. |
| Security | Row-level security means you can only read or change games you joined. Players can only join through the `create_room` and `join_room` functions. |
| Conflicts | Every save checks a version number, so two people tapping at once can't overwrite each other. |
| Live updates | Supabase Realtime, plus a server clock sync so progress bars match. |

**Database changes** live in [`supabase/migrations/`](supabase/migrations). The Supabase GitHub integration applies new migrations when they reach the production branch. To set up a brand-new project in one go, paste [`supabase/schema.sql`](supabase/schema.sql) into **SQL Editor → New query** and press **Run**.

**Free tier:** Supabase pauses a free project after a week without use. Open the dashboard and press **Restore** to wake it.

## Project structure

```
src/
  game/
    engine.ts          All game rules in one pure function: reduce(state, action, player)
    types.ts           Players, rounds, picks, playback
    prompts.ts         Question themes
    client.ts          How screens talk to a game (demo or online)
    local-client.ts    Demo mode with bot players
    online-client.ts   Online mode: Supabase rooms, realtime, versioned saves
  screens/             One screen per phase: lobby, asking, picking, listening, between, recap
  components/          Shared game UI, audio player, and shadcn/ui components (ui/)
  music/               Song search and the offline song list
  hooks/               useGame, useTheme
  lib/                 Supabase client, clock sync, helpers
supabase/
  migrations/          Database changes, in order
  schema.sql           Full setup for a new project
```

To change how the game plays, start in `src/game/engine.ts`. Demo and online modes use the same rules.

## Built with

| Layer | Choice |
| --- | --- |
| App | Vite, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Motion, Lucide icons |
| Brand | Pastel palette with Fraunces and Figtree fonts (bundled). Colours are tokens in `src/index.css` |
| Backend | Supabase (Postgres, anonymous auth, Realtime) |
| Music | iTunes Search API. Spotify is planned |
| Install | PWA via `vite-plugin-pwa` |

Add more shadcn components with `npx shadcn@latest add <component>`.

## Working on it with Claude Code

- `.mcp.json` connects Claude Code to the Supabase project. On first use, run `/mcp`, choose **supabase**, then **Authenticate**.
- Supabase's agent skills are in `.claude/skills/`.
- `npm run build:preview` makes a single-file demo build in `dist-preview/`, for previewing inside the Claude app (`node scripts/claude-preview.mjs` prepares it for publishing).

## Roadmap

- [x] Full game loop with themes, secret picks, and a recap
- [x] Shared playback controls; songs revealed one at a time
- [x] Pastel design with light and dark themes
- [x] Online rooms: codes, invite links, live sync, rejoin after refresh
- [x] Database live on Supabase with security rules
- [ ] Host the app (Vercel) and play a first real game
- [ ] Game history: browse past games and their mixtapes
- [ ] Spotify: full-length playback and "Save as playlist"
- [ ] Reactions while a song plays
