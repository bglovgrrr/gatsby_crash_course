# My App

A mobile-first web app built with Vite, React and TypeScript. It can be installed as a PWA, so you can add it to your phone's home screen.

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # make a production build in dist/
npm run preview  # serve the production build locally
```

To try it on your phone, run `npm run dev -- --host` and open the network URL it prints on a phone that's on the same Wi-Fi.

## Layout

- On phones (under 768px wide) it uses a bottom tab bar and safe-area insets for notched devices.
- On desktops it shows a sidebar on the left.
- It follows the system's light or dark mode.
