# What a user can do with the playground

The playground is a test product, so its users are few: a visitor of its page, and a caller of its API with a key. This page lists what each one can do, flow by flow.

## A visitor

| Flow                   | Where                                                                             | What happens                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Open the page          | <https://playground.zigordev.com>, or <http://playground.localhost> on the laptop | The page shows the greeting that the API returns, or says that the API does not answer          |
| Ask whether it is well | `/health` at the same address                                                     | JSON with `status`, the service's name, the `version` that runs, and the state of what it needs |

## A caller of the API

A caller signs in with an API key in `Authorization: Bearer <key>`. Each key has scopes: `notes:read` to read, and `notes:write` to change. In production the keys' digests live in the secret `PLAYGROUND_API_KEYS`, which the owner sets.

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

The page and its health route are the critical paths today. Each has a test: the web app's routes are tested on their own and as the built server, and the API's routes on a real PostgreSQL. Browser tests arrive with the template's sixth slice.
