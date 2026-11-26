# What a user can do with the playground

The playground is a test product, so its users are few: a visitor, a person who signs up and keeps notes, and a caller of its API with a key. This page lists what each one can do, flow by flow. Every page exists in English and in Spanish, and follows the person's light or dark setting.

## A visitor

| Flow                   | Where                                                                             | What happens                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Open the page          | <https://playground.zigordev.com>, or <http://playground.localhost> on the laptop | The page shows the greeting that the API returns, or says that the API does not answer          |
| Ask whether it is well | `/health` at the same address                                                     | JSON with `status`, the service's name, the `version` that runs, and the state of what it needs |

## A person with an account

| Flow                   | Where                    | What happens                                                                                                                              |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Sign up                | `/sign-up`               | An email and a password. An email to confirm the address arrives from `no-reply@zigordev.com`, in the language the browser asks for       |
| Confirm the address    | The button in that email | Confirms the address and signs the person in                                                                                              |
| Sign in                | `/sign-in`               | With the password or a passkey. A person who turned on two-factor goes on to `/two-factor`, for the authenticator's code or a backup code |
| Look after the account | `/account`               | Add a passkey, turn on two-factor, sign out, or delete the account, which an email confirms. The account's notes go with it               |
| Keep notes             | `/notes`                 | The person's own notes, newest first, with a search on the titles, a filter on open or done, and "Show more" for the next page            |
| Write a note           | `/notes/new`             | A title and a text                                                                                                                        |
| Change a note          | `/notes/{noteId}`        | The same form, with the box "Done", and a delete that asks once more. Another person's note answers 404                                   |
| Change the language    | The switch on every page | English or Spanish, kept in the cookie `playground.locale`. Without a choice, the browser's language, and then English                    |

Someone who tries to sign up with an address that already has an account gets no error on the page. The owner of the address gets an email instead, at most once in ten minutes.

## A caller of the API

A caller signs in with an API key in `Authorization: Bearer <key>`. Each key has scopes: `notes:read` to read, and `notes:write` to change. In production the keys' digests live in the secret `PLAYGROUND_API_KEYS`, which the owner sets. A person who is signed in reaches the same routes with the session's cookie, and only their own notes.

| Flow                     | Request                         | Answer                                                                   |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------------ |
| Read the greeting        | `GET /api/v1/hello`             | 200 with a message, with no key                                          |
| List notes               | `GET /api/v1/notes`             | 200 with a page of notes, filtered by `status` and `q`, sorted and paged |
| Write a note             | `POST /api/v1/notes`            | 201 with the note and its `Location`                                     |
| Read one note            | `GET /api/v1/notes/{noteId}`    | 200 with the note, or 404                                                |
| Change a note            | `PATCH /api/v1/notes/{noteId}`  | 200 with the changed note, or 404                                        |
| Delete a note            | `DELETE /api/v1/notes/{noteId}` | 204, or 404                                                              |
| Read the API's own pages | `GET /api/v1/docs`              | The OpenAPI pages, with every request and every error                    |

Every error is a problem in the platform's format: `type`, `title`, `status`, `detail`, `instance`, and a stable `code` with its `params`. The [README](../README.md) shows how to make a key on the laptop.

## Critical paths

Sign-up with its email, sign-in, the notes pages, and the health route are the critical paths.

- Every sign-in path runs against a real PostgreSQL and a real Kafka in `apps/playground-api/src/features/account/sign-in.db.test.ts`, with a stand-in for the notifications service. It also checks that a person reaches only the notes they wrote.
- The API's routes are tested on a real PostgreSQL, and the web app's routes on their own and as the built server.
- `pnpm test:browser` clicks through every form in Chromium, as a person would, and then opens every page in English and Spanish, in light and in dark, with axe and the content security policy. The pipeline's Browser job runs it on every pull request.
- In production, a real email reaches any address only once SES is out of its sandbox.
