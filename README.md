# FTCPanel

Live FTC dashboard: event rankings, matches, and matchup predictions, powered by [FTC Scout](https://ftcscout.org). Static SvelteKit app on GitHub Pages; all data is fetched in the browser.

Architecture and roadmap: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # model unit tests
npm run check      # svelte-check / TypeScript
npm run build      # static site in build/
```

## GraphQL

- All documents live in `src/lib/api/queries.ts`. Types are generated into `src/lib/api/gql/` (committed).
- `npm run codegen` after editing queries.
- `npm run schema` re-pulls FTC Scout's schema into `schema.graphql` (needed when a new season's types appear).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml` (codegen drift check, type check, tests, build, deploy to Pages).
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

## New season checklist

1. `npm run schema`
2. Add `... on MatchScores20XX` / `... on TeamEventStats20XX` fragments in `src/lib/api/queries.ts`; `npm run codegen`.
3. Add `src/lib/seasons/20XX.ts` (components, RP keys, normalizers) and register it in `src/lib/seasons/index.ts`.
