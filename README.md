# Marijana Mandić — Portfolio & Admin Panel

A production-ready portfolio site for a Senior Project Manager, with a
password-protected admin panel for editing every piece of content without
touching code.

- **Public site**: hero, impact metrics, about/methodology, project grid with
  case-study modals, dedicated project pages, contact form, dark/light mode.
- **Admin panel** at `/admin`: content editing, project CRUD with drag-free
  reordering, image uploads (auto-converted to WebP), and a message inbox.
- **Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 ·
  SQLite (better-sqlite3) · sharp · Docker.

---

## Quick start

```bash
# 1. Configure secrets (edit the values — see "Configuration" below)
cp .env.example .env

# 2. Build and start everything
docker compose up -d --build

# 3. Open the site
#    Public  -> http://localhost:3000
#    Admin   -> http://localhost:3000/admin
```

Check it came up healthy, and follow the logs:

```bash
docker compose ps
docker compose logs -f app
```

Stop it (keeps your data):

```bash
docker compose down
```

Stop it **and delete the database and uploads**:

```bash
docker compose down -v
```

---

## Configuration

All configuration lives in `.env`, which `docker-compose.yml` reads via
`env_file`. Nothing secret is baked into the image.

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_USERNAME` | yes | Username for `/admin`. |
| `ADMIN_PASSWORD` | yes | Password for `/admin`. Use a long, unique value. |
| `AUTH_SECRET` | yes | Signs admin session JWTs. Minimum 32 characters. |
| `DATA_DIR` | no | SQLite directory. Defaults to `/app/data`. |
| `UPLOAD_DIR` | no | WebP upload directory. Defaults to `/app/uploads`. |
| `PORT` | no | Port the server listens on. Defaults to `3000`. |

Generate a strong secret with:

```bash
openssl rand -base64 48
```

> **Note on `ADMIN_PASSWORD`**: the password is compared using a constant-time
> hash comparison, and login attempts are rate-limited to 5 per 15 minutes per
> IP address. Even so, this panel protects live content — use a long password
> and put the app behind HTTPS.

---

## Running locally without Docker

Requires Node.js 22+.

```bash
npm install
cp .env.example .env          # set AUTH_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
npm run dev                   # http://localhost:3000
```

The database is created and seeded automatically on first request.

Production build:

```bash
npm run build
npm start
```

Useful extras:

```bash
npm run seed                  # create/seed the database without starting the server
npm run seed -- --force       # wipe the database and reseed the shipped defaults
npm run typecheck             # TypeScript, no emit
npm run lint                  # ESLint
```

---

## Architecture

```
.
├── Dockerfile                  # 3-stage build: deps -> builder -> alpine runtime
├── docker-compose.yml          # app service, named volumes, healthcheck, hardening
├── .env.example                # configuration template
├── scripts/seed.ts             # standalone seeding / reset CLI
├── src/
│   ├── app/
│   │   ├── layout.tsx          # fonts, metadata, pre-paint theme script
│   │   ├── globals.css         # Tailwind v4 theme tokens, dark mode, local @font-face
│   │   ├── page.tsx            # public homepage (server component)
│   │   ├── not-found.tsx       # 404
│   │   ├── robots.ts           # disallows /admin and /api
│   │   ├── projects/[slug]/    # standalone case-study pages
│   │   ├── admin/page.tsx      # session-gated: login form OR dashboard
│   │   └── api/
│   │       ├── health/         # liveness probe (used by Docker healthcheck)
│   │       ├── contact/        # public form submission
│   │       ├── media/[file]/   # serves uploaded WebP files
│   │       ├── auth/           # login, logout, session
│   │       └── admin/          # content, projects, reorder, upload, messages
│   ├── components/
│   │   ├── admin/              # dashboard shell + panels
│   │   └── *.tsx               # public sections
│   ├── lib/
│   │   ├── db.ts               # schema, migrations, all queries, lazy seed
│   │   ├── seed-data.ts        # the executive-level copy shipped on first run
│   │   ├── auth.ts             # JWT sessions in an HTTP-only cookie
│   │   ├── images.ts           # sharp pipeline: validate -> resize -> WebP
│   │   ├── validation.ts       # input parsing and ValidationError
│   │   ├── rate-limit.ts       # in-memory sliding-window limiter
│   │   └── api-helpers.ts      # guard() and handle() wrappers for routes
│   └── fonts/                  # self-hosted Inter + Plus Jakarta Sans (woff2)
└── data/  uploads/             # created at runtime; mounted as Docker volumes
```

### Why these choices

**SQLite via better-sqlite3.** Reads are synchronous and in-process — no
network hop, no connection pool, no separate service to run or back up. A
portfolio is read-mostly, so this is close to the fastest option available and
the entire database is a single file you can copy.

**`output: "standalone"`.** Next.js traces exactly which modules the server
actually imports and emits a self-contained bundle, so the runtime image ships
a fraction of `node_modules` instead of all of it.

**WebP conversion on upload.** Images are re-encoded once, at upload time, into
two sizes (full up to 1600px and a 640×480 thumbnail). Pages then serve
pre-optimised files with a one-year immutable cache header, so image handling
costs nothing at request time.

**Self-hosted fonts.** The woff2 files live in `src/fonts/` and are inlined by
the build, so the image builds hermetically — no network access to Google
Fonts during `docker build`.

---

## Data and backups

Two named volumes hold all mutable state:

| Volume | Container path | Contents |
|---|---|---|
| `portfolio-data` | `/app/data` | `portfolio.db` (content, projects, messages) |
| `portfolio-uploads` | `/app/uploads` | Uploaded WebP files |

Back up the database (safe to run while the app is live — SQLite's
`.backup` command takes a consistent snapshot):

```bash
docker compose exec app sh -c \
  'sqlite3 /app/data/portfolio.db ".backup /tmp/backup.db"' 2>/dev/null \
  || docker compose cp app:/app/data/portfolio.db ./backup.db
