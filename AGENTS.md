# AGENT.md

# ═══════════════════════════════════════════════════════════════
# PROJECT IDENTITY
# ═══════════════════════════════════════════════════════════════

## Project Identity

- **Name**: Todolife
- **Purpose**: A comprehensive productivity app with task management, AI-powered chat, PDF editing, and note-taking features
- **Domain**: Productivity / Productivity SaaS
- **Status**: Active development

# ═══════════════════════════════════════════════════════════════
# TECH STACK & VERSIONS
# ═══════════════════════════════════════════════════════════════

## Tech Stack

- **Runtime**: Node.js (Next.js bundler, Turbopack in dev)
- **Framework**: Next.js 16.x with App Router (NOT Pages Router)
- **Language**: TypeScript 5.x
- **Auth**: Firebase Auth (client SDK) — ID tokens are sent to the server and verified with `verifyAuth`
- **Database**: Supabase (PostgreSQL) — rows are keyed by the user's email from the verified ID token
- **AI**: Google Gemini (gemini-2.0-flash-exp, gemini-1.5-pro)
- **Rich Text**: TipTap editor
- **PDF**: pdfjs-dist, pdf-lib
- **Styling**: Tailwind CSS 4 with cva, clsx, tailwind-merge
- **UI**: Radix UI primitives + lucide-react / react-icons
- **Font**: EB Garamond via `next/font/google` — project-wide default (sans/serif/mono tokens all resolve to it)
- **Theming**: `ThemeProvider` (light/dark) via `next-themes` pattern; CSS tokens in `globals.css`
- **i18n**: `LanguageContext` + `src/locales/translations.ts` — never hardcode UI strings, use `t.*` keys
- **Cache**: Redis via ioredis
- **Email**: Resend, Nodemailer
- **Animations**: AOS (via `AosClientWrapper`)
- **PWA**: `public/manifest.json`, theme-color, apple-touch-icon (installable on iOS/Android)
- **Deployment**: Vercel (production at https://todolife.vercel.app)
- **Testing**: Manual testing (no automated tests configured)

# ═══════════════════════════════════════════════════════════════
# PROJECT STRUCTURE
# ═══════════════════════════════════════════════════════════════

## Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (RESTful)
│   │   ├── agent/         # AI chat endpoint
│   │   ├── auth/          # Auth routes (reset-password)
│   │   ├── documents/     # Document CRUD
│   │   ├── folders/       # Folder CRUD
│   │   ├── ideas/         # Ideas API
│   │   ├── profile/       # User profile
│   │   ├── tasks/         # Task CRUD
│   │   └── export-pdf/     # PDF export
│   └── [routes]/          # Page routes (dashboard, agent, pdfeditor, etc.)
├── components/            # React components
│   ├── layout/            # Header, Sidebar, Footer, ThemeToggle
│   ├── tasks/             # TaskList, AddTasks, DoneTasks
│   ├── pdf/               # Toolbar, AnnotationItem, DownloadModal
│   ├── ui/                # UI primitives (AlertDialog, ConfirmDeleteItems, etc.)
│   ├── agent/             # AgentChat component
│   ├── ocr/               # ImageToText component
│   └── timer/             # TimerPopup, TimerSettings
├── context/               # React contexts (AppContext, LanguageContext, ThemeProvider)
├── hooks/                 # Custom hooks (useTasks, useConversations, etc.)
├── lib/                   # Utilities (supabase, redis, utils, pdfUtils, i18n)
├── locales/               # i18n translations
├── types/                 # TypeScript definitions
└── utils/                 # AI prompts, helpers
```

# ═══════════════════════════════════════════════════════════════
# COMMANDS TO KNOW
# ═══════════════════════════════════════════════════════════════

## Commands

- `npm run dev` - Development server with turbopack
- `npm run build` - Production build
- `npm start` - Production server

# ═══════════════════════════════════════════════════════════════
# ARCHITECTURE DECISIONS
# ═══════════════════════════════════════════════════════════════

## Architecture Decisions

- Supabase client stored in `src/lib/supabase.ts` with graceful fallback for missing env vars
- Firebase client stored in `src/lib/firebase.ts` — auth-only; data lives in Supabase
- Redis client in `src/lib/redis.ts` for caching (sessions, API responses)
- API routes follow RESTful pattern: GET, POST, PUT, DELETE with proper status codes
- Error handling returns JSON `{ error: "message" }` with status 500 on failure
- Client components use "use client" directive
- Utility function `cn()` from `@/lib/utils` for conditional Tailwind classes

### Auth flow (important)
1. Client signs in with Firebase (`firebase/auth`).
2. Client calls API routes via the `authFetch` helper (`src/lib/authFetch.ts`), which attaches the Firebase ID token in `Authorization: Bearer <token>`.
3. Server route handlers call `verifyAuth(request)` to validate the token and extract the email.
4. Supabase rows are stored/queried **by user email** (not Firebase UID).
5. The agent route uses the email as the conversation/scope key.

### Delete-then-insert pattern
Some endpoints (e.g. `/api/tasks` POST) replace the full row set: server loads existing rows, mutates the array, then deletes+inserts the whole list. Prefer this pattern over partial updates for consistency.

### AI agent contract (`/api/agent`)
The Gemini agent can mutate user tasks via inline tags in its reply. The server parses and applies them:
- `[TASK_CREATE]{ "title": "...", "type": "work|study|activities", ... }[/TASK_CREATE]`
- `[TASK_UPDATE]{ "id": 123, "title": "..." }[/TASK_UPDATE]`
- `[TASK_DELETE]{ "id": 123 }[/TASK_DELETE]`
Tags are stripped from the user-facing response. When changing the agent prompt or schema, update both the prompt in `src/utils/` and the parser to keep them in sync.

# ═══════════════════════════════════════════════════════════════
# CODING CONVENTIONS
# ═══════════════════════════════════════════════════════════════

## Conventions

- **File naming**: PascalCase for components (e.g., `TaskList.tsx`), camelCase for hooks/utilities
- **Components**: Functional components with hooks, props interface above component
- **Imports**: Use `@/` path alias for src/ imports
- **Error handling**: try/catch with console.error and return 500 status
- **Comments**: Only for complex logic, not for obvious code
- **State**: Use React useState/useCallback patterns, avoid unnecessary useEffect
- **Auth-protected client fetches**: always use `authFetch` (not raw `fetch`) so the Firebase ID token is attached
- **Auth-protected server routes**: always call `verifyAuth(request)` first and bail with 401 on failure
- **i18n**: never hardcode UI strings — read them from `useLanguage()` as `t.<section>.<key>`. Add new keys to `src/locales/translations.ts` in every locale
- **Colors**: stick to the project palette — blue (header), amber (accents/hover), slate/gray (neutral), red (danger), yellow (warning). Do **not** introduce green or violet/purple — they were retired
- **Font**: do not set `font-family` inline unless rendering for export (PDF, email). Browser-rendered UI should inherit EB Garamond
- **Mobile-first**: every UI change must work on ~320–375px screens. Test small breakpoints, not just desktop

# ═══════════════════════════════════════════════════════════════
# ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Backend Supabase access (server-only)
- `GEMINI_API_KEY` - Google Gemini API key (server-only)
- `REDIS_URL` - Redis connection URL (server-only)
- `RESEND_API_KEY` - Email service (server-only)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK creds for `verifyAuth` (server-only, JSON string)
- Firebase web SDK config is hardcoded in `src/lib/firebase.ts` (public-safe — gated by Firebase Auth rules, not by hiding keys)

**Config access**: Use `import supabase from '@/lib/supabase'` and `import { auth } from '@/lib/firebase'` (NOT `process.env` directly)
**Secret hygiene**: never read server-only envs from client components; if a client needs data, route it through an API endpoint.

# ═══════════════════════════════════════════════════════════════
# TESTING STRATEGY
# ═══════════════════════════════════════════════════════════════

## Testing

- Manual testing only
- No automated test framework configured
- Verify changes by running dev server and testing functionality

# ═══════════════════════════════════════════════════════════════
# DOMAIN GLOSSARY
# ═══════════════════════════════════════════════════════════════

## Domain Glossary

- **Task**: A todo item with `title`, `description`, `priority` (low/medium/high), `date`, `time`, `type` (work/study/activities), `completed`, `completedAt`
- **Document**: Rich text note stored with TipTap JSON content
- **Folder**: Container for organizing documents
- **Idea**: Quick free-form note stored separately from documents (Idea Notes feature)
- **Agent**: AI chat assistant powered by Gemini — can mutate tasks via `TASK_CREATE/UPDATE/DELETE` tags
- **Conversation**: Chat history for agent interactions, scoped by user email
- **Timer / Session**: Pomodoro-style focus session recorded with start time + duration; visible on dashboard
- **Annotation**: Draggable text/highlight overlay placed on a PDF page in `/pdfeditor`

# ═══════════════════════════════════════════════════════════════
# EXTERNAL INTEGRATIONS
# ═══════════════════════════════════════════════════════════════

## Integrations

- **Firebase**: `firebase/auth` (client) + `firebase-admin` (server `verifyAuth`) — sign-in, ID tokens
- **Supabase**: `@supabase/supabase-js` — PostgreSQL data store, keyed by user email
- **Gemini**: `@google/generative-ai` — AI chat and generation
- **TipTap**: `@tiptap/react` — Rich text editor
- **PDF**: `pdfjs-dist`, `pdf-lib` — PDF viewing and manipulation
- **html2canvas + jsPDF**: client-side PDF export from rendered DOM (notetext)
- **Tesseract.js**: client-side OCR for the image-to-text tool
- **@imgly/background-removal**: client-side image background removal
- **Resend / Nodemailer**: outbound email (password reset)

# ═══════════════════════════════════════════════════════════════
# ROUTE MAP
# ═══════════════════════════════════════════════════════════════

## Routes

Public:
- `/` — landing page (`HomeClient`)
- `/formlogin`, `/formsignup`, `/forgot-password` — Firebase Auth flows

Authenticated app:
- `/dashboard` — completed-session stats + timer summary
- `/newtasks`, `/mytasks`, `/completetasks` — task CRUD by status
- `/settimepage` — focus timer setup; popup driven by `TimerPopup`
- `/noteidea` — quick idea notes
- `/notetext` — rich text editor (TipTap) with PDF export
- `/pdfeditor` — PDF viewer + annotation tool
- `/background-removal` — client-side image bg removal
- `/imagetotext` — OCR via Tesseract
- `/agent` — Gemini chat with task-mutation tags
- `/profile`, `/settings` — user profile + preferences

API (all under `/api`):
- `auth/reset-password` — Resend email
- `tasks` (GET/POST) — list / replace
- `documents`, `folders`, `ideas` — CRUD
- `profile` — get/update profile (avatar stored as base64)
- `agent` — Gemini chat + task-tag parser
- `export-pdf` — server-side PDF generation (uses Georgia, not EB Garamond — webfont not available server-side)

# ═══════════════════════════════════════════════════════════════
# CONSTRAINTS & GOTCHAS
# ═══════════════════════════════════════════════════════════════

## Constraints

- NEVER commit `.env.local` or any file with real API keys
- NEVER modify existing files without explicit user permission
- NEVER auto-commit or auto-push changes
- API routes must return JSON responses, never raw text
- Components using browser APIs must be "use client"
- Profile avatars are stored as **base64 data URLs** in Supabase (not as files). Keep this in mind when changing the profile API — payloads can be large.
- Firebase web SDK config is hardcoded (not env-loaded). Don't migrate it to envs without aligning the build pipeline.
- Server-side PDF/email rendering cannot use EB Garamond — the webfont isn't available in Node. Keep Georgia/sans-serif fallbacks in `api/export-pdf` and `api/auth/reset-password`.
- `/api/tasks` POST replaces the **whole** task array. Always re-fetch then mutate then post — don't post a single task.

# ═══════════════════════════════════════════════════════════════
# CORE RULES
# ═══════════════════════════════════════════════════════════════

## Core Rules

### 1. Read Instructions First
- BEFORE implementing ANY code or making changes, read this `AGENTS.md` file completely
- Read `src/readme.md` to understand project context and any specific implementation guidelines
- If you don't understand the task, ask clarifying questions BEFORE starting

### 2. Ask Before Editing
- NEVER edit, modify, or delete existing files without explicit permission from the user
- If you want to make changes, ASK the user first and explain what you want to do
- Wait for user confirmation before making any modifications
- Exception: Bug fixes in obvious issues (typos, syntax errors) can be fixed silently

### 3. Only Write What's Requested
- Implement ONLY what the user explicitly asks for
- Don't add extra features, comments, or code the user didn't request
- Don't make assumptions about what the user wants - ask if unclear

### 4. Follow Existing Code Patterns
- Before writing new code, examine existing files to understand conventions
- Match the existing code style - don't introduce new patterns unless explicitly asked

### 5. Verify and Test
- After implementing code, run any available lint/typecheck commands
- Report any errors or issues to the user

### 6. Preview & Confirm Before Editing
- Before any edit, show a preview using a code block
- Use `# ── EXISTING (to be removed) ──` for lines being replaced
- Use `# ── NEW (to be added) ──` for replacement lines
- After preview, use the question tool with selectable options
- Never edit without explicit approval

# ═══════════════════════════════════════════════════════════════
# WORKFLOW
# ═══════════════════════════════════════════════════════════════

## Workflow

### Phase 1: Understand (Immediate)
1. Read the user's request completely
2. Identify the exact scope of work
3. Check if there are related files or dependencies
4. Ask clarifying questions if anything is unclear

### Phase 2: Research (2-5 minutes)
1. Explore relevant files in the codebase
2. Find similar implementations to use as reference
3. Understand the data flow and architecture

### Phase 3: Plan (1-2 minutes)
1. Present your plan to the user for approval
2. Break down the work into steps
3. Identify potential issues or risks

### Phase 4: Wait (Patience)
1. Don't implement until user confirms
2. Wait for explicit approval

### Phase 5: Implement (After Approval)
1. Make changes one step at a time
2. Test after each significant change
3. Keep commits small and focused

### Phase 6: Verify (Before Reporting)
1. Run lint: `npx tsc --noEmit` or check for TypeScript errors
2. Check for console errors
3. Verify the feature works as expected

# ═══════════════════════════════════════════════════════════════
# RESPONSE GUIDELINES
# ═══════════════════════════════════════════════════════════════

## Response Guidelines

### Be Concise
- Keep responses short and direct
- Answer the specific question asked - don't ramble
- Use bullet points when listing items
- Maximum 3-4 sentences unless user asks for detail

### Don't Provide Unsolicited
- Don't add extra features
- Don't suggest improvements outside the scope
- Don't provide tutorials or explanations unless asked
- Don't make structural changes without approval

### Communication Style
- Use clear, simple language
- Be friendly but professional
- Use code snippets when helpful
- Include file paths when referencing code

# ═══════════════════════════════════════════════════════════════
# NEVER DO WITHOUT PERMISSION
# ═══════════════════════════════════════════════════════════════

## Never Do Without Permission

### Don't Do These Automatically
- ❌ Auto-edit files
- ❌ Add extra features
- ❌ Commit changes
- ❌ Push to remote
- ❌ Create new files (unless explicitly asked)
- ❌ Delete anything
- ❌ Make assumptions about what user wants
- ❌ Skip asking questions when unclear
- ❌ Refactor existing code
- ❌ Add comments (unless requested)
- ❌ Write tests (unless requested)

### When It's Okay to Break Rules
- Fix obvious typos in strings
- Add missing error handling
- Fix linting errors in changed code

# ═══════════════════════════════════════════════════════════════
# COMMIT PROTOCOL
# ═══════════════════════════════════════════════════════════════

## Commit Protocol

Only commit when explicitly requested by the user:

### Before Committing
1. Run `git status` to see changes
2. Run `git diff` to see what was modified
3. Review what will be committed

### Commit Message Format
```
type: short description

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

# ═══════════════════════════════════════════════════════════════
# DEBUGGING TIPS
# ═══════════════════════════════════════════════════════════════

## Debugging Tips

### When Something Doesn't Work
1. Check browser console for errors
2. Check server terminal for errors
3. Verify API responses with network tab
4. Check database queries
5. Verify environment variables

### Common Issues
- **Build errors**: Check TypeScript types
- **Runtime errors**: Check console logs
- **API errors**: Check route handlers
- **Auth errors**: Check Supabase client
- **Styling issues**: Check Tailwind classes

---

*Last updated: 2026-06-07*
