# Node Ts MCP Server Boilerplate

## Educational Purpose

This project was created primarily for **educational and learning purposes**.
While it is well-structured and could technically be used in production, it is **not intended for commercialization**.
The main goal is to explore and demonstrate best practices, patterns, and technologies in software development.

## Description

**Node Ts MCP Server Boilerplate** is a production-ready starting point for building **Model Context Protocol** servers with Node.js, TypeScript and the official MCP SDK. It is not a framework or a library — it is the foundation you clone once and stop rebuilding from scratch on every new MCP idea.

**The problem it solves:** every MCP server starts with the same repetitive decisions — how to structure the code so tools do not become a 900-line switch statement, where to put schemas, how to keep logging from corrupting the stdio stream, how to turn a domain error into something the model can actually recover from, whether to support stdio or HTTP (or both), and how to test any of it without spawning a subprocess. This boilerplate answers all of those upfront, with a layered architecture that mirrors a conventional backend so the same mental model transfers.

**What it includes:**

- **MCP SDK v2 + TypeScript 5** — built on `@modelcontextprotocol/server`, the stable line implementing the `2026-07-28` spec. Strict typing enforced throughout, `NodeNext` module resolution and path aliases (`@/`) for readable imports.
- **Both transports, one codebase** — `MCP_TRANSPORT=stdio` for desktop hosts that spawn the process, `MCP_TRANSPORT=http` for remote deployments. Same tools, same handlers, same tests.
- **Layered architecture** — clear separation between DAOs (data access), Services (business logic), Handlers (protocol translation) and Registries (contract declaration). Each layer depends only on the one below it.
- **In-memory store** — the DAO layer uses a module-level array with a `Note` model as a reference CRUD implementation. Replace it with any database or API — the layers above stay unchanged.
- **Zod-validated environment configuration** — parsed and coerced through a Zod schema at startup, composed into a typed `Envs` object. Invalid values crash the process with a structured message before anything binds.
- **Zod tool schemas** — every tool declares an `inputSchema` and (where meaningful) an `outputSchema`. The SDK validates arguments before the handler runs and returns typed `structuredContent` to the client. TypeScript types are inferred from the same schemas.
- **Typed error hierarchy** — `AppError` base class plus `BadRequestError`, `UnauthorizedError`, `NotFoundError` and `ConflictError`. Thrown anywhere in the stack and converted into model-visible `isError` results by a single wrapper.
- **stderr-only structured logging** — Pino pinned to file descriptor 2, JSON in production and pretty in development. `no-console` is an ESLint **error**, not a warning.
- **DNS rebinding protection** — the HTTP transport is built on `createMcpExpressApp`, which validates the `Host` header by default, plus an Origin allow-list, an opt-in bearer guard and an opt-in IP rate limiter.
- **Jest integration tests over a real protocol link** — `InMemoryTransport.createLinkedPair()` connects a real `Client` to a real `McpServer` in-process, so tests exercise schema validation and tool dispatch instead of calling handlers directly.
- **ESLint + Prettier + Husky + lint-staged** — pre-commit hooks block commits with linting errors and auto-format staged files.
- **GitHub Actions CI** — lint, format check, type check, `npm audit`, the test suite and Docker image builds for both Dockerfiles, on every push and PR to `main`.

**How to use it:**

1. Clone the repository and install dependencies.
2. Copy `.env.example` to `.env` and fill in your values.
3. Run `npm run dev` (stdio) or `npm run inspect` to poke at it with the MCP Inspector.
4. Replace the `Note` schema, DAO, service, handler and registry entry with your own domain — the structure, error handling, logging and tooling stay exactly as they are.

## Technologies Used

1. Node.js
2. TypeScript
3. Model Context Protocol (SDK v2)
4. Express (HTTP transport only)
5. Docker

## Libraries Used

### Dependencies

