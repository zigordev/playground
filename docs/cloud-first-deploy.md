# How the playground reaches production

Every green merge to `main` deploys the playground to <https://playground.zigordev.com>, with no manual step. This page says how, what production needs once, and how to look after it. The handbook page [Delivery](https://github.com/zigordev/toolkit/blob/main/docs/handbook/delivery.md) explains every step in depth.

## The path of a merge

```mermaid
flowchart LR
  merge["Merge to main"] --> check["check: the pipeline"]
  check --> publish["Publish: both images, built and attested"]
  publish --> deploy["Deploy: verified, then sent to the host"]
  deploy --> host["The host runs the new version"]
  host --> outside["https://playground.zigordev.com/health names the commit"]
```

| Job     | What it does                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| check   | toolkit's pipeline: `pnpm check`, the title, the dependencies, the code scan, and the contract on both built images                                                    |
| Publish | Builds `ghcr.io/zigordev/playground-api` and `ghcr.io/zigordev/playground-web` for arm64 under the commit, and records how each was built                              |
| Deploy  | Verifies both records, asks the host through AWS Systems Manager to run the commit, waits for `version` to be the commit from outside, and rolls back when it never is |

The three workflows are toolkit's, pinned to one commit of it in `.github/workflows/ci.yml`. Renovate proposes each new version of toolkit, and the merge of that update deploys it.

On the host, the deploy reads `compose.yaml`, `compose.production.yaml` and `.env.production.example` from `main`. It starts PostgreSQL, runs the job `playground-api-migrate` once, and then replaces each app with docker-rollout, which waits for the new container's health check and drains the old one.

## What production needs, once

None of these is in this repo. The owner does each of them once.

| What                                                                                                                                                                                                         | Who                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| The deploy target `playground` in `platform/infra/products.json`, which brings its command, its role, the environment `production` and the address                                                           | The platform session, with the owner's approval of the plan |
| The repo secret `AWS_ACCOUNT_ID`                                                                                                                                                                             | The owner, in the repo's settings                           |
| `/playground/POSTGRES_PASSWORD`, `/playground/PLAYGROUND_API_DATABASE_PASSWORD` and `/playground/PLAYGROUND_API_KEYS` in AWS Parameter Store, as SecureString, with the commands [below](#the-three-secrets) | The owner                                                   |
| Both image packages made public, after the first publish, if GitHub created them as private                                                                                                                  | The owner, in each package's settings                       |
| The dependency graph switched on, which Dependency Review needs                                                                                                                                              | The owner, in the repo's settings                           |

## The three secrets

The host reads each name of `.env.production.example` from Parameter Store under `/playground/<NAME>`, and refuses to deploy while one is missing. The owner stores them with the profile `platform-ops`. Each command below makes the value without showing it, and a value is never typed by hand.

The two passwords are 64 hexadecimal characters, which stay valid inside a database address:

```bash
aws ssm put-parameter --profile platform-ops --region eu-west-1 --type SecureString --name /playground/POSTGRES_PASSWORD --value "$(openssl rand -hex 32)"
```

```bash
aws ssm put-parameter --profile platform-ops --region eu-west-1 --type SecureString --name /playground/PLAYGROUND_API_DATABASE_PASSWORD --value "$(openssl rand -hex 32)"
```

Set both before the first deploy, and leave them: PostgreSQL keeps the first password it was started with.

`PLAYGROUND_API_KEYS` is a JSON list of keys, and the API stops at its start when the value is not JSON. So jq writes the list into a file and checks it, and the AWS CLI reads the file, with no quoting by the shell in between. An empty list lets no caller in, while the page and the greeting work:

```bash
jq -n '[]' > keys.json && jq -e 'type == "array"' keys.json && aws ssm put-parameter --profile platform-ops --region eu-west-1 --type SecureString --overwrite --name /playground/PLAYGROUND_API_KEYS --value file://keys.json && rm keys.json
```

A list with one key keeps only the key's SHA-256. The key itself is shown once, for your password manager:

```bash
KEY="$(openssl rand -hex 32)" && echo "The key, shown once: $KEY" && jq -n --arg sha256 "$(printf '%s' "$KEY" | shasum -a 256 | cut -d' ' -f1)" '[{name: "owner", sha256: $sha256, scopes: ["notes:read", "notes:write"]}]' > keys.json && jq -e 'type == "array" and all(.[]; .sha256 | test("^[0-9a-f]{64}$"))' keys.json && aws ssm put-parameter --profile platform-ops --region eu-west-1 --type SecureString --overwrite --name /playground/PLAYGROUND_API_KEYS --value file://keys.json && rm keys.json
```

A changed secret reaches the apps with the next deploy.

## Looking after it

| You want to                        | Do this                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Know which version runs            | Open <https://playground.zigordev.com/health>. `version` is the commit                                                                                                                                                                                                                                                                                                               |
| See a deploy                       | Open the run of the merge on GitHub. Its summary names the commit, the version before it and the result                                                                                                                                                                                                                                                                              |
| Read the logs, traces and metrics  | Grafana Cloud, under the services `playground-api`, `playground-api-migrate` and `playground-web`                                                                                                                                                                                                                                                                                    |
| Undo a bad version                 | A version that answers wrongly from outside is rolled back by the deploy itself. To undo one that answers well, revert its pull request: the revert deploys like any merge                                                                                                                                                                                                           |
| Change a secret                    | The owner sets the new value in Parameter Store. The next deploy reads it                                                                                                                                                                                                                                                                                                            |
| Find why a deploy failed at health | The host's lines are in the folded part of the deploy's log. When the API stopped at its start, check that `PLAYGROUND_API_KEYS` is JSON, without printing it: `aws ssm get-parameter --profile platform-ops --region eu-west-1 --with-decryption --name /playground/PLAYGROUND_API_KEYS --query Parameter.Value --output text \| jq -e 'type == "array"' > /dev/null && echo valid` |
| Run a deploy again by hand         | Only with the owner's yes                                                                                                                                                                                                                                                                                                                                                            |
