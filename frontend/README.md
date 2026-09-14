# PhishGuard — Frontend

The React + TypeScript + Vite client for PhishGuard.

## Pages

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Home | Landing, "what is phishing", how phishing works flow, feature overview |
| `/check` | Check Website | The primary URL checker — full loading / result / error states |
| `/learn` | Learn | Security awareness & defense patterns |
| `/patterns` | Pattern Learning | URL anatomy + recurring phishing characteristics |
| `/simulator` | Simulator | Phishing simulation campaign engine + live monitoring dashboard |

## Layout

Run below from this directory.

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server (http://localhost:5173)
npm run build      # TypeScript type-check + production bundle
npm run lint       # oxlint
npm run preview    # preview the production build
```

The Vite dev server proxies `/api` to the backend at `http://127.0.0.1:8000`
(see `vite.config.ts`). Start the backend first — see the project `README.md`.

## Design

The UI uses the semantic design tokens defined in `src/index.css` (light + dark), built around a
slate/navy/sapphire palette. Motion is intentional and respects `prefers-reduced-motion`.

Frontend API calls are centralised in `src/services/api/` (`analysis.ts`, `simulator.ts`) with shared
types in `src/services/api/types.ts`. Never place API keys in frontend code — all secrets stay
server-side.
