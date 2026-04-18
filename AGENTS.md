# AI Agent Instructions for Todolife Project

## Core Rules

### 1. Read Instructions First
- BEFORE implementing ANY code or making changes, read this `AGENTS.md` file completely
- Read `src/readme.md` to understand project context and any specific implementation guidelines
- If you don't understand the task, ask clarifying questions BEFORE starting

### 2. Ask Before Editing
- NEVER edit, modify, or delete existing files without explicit permission from the user
- If you want to make changes, ASK the user first and explain what you want to do
- Wait for user confirmation before making any modifications

### 3. Only Write What's Requested
- Implement ONLY what the user explicitly asks for
- Don't add extra features, comments, or code the user didn't request
- Don't make assumptions about what the user wants - ask if unclear
- If the user asks for something that seems incomplete, ask for clarification first

### 4. Follow Existing Code Patterns
- Before writing new code, examine existing files in the project to understand:
  - File structure and organization
  - Coding conventions and style
  - Libraries and frameworks being used
  - Component patterns
- Match the existing code style - don't introduce new patterns unless explicitly asked

### 5. Verify and Test
- After implementing code, run any available lint/typecheck commands
- If tests exist, run them to verify your changes work correctly
- Report any errors or issues to the user

---

## Workflow

1. **Understand**: Read the user's request completely
2. **Research**: Explore relevant files in the codebase
3. **Clarify**: Ask questions if anything is unclear
4. **Plan**: Present your plan to the user for approval
5. **Wait**: Don't implement until user confirms
6. **Implement**: Make changes after getting approval
7. **Verify**: Run lint/tests and report results

---

## Response Guidelines

- Keep responses concise and direct
- Answer the specific question asked - don't ramble
- If you need more information to proceed, ask the user
- Don't provide unsolicited advice or extra information

---

## Project Context

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4 with cva, clsx, tailwind-merge
- **Database/Auth**: Supabase
- **AI**: Google Gemini (gemini-2.5-flash, gemini-2.5-flash-lite)
- **Rich Text**: TipTap editor
- **PDF**: pdfjs-dist, pdf-lib
- **UI**: Radix UI components (Alert Dialog, Dropdown Menu)
- **Icons**: Lucide React, React Icons
- **Animations**: AOS

---

## Important Notes

- This project uses Supabase for authentication and database
- Redis is used for caching (see `src/lib/redis.ts`)
- API routes are in `src/app/api/*/route.ts`
- Components are in `src/components/*`
- Pages are in `src/app/*/page.tsx`
- Custom hooks are in `src/hooks/*`
- Utility functions are in `src/lib/*`
- Types are in `src/types/*`

---

## Never Do Without Permission

- ❌ Don't auto-edit files
- ❌ Don't add extra features
- ❌ Don't commit changes
- ❌ Don't push to remote
- ❌ Don't create new files (unless explicitly asked)
- ❌ Don't delete anything
- ❌ Don't make assumptions about what user wants
- ❌ Don't skip asking questions when unclear

---

## Commit Protocol

Only commit when explicitly requested by the user:
- Run `git status` to see changes
- Run `git diff` to see what was modified
- Run `git log` to see commit message style
- Create a clear, concise commit message
- Never include secrets, credentials, or .env files

---

*Last updated: 2026-04-18*