# playground

The test product of the zigordev platform: an API on its own PostgreSQL and a web app with sign-in, notes pages and texts in English and Spanish, made from toolkit's product template and deployed to `playground.zigordev.com` by every green merge to `main`. Its sign-in emails go to the notifications service over Kafka. Record 0001 in `docs/adr/` says why it exists. The core rules in `.claude/rules/core.md` apply here as everywhere.

## Where things live

| Path                                   | What it holds                                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/playground-api`                  | The API on `@zigordev/api`: the greeting behind a flag, the notes and sign-in, its flags in `flags.json`, its migrations in `drizzle/`, its `openapi.json`, its image   |
| `apps/playground-web`                  | The web app on Next.js: the sign-in and notes pages on the design system, its texts in `messages/` with the inlang project, its page check in `browser/`, and its image |
| `packages/playground-api-client`       | The API's typed client, written from `openapi.json`                                                                                                                     |
| `packages/playground-client-generator` | The one package that writes those types, on its own TypeScript 5.9.3                                                                                                    |
| `compose.yaml`                         | The whole product as it runs everywhere. `compose.local.yaml` and `compose.production.yaml` hold only the differences                                                   |
| `compose.test.ts`                      | The test that holds the compose files and the Dockerfiles to the container rules                                                                                        |
| `.env.production.example`              | The names of production's secrets. The values live in Parameter Store under `/playground/<NAME>`                                                                        |
| `.github/workflows/ci.yml`             | The caller of toolkit's pipeline, publish and deploy workflows, pinned to one commit of toolkit                                                                         |
| `.claude/`                             | The shared rules, skills, hooks and permissions. `zigordev sync` writes them                                                                                            |
| `docs/`                                | The standard docs and the decision records                                                                                                                              |

## Commands

- `pnpm install` installs the dependencies and the git hooks.
- `pnpm check` runs what CI runs: lint, build, type check, and tests with coverage. Docker has to run, because the API's tests start a real PostgreSQL and a real Kafka.
- `pnpm check:quick` runs the same without coverage and without the tests that need a container. The push hook runs it.
- `pnpm local:up` starts the shared services and the product in containers, at `http://playground.localhost`. `pnpm local:down` stops the product only.
- `pnpm dev api` or `pnpm dev web` runs that one app on this Mac with hot reload, beside the containers.
- `pnpm check:contract` builds both images and holds them, and the compose files, to the platform contract.
- `pnpm build && pnpm test:browser` runs the web app's browser tests, which cover every `*.client.tsx` against the floor, and then the page check, which opens every page in Chromium in both languages and both colour schemes, with axe. The pipeline's Browser job runs both on every pull request.
- `pnpm --dir apps/playground-api run db:generate --name <change>` writes the SQL of a change to the API's schema. `run openapi` rewrites its `openapi.json`.
- `pnpm --dir packages/playground-api-client run generate` writes the client's types from `openapi.json`.
- `pnpm exec zigordev check` runs the rules a machine can check, and `pnpm exec zigordev sync` copies the shared files again.

## Rules of this repo

- A merge to `main` deploys. A change that should not be live yet ships behind a flag with a removal date.
- The repo keeps the template's shape. A new slice of the template arrives as one pull request that copies it in, and a change that the template should have too goes to toolkit first.
- A new secret is a new line `NAME=` in `.env.production.example`, and its value is the owner's to store in Parameter Store before the merge that needs it.
- The PostgreSQL of this product listens on `127.0.0.1:5434` on the laptop, so that it does not meet the template's on 5433.
- Browser monitoring sends from every page to `/rum`, which platform routes to Alloy's Faro receiver. A new interaction joins `apps/playground-web/src/lib/interactions.ts` in the pull request that records it.
- A write that changes what a page shows sends its notice through `notifyChange` of `@zigordev/live`, inside the same transaction, as the notes repository does.
- A text of the web app changes in `messages/en.json` and `messages/es.json` together. A commit that changes only files in `messages/` may come from Fink, the translators' editor, and keeps its translator as author.
- A shared file is changed in toolkit, never here. `pnpm check` fails while a copy differs.
