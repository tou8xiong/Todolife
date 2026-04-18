# Todolife Project - AI Developer Guide

## Project Overview

This is a **Next.js 16** todo list application called **Todolife** with AI-powered features.

## Key Technologies

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4, cva, clsx, tailwind-merge
- **Auth/Database**: Supabase
- **AI**: Google Gemini (gemini-2.5-flash, gemini-2.5-flash-lite)
- **Rich Text**: TipTap editor
- **PDF**: pdfjs-dist, pdf-lib
- **UI Components**: Radix UI (Alert Dialog, Dropdown Menu)
- **Icons**: Lucide React, React Icons
- **Animations**: AOS

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── agent/         # AI Agent API
│   │   ├── tasks/        # Tasks CRUD
│   │   ├── folders/      # Folders CRUD
│   │   └── documents/    # Documents API
│   ├── dashboard/        # Main dashboard
│   ├── agent/            # AI Chat page
│   ├── pdfeditor/        # PDF editor
│   ├── notetext/         # Rich text note editor
│   ├── mytasks/          # Task management
│   └── ...
├── components/            # Reusable components
│   ├── layout/           # Header, Sidebar, Footer
│   ├── tasks/            # Task components
│   ├── pdf/              # PDF components
│   ├── ui/               # UI primitives
│   └── agent/            # AI chat components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities (Supabase, Redis, utils)
└── types/                # TypeScript definitions
```

## AI Agent Behavior Rules

When working on this project, ALWAYS follow these rules:

### 1. Read First
- Read `AGENTS.md` at project root before any work
- Read `src/readme.md` (this file) for project context

### 2. Ask Before Editing
- NEVER modify existing files without explicit permission
- Ask user: "Can I edit [filename] to [what you want to do]?"
- Wait for confirmation before making changes

### 3. Only Implement What's Asked
- Do exactly what user requests - no more, no less
- Don't add extra features, helper functions, or comments
- If unclear, ask for clarification

### 4. Follow Existing Patterns
- Check existing code for style/patterns before writing new code
- Use same conventions as the rest of the project

### 5. Never Do Unprompted
- ❌ Don't commit or push
- ❌ Don't create files unless asked
- ❌ Don't add extra features
- ❌ Don't make assumptions

## API Keys Required

- `GEMINI_API_KEY` - For AI agent functionality
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - Backend Supabase access

## Important Files

- `src/app/api/agent/route.ts` - AI chat API (Gemini)
- `src/lib/supabase.ts` - Supabase client
- `src/lib/redis.ts` - Redis caching
- `src/hooks/useTasks.ts` - Task management hook
- `src/context/AppContext.tsx` - Global app state

---

*AI developers must read this file before implementing any code*


and also read the C:\Users\USER\OneDrive\Documents\GitHub\Todolife\AGENTS.md for ai role