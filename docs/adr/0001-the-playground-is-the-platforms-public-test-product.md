# 0001. The playground is the platform's public test product

- Status: accepted
- Date: 2026-11-24
- Supersedes: none

## Context

Step 3.9 of the Build plan proves the deploy path: "A one-page test container deployed from a merge. Then a broken version of it. Then the host destroyed and rebuilt." Its test: "The page goes live with no manual step, the broken version rolls itself back, and the rebuilt host serves the page within 1 hour."

A product can only be deployed from a public GitHub repo: GitHub's machines build and attest its images, the deploy verifies those records against the repo, and the host reads the compose files from the repo's `main`.

Until 2026-11-24 the playground was the owner's private test app: a plain folder on the laptop, made from the template, in no repo. A new repo, `zigordev/hello`, had been created the same day for step 3.9. On 2026-11-24 the owner was asked which of the two step 3.9 should use, and chose, in their words: "The playground, made public".

## Decision

- The playground is a public repo, `zigordev/playground`, and the deploy target `playground` of the platform, at `playground.zigordev.com`.
- It keeps the template's whole shape: the API with its PostgreSQL and its migrate job, the web app, the generated client and its generator.
- Every change reaches it as a pull request, and every green merge to `main` deploys it, like any product.
- Each later slice of the template reaches it as one pull request that copies it in.

## Consequences

- Step 3.9 proves the whole path of a product with a database: the secrets, the data store that starts first, the job that runs before the switch, and two apps that drain. Phase 5's notifications service finds that path proven.
- The owner's tries happen through pull requests now, and each one deploys.
- Production holds three secrets of the playground, which the owner sets, and its database is backed up like any product's.
- `zigordev/hello` was deleted the same day, with what platform held for it, on the owner's word: "name it and remove hello related things".

## Alternatives considered

- **hello, with the web app only.** One page, one container and no secrets, so the quickest proof and the easiest to remove later. It would leave jobs, secrets and the database untested until a real product.
- **hello, with the whole template.** The same proof as the playground, in a second copy of the template, while the playground stayed private.
- **Keep the playground private.** It would stay out of every repo, but it could never be deployed.