docker compose cp app:/app/uploads ./uploads-backup
```

Restore:

```bash
docker compose cp ./backup.db app:/app/data/portfolio.db
docker compose restart app
```

---

## Security notes

Implemented:

- Admin sessions are signed JWTs (`HS256`) in an `HttpOnly`, `SameSite=Lax`,
  `Secure`-in-production cookie with an 8-hour expiry.
- The `/admin` route decides between the login form and the dashboard **on the
  server**, so unauthenticated visitors never receive the dashboard markup.
- Every `/api/admin/*` route re-checks the session independently of the page.
- Password comparison is constant-time; login is rate-limited to 5 attempts per
  15 minutes per IP, and the contact form to 3 submissions per 10 minutes per IP.
- Uploads are validated by both declared MIME type and actual decoded content,
  capped at 8 MB, and re-encoded through sharp — which strips EXIF metadata
  (including GPS) and neutralises anything hidden in the original file.
- Link fields (`hero` CTAs, `linkedinUrl`) are validated as URLs before storage,
  so an admin field cannot be used to store a `javascript:` or `data:` URI that
  would execute when a visitor clicks it. Image fields are restricted to
  uploaded paths or `https://` URLs for the same reason.
- `/api/media/[filename]` resolves filenames strictly, rejecting any path
  traversal attempt, and serves with `X-Content-Type-Options: nosniff`.
- The container runs as a non-root user with all capabilities dropped,
  `no-new-privileges`, and a read-only-except-volumes filesystem.
- `robots.txt` disallows `/admin` and `/api`.

Before exposing this publicly:

1. Terminate TLS in front of it (Caddy, nginx, or Traefik). The `Secure` cookie
   flag means admin login only works over HTTPS in production.
2. Set a long, unique `ADMIN_PASSWORD` and `AUTH_SECRET`.
3. Consider restricting `/admin` to a VPN or an IP allowlist at the proxy.

---

## Docker commands reference

```bash
# Build the image
docker compose build

# Build and start in the background
docker compose up -d --build

# Rebuild after a code change
docker compose up -d --build --force-recreate

# Status and logs
docker compose ps
docker compose logs -f app

# Healthcheck result for the container
docker inspect --format '{{.State.Health.Status}}' marijana-portfolio

# Open a shell in the running container
docker compose exec app sh

# Restart / stop / remove
docker compose restart app
docker compose stop
docker compose down            # keeps volumes
docker compose down -v         # deletes volumes (database + uploads)

# Build the image without compose
docker build -t marijana-portfolio:latest .
docker run -d --name portfolio \
  -p 127.0.0.1:3000:3000 \
  --env-file .env \
  -e DATA_DIR=/app/data -e UPLOAD_DIR=/app/uploads \
  -v portfolio-data:/app/data \
  -v portfolio-uploads:/app/uploads \
  marijana-portfolio:latest
```

---

## Using the admin panel

1. Go to `/admin` and sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
2. **Content** — four tabs (Hero, Key metrics, About & methodology, Contact
   details). Each tab saves independently; changes are live immediately.
3. **Projects** — add, edit, delete, feature/unfeature, and reorder with the
   ▲/▼ buttons. The order here is the order on the homepage.
4. **Inbox** — read messages from the contact form. Opening one marks it read;
   the unread count appears on the tab.

### Uploading images

Drag a file onto the upload area, or click to browse. Accepted: JPEG, PNG,
WebP, AVIF, GIF, TIFF — up to 8 MB. Each upload produces a full-size WebP and a
thumbnail, both stored in `UPLOAD_DIR`. You can also paste a remote image URL
instead of uploading.

Replacing an image on a project deletes the file it replaced, so the uploads
volume does not grow with orphaned files.

---

## Publishing the image to Docker Hub

The image is self-contained, so it can be pushed and pulled anywhere:

```bash
# Build first, then push with a Docker Hub access token
docker compose build
DOCKERHUB_USER=blazanmaric DOCKERHUB_TOKEN=<access-token> \
  sh scripts/push-dockerhub.sh
```

Or by hand:

```bash
docker tag marijana-portfolio:latest blazanmaric/marijana-portfolio:latest
docker login -u blazanmaric          # paste an access token, not your password
docker push blazanmaric/marijana-portfolio:latest
```

Pull and run it on another machine — no source code needed:

```bash
docker run -d --name portfolio \
  -p 3000:3000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD='a-long-unique-password' \
  -e AUTH_SECRET="$(openssl rand -base64 48)" \
  -v portfolio-data:/app/data \
  -v portfolio-uploads:/app/uploads \
  blazanmaric/marijana-portfolio:latest
```

Note: `ADMIN_PASSWORD` and `AUTH_SECRET` are read at runtime and are **not** baked
into the image, so the published image is safe to make public — but always set
both when running it.