```
"@modelcontextprotocol/express": "^2.0.0"
"@modelcontextprotocol/node": "^2.0.0"
"@modelcontextprotocol/server": "^2.0.0"
"dotenv": "^17.0.0"
"express": "^5.1.0"
"express-rate-limit": "^8.5.2"
"pino": "^10.3.1"
"zod": "^4.4.3"
```

### DevDependencies

```
"@eslint/js": "^9.0.0"
"@modelcontextprotocol/client": "^2.0.0"
"@types/express": "^5.0.0"
"@types/jest": "^30.0.0"
"@types/node": "^22.0.0"
"eslint": "^9.0.0"
"eslint-config-prettier": "^9.0.0"
"eslint-plugin-prettier": "^5.0.0"
"globals": "^15.0.0"
"husky": "^9.0.0"
"jest": "^30.0.0"
"lint-staged": "^15.0.0"
"pino-pretty": "^13.1.3"
"prettier": "^3.0.0"
"ts-jest": "^29.4.6"
"tsc-alias": "^1.8.16"
"tsx": "^4.0.0"
"typescript": "^5.5.3"
"typescript-eslint": "^8.0.0"
```

## Getting Started

1. Clone the repository.
2. Navigate to the project folder.
3. Install dependencies: `npm install`
4. Optionally copy `.env.example` to `.env` and adjust the values (see [Env Keys](#env-keys)) — every key has a default.
5. Run the server.

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Start the dev server with hot reload        |
| `npm run type-check` | Run TypeScript type checking                |
| `npm run inspect`    | Build and open the MCP Inspector against it |

For the HTTP transport with Docker:

```
docker-compose -f dev.docker-compose.yml build --no-cache
docker-compose -f dev.docker-compose.yml up --force-recreate
```

The endpoint will be available at `http://localhost:5060/mcp`.

### Connecting it to a host

The fastest feedback loop is the **MCP Inspector**, which lists and calls your tools without involving a model:

```
npm run inspect
```

To plug it into a real host, see `examples/claude_desktop_config.json` (Claude Desktop / Claude Code) and `examples/mcp.json` (VS Code / Cursor). Both need `npm run build` first, since they point at `dist/main.js`.

### Pre-Commit for Development

Code quality and formatting are enforced automatically on every commit by ESLint, Prettier, Husky and lint-staged. No manual formatting step is required, and commits with errors are blocked before they reach the repo.

#### ESLint

Configured with TypeScript strict rules (`strictTypeChecked` + `stylisticTypeChecked`):

- Explicit return types required on all functions
- No `any` type allowed
- Consistent type imports enforced (`import type`)
- Interfaces preferred over type aliases
- No unused variables (args prefixed with `_` are exempt)
- `===` required — no loose equality
- **`console` is an error, not a warning** — see [The stdout rule](#the-stdout-rule)
- Relaxed rules inside `__tests__/`

#### Prettier

- 2 spaces indentation
- Semicolons required
- Double quotes
- Trailing commas (ES5)
- Max line width: 100 characters
- LF line endings

#### Available Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run lint`         | Check for linting errors         |
| `npm run lint:fix`     | Fix linting errors               |
| `npm run lint:all`     | Fix linting errors (src + tests) |
| `npm run format`       | Format code with Prettier        |
| `npm run format:check` | Check code formatting            |
| `npm run format:all`   | Format code (src + tests)        |

## Env Keys

Variables consumed by `src/configs/env.config.ts`. They are parsed and coerced through a Zod schema at startup — invalid values cause the process to throw with a structured error message before any transport binds.

| Key                    | Description                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | Runtime environment (`development`, `production`, `test`). Default: `development`.              |
| `LOG_LEVEL`            | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`). Default: `info`. |
| `MCP_SERVER_NAME`      | Server name reported to the host on connect. Default: `mcp-boilerplate`.                        |
| `MCP_SERVER_VERSION`   | Server version reported to the host. Default: `1.0.0`.                                          |
| `MCP_TRANSPORT`        | `stdio` or `http`. Default: `stdio`.                                                            |
| `HTTP_HOST`            | Interface the HTTP transport binds to. Default: `127.0.0.1`.                                    |
| `HTTP_PORT`            | Port the HTTP transport listens on. Default: `5060`.                                            |
| `HTTP_PATH`            | Path the MCP endpoint is mounted at. Default: `/mcp`.                                           |
| `ALLOWED_HOSTS`        | Comma-separated Host allow-list. Only relevant when binding to `0.0.0.0`.                       |
| `ALLOWED_ORIGINS`      | Comma-separated Origin allow-list. Empty disables the check.                                    |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds. Default: `900000` (15 min).                                  |
| `RATE_LIMIT_MAX`       | Max requests per window per IP. `0` disables rate limiting. Default: `0`.                       |
| `AUTH_ENABLED`         | Enable the bearer token guard (`true`/`false`). Default: `false`.                               |
| `AUTH_TOKEN`           | Shared secret. Required when `AUTH_ENABLED=true`.                                               |
| `SEED_DEFAULT_DATA`    | Seed the in-memory store on startup (`true`/`false`). Default: `false`.                         |

### Env file cascade

`src/configs/dotenv.config.ts` loads `.env` files before the Zod schema runs. A key is only applied if it is not already set, so real environment variables always win. Precedence, from highest to lowest:

1. `process.env` (Docker `env_file`, CI, shell exports)
2. `.env.<mode>.local`
3. `.env.local`
4. `.env.<mode>`
5. `.env`

`<mode>` comes from `NODE_ENV`: first from the process, then from a `NODE_ENV` declared inside `.env.local` or `.env`, and finally the `development` default.

Two flows come out of this:

- **Without Docker** — copy `.env.example` to `.env` (or a more specific file such as `.env.local`) and run `npm run dev` / `npm start`. Every key has a default, so the files are optional.
- **With Docker** — the compose files inject `.env` through `env_file`, so values arrive as real environment variables and the cascade never overrides them. `.env` is optional there too (`required: false`, Compose >= 2.24).

Under `NODE_ENV=test` only `.env.test.local` and `.env.test` are read — a local `.env` can never change the result of the test suite. The files that were actually applied are logged at startup as `envFiles`.

## Project Structure

```
node-ts-mcp-server-boilerplate/
├── .github/
│   └── workflows/
│       └── ci.yml                          # Lint, audit, test and Docker build pipeline
├── .husky/
│   └── pre-commit                          # Runs lint-staged
├── .vscode/
│   └── extensions.json                     # Recommended VS Code extensions
├── __tests__/                              # Test suite
│   ├── __mocks__/
│   │   └── notes.mock.ts                   # Shared mock Note fixtures
│   ├── helpers/
│   │   └── create_test_client.helper.ts    # Real Client <-> McpServer linked in-process
│   ├── integration/
│   │   ├── prompts.test.ts                 # prompts/list + prompts/get
│   │   ├── resources.test.ts               # resources/list + resources/read
│   │   └── tools.test.ts                   # tools/list + tools/call (happy path + isError)
│   ├── unit/
│   │   ├── note.dao.test.ts
│   │   ├── note.service.test.ts
│   │   └── to_tool_result.helper.test.ts
│   └── jest.setup.ts                       # Per-test setup (timeout + store reset)
├── src/
│   ├── configs/
│   │   ├── dotenv.config.ts                # Cascading .env file loader
│   │   ├── env.config.ts                   # Zod-validated environment composition
│   │   ├── logger.config.ts                # Pino pinned to stderr
│   │   └── server.config.ts                # Identity, instructions and capabilities
│   ├── constants/
│   │   ├── codes.constant.ts               # Failure codes by outcome (CODES_NOT, CODES_ERROR)
│   │   ├── messages.constant.ts            # Message strings by outcome (MESSAGES_SUCCESS, ...)
│   │   ├── prompts.constant.ts             # Canonical prompt names by subject
│   │   ├── resources.constant.ts           # URI scheme, templates and mime types
│   │   └── tools.constant.ts               # Canonical tool names by subject
│   ├── daos/
│   │   └── note.dao.ts                     # NoteDAO object: in-memory store (CRUD + reset/seed)
│   ├── errors/
│   │   ├── app.error.ts                    # Base AppError (code + isOperational)
│   │   ├── bad_request.error.ts
│   │   ├── conflict.error.ts
│   │   ├── not_found.error.ts
│   │   └── unauthorized.error.ts
│   ├── handlers/
│   │   ├── prompts/
│   │   │   └── summarize_notes.prompt.ts   # SummarizeNotesPromptHandler: builds PromptMessage[]
│   │   ├── resources/
│   │   │   └── note.resource.ts            # NoteResourceHandler: collection, item, template list
│   │   └── tools/
│   │       ├── health.tool.ts              # HealthToolHandler: diagnostic tool
│   │       └── note.tool.ts                # NoteToolHandler: CRUD reference implementation
│   ├── helpers/
│   │   ├── get_exception_message.helper.ts # Normalizes any thrown value
│   │   ├── now_iso.helper.ts               # Single source of ISO-8601 timestamps
│   │   ├── parse_csv.helper.ts             # Comma-separated env value -> string[]
│   │   ├── parse_note_id.helper.ts         # Validates a template variable
│   │   ├── to_error_result.helper.ts       # AppError -> isError CallToolResult
│   │   ├── to_tool_result.helper.ts        # Domain -> content + structuredContent
│   │   └── with_tool_handler.helper.ts     # Centralized try/catch + tracing wrapper
│   ├── middlewares/                        # HTTP transport only
│   │   ├── auth.middleware.ts              # Opt-in bearer guard
│   │   ├── origin_validation.middleware.ts # Origin allow-list + CORS headers
│   │   ├── rate_limit.middleware.ts        # Opt-in IP rate limiter
│   │   └── request_id.middleware.ts        # Generates / propagates x-request-id
│   ├── registries/
│   │   ├── index.ts                        # registerAll — the single wiring point
│   │   ├── prompt.registry.ts              # server.registerPrompt(...)
│   │   ├── resource.registry.ts            # server.registerResource(...)
│   │   └── tool.registry.ts                # server.registerTool(...) + annotations
│   ├── schemas/
│   │   ├── health.schema.ts
│   │   ├── note.schema.ts                  # Input and output schemas
│   │   └── prompt.schema.ts                # Prompt args with completable fields
│   ├── services/
│   │   └── note.service.ts                 # NoteService object: business logic, agnostic of MCP
│   ├── transports/
│   │   ├── http.transport.ts               # Streamable HTTP + middlewares
│   │   └── stdio.transport.ts              # serveStdio(factory)
│   ├── types/
│   │   ├── app.ts                          # ToolHandler, StructuredPayload
│   │   ├── constants.ts                    # Shapes of the constant maps + derived unions
│   │   ├── env.ts                          # Envs interface
│   │   ├── helpers.ts                      # ExceptionInfo
│   │   ├── models.ts                       # Note and its input shapes
│   │   └── zod.ts                          # Types inferred from the Zod schemas
│   ├── mcp.ts                              # createMcpServer factory
│   └── main.ts                             # Entrypoint: transport selection + shutdown
├── examples/
│   ├── claude_desktop_config.json          # Host config snippet (stdio)
│   └── mcp.json                            # VS Code / Cursor config snippet
├── .dockerignore
├── .editorconfig                           # Editor defaults (encoding, indent, EOL)
├── .env.example                            # Environment variable template
├── .npmrc                                  # engine-strict for Node version enforcement
├── .nvmrc                                  # Pinned Node version (22)
├── .prettierignore
├── .prettierrc
├── dev.docker-compose.yml                  # Development stack
├── prod.docker-compose.yml                 # Production stack
├── Dockerfile.development                  # Dev image (tsx watch + hot reload)
├── Dockerfile.production                   # Production image (multi-stage + HEALTHCHECK)
├── eslint.config.js                        # ESLint flat config
├── jest.config.js                          # Jest configuration
├── tsconfig.base.json                      # Shared TypeScript base config
├── tsconfig.app.json                       # App build config
├── tsconfig.test.json                      # Test config
└── tsconfig.json                           # Project references root
```

| Folder / File      | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `.github/`         | GitHub Actions workflows (CI pipeline)                            |
| `__tests__/`       | Test files plus global Jest setup hooks                           |
| `src/configs/`     | Environment validation, logger setup and server identity          |
| `src/constants/`   | Centralized codes, messages, tool names and resource URIs         |
| `src/daos/`        | Data access layer; the in-memory store lives here                 |
| `src/errors/`      | Typed error classes (`AppError` and its subclasses)               |
| `src/handlers/`    | Protocol translation; one file per resource, split by primitive   |
| `src/helpers/`     | Pure utilities and the centralized tool wrapper                   |
| `src/middlewares/` | Express middleware used only by the HTTP transport                |
| `src/registries/`  | Declares the contract the model sees (tools, resources, prompts)  |
| `src/schemas/`     | Zod schemas — the single source of truth for validation and types |
| `src/services/`    | Business logic between handlers and DAOs                          |
| `src/transports/`  | stdio and Streamable HTTP wiring                                  |
| `src/types/`       | TypeScript interfaces and types, split by concern                 |

## Architecture & Design Patterns

The folder layout maps directly onto the layered design below — each folder under `src/` is one layer or one cross-cutting concern.

### Layered Architecture

```
Registries → Handlers → Services → DAOs
```

If you have written a REST API, this is the same shape with different names:

| REST layer  | MCP layer      | Responsibility                                                                |
| ----------- | -------------- | ----------------------------------------------------------------------------- |
| Routes      | **Registries** | Declare the contract: name, description, schemas, annotations. Delegate.      |
| Controllers | **Handlers**   | Translate protocol shapes to domain shapes and back. No logic, no validation. |
| Services    | **Services**   | Business logic. Completely agnostic of MCP — no `CallToolResult`, no `ctx`.   |
| DAOs        | **DAOs**       | Data access only. One object per entity (`NoteDAO`).                          |

Services and handlers are grouped the same way DAOs are: one object per entity (`NoteService`) and one per subject and primitive — `NoteToolHandler`, `HealthToolHandler`, `NoteResourceHandler`, `SummarizeNotesPromptHandler` — so a caller imports one name instead of five. Tool-handler keys mirror the keys of the matching `TOOLS_*` map, which is what makes each registration read `withToolHandler(TOOLS_NOTES.list, NoteToolHandler.list)`.

The payoff is that `services/` and `daos/` are portable: you can lift them straight out of a REST project into this one, or the reverse.

### The stdout rule

Under the stdio transport, **stdout is the JSON-RPC channel**. One stray `console.log` — from your code, or from a dependency — injects a non-JSON line into the stream, and the host drops the connection with no useful diagnostic. This is the single most common way an MCP server breaks and it fails silently.

Three defences ship in this boilerplate:

1. Pino is constructed against `pino.destination({ dest: 2 })`, so every log line goes to stderr.
2. `pino-pretty` is configured with `destination: 2` too, so development output does not leak either.
3. `no-console` is an ESLint **error**, so a stray log cannot reach a commit.

### Tool design

Everything the model sees about a tool is declared in `src/registries/tool.registry.ts`. Three things drive whether the model uses your server correctly:

- **The name.** snake_case, `<subject>_<verb>` so related tools sort together. Never rename a shipped tool — hosts and saved prompts reference it by name.
- **The description.** This is a prompt, not documentation. It is the only thing the model reads when choosing between tools, so state what the tool does, when to reach for it, and when _not_ to. Vague descriptions are the number one cause of a model calling the wrong tool.
- **The annotations.** `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` are behavioural hints hosts use to decide what needs a confirmation dialog. They do not enforce anything — the server is still responsible for its own safety.

Schemas carry their weight too: `.describe()` on every field becomes the JSON Schema description the model reads when filling arguments, and declaring an `outputSchema` means clients get validated `structuredContent` instead of a JSON blob they have to re-parse out of a string.

### Error handling

Domain errors and protocol errors are not the same thing, and confusing them is why some servers feel unusable to a model.

```
Service throws AppError
        ↓
withToolHandler catches it
        ↓
toErrorResult -> { content: [...], isError: true }
        ↓
Model reads the reason and retries with corrected arguments
```

A **thrown** exception becomes a JSON-RPC error, which the host swallows — the model never sees it and cannot recover. An **`isError` result** is delivered to the model as content. So: business failures go through `isError`; a genuinely broken server throws.

`withToolHandler` wraps every handler exactly once, which guarantees no handler can kill the connection with an unhandled rejection, that every error reaches the model in the same `[CODE] message` shape, and that non-operational errors are logged with a stack trace but never echoed back (an internal error string is useless to the model and a potential information leak).

### Fail-fast initialization

Environment variables are parsed through a Zod schema and composed into a typed `Envs` object at import time. If any value is missing or fails coercion, the process throws immediately — listing every offending key — before any transport binds.

### Transport selection

`MCP_TRANSPORT` picks the transport at runtime, so the same server runs locally under a desktop host and remotely behind a load balancer with no code change.

- **stdio** goes through `serveStdio(factory)`. The entry owns the transport and the protocol era, so one instance from your factory serves whichever revision the client opened the connection with — 2025-era and `2026-07-28` hosts both work without a second code path.
- **HTTP** goes through `createMcpHandler(factory)`, which serves the stateless `2026-07-28` revision per request and, by default, 2025-era traffic through the established stateless idiom. One factory, one endpoint, both protocol generations. Statelessness is what lets this scale behind a plain round-robin load balancer with no sticky sessions.

This is why `createMcpServer` is a **factory** and not a singleton: the SDK may build one instance per connection or per request. Never put per-connection mutable state at module scope.

### Security

- **DNS rebinding protection.** The HTTP transport is built on `createMcpExpressApp`, which validates the `Host` header by default. Without it, a localhost MCP server is exposed: an attacker page resolves its own domain to `127.0.0.1` and the request arrives looking same-origin. All localhost MCP servers need this.
- **Bind to `127.0.0.1` by default.** `HTTP_HOST` only opens up if you change it, and `ALLOWED_HOSTS` exists for when you do.
- **Origin allow-list**, off by default because non-browser clients send no `Origin` header at all.
- **Opt-in bearer guard.** `auth.middleware.ts` is a shared-secret placeholder, not an OAuth resource server. If your server is public or multi-tenant, replace it with the SDK's `bearerAuth` plus RFC 9728 protected-resource metadata, and verify the token audience is _this_ server — accepting a token minted for another service is the confused-deputy problem the MCP auth spec exists to prevent. Never pass a user token straight through to an upstream API.
- **Errors never echo internals.** Unknown errors collapse to a generic message.

## Testing

The suite uses Jest with `ts-jest`, and `NoteDAO.reset()` clears the in-memory DAO between tests, so `npm test` runs with `--runInBand`.

The integration tests are the interesting part: `InMemoryTransport.createLinkedPair()` links a real `Client` to a real `McpServer` inside one process — no sockets, no subprocess. That means the tests exercise the actual protocol wiring (schema validation, tool dispatch, resource templates, error mapping) rather than calling handlers directly, which would skip everything the SDK does for you.

```
npm test
```

For a coverage report:

```
npm run test:coverage
```

| Command                 | Description             |
| ----------------------- | ----------------------- |
| `npm run test`          | Run tests               |
| `npm run test:watch`    | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

> `InMemoryTransport.createLinkedPair()` links 2025-era instances. To cover `2026-07-28` behaviour specifically, drive `createMcpHandler(...).fetch` directly through a `StreamableHTTPClientTransport` — the URL is never dialed.

## Security Audit

Once the suite is green, audit dependencies before producing a build.

```
npm audit
npm audit fix
```

## Build

The production pipeline runs `tsc` (TypeScript → JavaScript in `dist/`) followed by `tsc-alias` (rewrites `@/` path aliases to relative paths so the compiled output runs without a runtime resolver).

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run build` | Build for production    |
| `npm run start` | Start production server |

The production Docker image wraps the same build in a multi-stage flow: a `builder` stage compiles and resolves aliases, then a lean `runner` stage copies only `dist/` and production `node_modules` (dev dependencies stripped with `npm prune --omit=dev`), creates a non-root `appuser`, and ships a `HEALTHCHECK` against `/health`.

## Continuous Integration

The repository ships a **GitHub Actions** pipeline in `.github/workflows/ci.yml`, running on every `push` and `pull_request` targeting `main`. Jobs run sequentially — a failure in lint short-circuits the rest.

```
                       ┌─── PR or push to main ───┐
                       ▼                          ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   lint-and-audit     │─▶│       test       │─▶│    docker-build      │
│ eslint · prettier ·  │  │  jest (npm test) │  │ Dockerfile.dev +     │
│ tsc · npm audit      │  │                  │  │ Dockerfile.prod      │
└──────────────────────┘  └──────────────────┘  └──────────────────────┘
```

1. **`lint-and-audit`** — `npm ci`, then `npm run lint`, `npm run format:check`, `npm run type-check` and `npm audit --audit-level=high`.
2. **`test`** — the full Jest suite via `npm test`. Gated on `lint-and-audit`.
3. **`docker-build`** — matrix build of both Dockerfiles with `push: false`, so Dockerfile regressions are caught without needing a registry. Gated on `test`.

The Node version is pinned via `.nvmrc` (currently `22`) and consumed by `actions/setup-node` in every job. `.npmrc` enables `engine-strict=true`, so incompatible Node versions fail fast instead of producing a half-installed tree.

### Running the same checks locally

```
npm ci
npm run lint
npm run format:check
npm run type-check
npm audit --audit-level=high
npm test
docker build -f Dockerfile.development -t mcp-server:dev .
docker build -f Dockerfile.production -t mcp-server:prod .
```

## Production

Pre-flight checklist before deploying:

1. [Testing](#testing) — full suite green.
2. [Security Audit](#security-audit) — `npm audit` clean (or known-safe).
3. [Build](#build) — production image builds successfully.

Then configure the runtime environment:

```
NODE_ENV=production
MCP_TRANSPORT=http
HTTP_HOST=0.0.0.0
ALLOWED_HOSTS=your-domain.com
AUTH_ENABLED=true
AUTH_TOKEN=<a real secret>
RATE_LIMIT_MAX=120
```

And start the stack:

```
docker-compose -f prod.docker-compose.yml up --build --force-recreate
```

## Adding your own domain

The wiring never changes. For a new capability:

1. Add a Zod schema in `src/schemas/`, with `.describe()` on every field.
2. Export its inferred types from `src/types/zod.ts`.
3. Add the business logic as a property on the entity's `<Entity>Service` object in `src/services/` (and `src/daos/` if it touches storage).
4. Add a property to the subject's `<Subject>ToolHandler` object in `src/handlers/tools/` that calls the service and returns `toToolResult(...)`.
5. Add the tool name to `src/constants/tools.constant.ts`, using the same key as the handler property.
6. Register it in `src/registries/tool.registry.ts` with a description, schemas and annotations.

Then delete the `Note` example entirely — it is a reference implementation, not a dependency.

## Known Issues

None at the moment.

## Portfolio Link

https://www.diegolibonati.com.ar/#/project/node-ts-mcp-server-boilerplate
