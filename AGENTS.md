# AI Agent Instructions for Todolife Project

## Core Rules

### 1. Read Instructions First
- BEFORE implementing ANY code or making changes, read this `AGENTS.md` file completely
- Read `src/readme.md` to understand project context and any specific implementation guidelines
- If you don't understand the task, ask clarifying questions BEFORE starting
- Check for any existing documentation in `docs/` folder

### 2. Ask Before Editing
- NEVER edit, modify, or delete existing files without explicit permission from the user
- If you want to make changes, ASK the user first and explain what you want to do
- Wait for user confirmation before making any modifications
- Exception: Bug fixes in obvious issues (typos, syntax errors) can be fixed silently

### 3. Only Write What's Requested
- Implement ONLY what the user explicitly asks for
- Don't add extra features, comments, or code the user didn't request
- Don't make assumptions about what the user wants - ask if unclear
- If the user asks for something that seems incomplete, ask for clarification first
- Keep code changes minimal and focused

### 4. Follow Existing Code Patterns
Before writing new code, examine existing files in the project to understand:
- File structure and organization
- Coding conventions and style
- Libraries and frameworks being used
- Component patterns
- Match the existing code style - don't introduce new patterns unless explicitly asked

### 5. Verify and Test
- After implementing code, run any available lint/typecheck commands
- If tests exist, run them to verify your changes work correctly
- Report any errors or issues to the user
- Always test your changes locally before reporting completion

---

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
4. Check for existing utilities or helpers

### Phase 3: Plan (1-2 minutes)
1. Present your plan to the user for approval
2. Break down the work into steps
3. Estimate complexity and time
4. Identify potential issues or risks

### Phase 4: Wait (Patience)
1. Don't implement until user confirms
2. Wait for explicit approval
3. If no response in 2+ minutes, ask if should proceed

### Phase 5: Implement (After Approval)
1. Make changes one step at a time
2. Test after each significant change
3. Keep commits small and focused
4. Don't refactor unrelated code

### Phase 6: Verify (Before Reporting)
1. Run lint: `npm run lint` or `npx tsc --noEmit`
2. Run tests if available
3. Check for console errors
4. Verify the feature works as expected

---

## Response Guidelines

### Be Concise
- Keep responses short and direct
- Answer the specific question asked - don't ramble
- Use bullet points when listing items
- Maximum 3-4 sentences unless user asks for detail

### When to Ask Questions
- If you need more information to proceed
- If the request is ambiguous or incomplete
- If you need access to resources (API keys, env vars)
- If you find a better approach than what was requested

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

---

## Project Context

### Technology Stack
- **Framework**: Next.js 16 with React 19 (App Router)
- **Styling**: Tailwind CSS 4 with cva, clsx, tailwind-merge
- **Database/Auth**: Supabase (PostgreSQL)
- **AI**: Google Gemini (gemini-2.0-flash-exp, gemini-1.5-pro)
- **Rich Text**: TipTap editor
- **PDF**: pdfjs-dist, pdf-lib
- **UI**: Radix UI components
- **Icons**: Lucide React, React Icons
- **Animations**: AOS, Framer Motion

### Code Organization
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   └── [routes]/          # Page routes
├── components/           # React components
│   ├── ui/               # Reusable UI components
│   └── [features]/       # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── types/                # TypeScript types
├── utils/                # Helper utilities
└── locales/              # i18n translations
```

### API Routes Pattern
- RESTful design in `src/app/api/*/route.ts`
- Use GET, POST, PUT, DELETE methods appropriately
- Return JSON responses with proper status codes
- Handle errors with try/catch and return 500 on failure

### Component Patterns
- Use functional components with hooks
- Follow naming: `ComponentName.tsx`
- Colocate types and components when possible
- Use composition over inheritance

---

## Code Style Guide

### TypeScript
```typescript
// Prefer interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions
type Priority = "high" | "medium" | "low";

// Always type function parameters and returns
function createTask(title: string, priority: Priority = "medium"): Task {
  // ...
}
```

### React Components
```typescript
// Use 'use client' for interactive components
"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  onSubmit: (data: Data) => void;
}

export function ComponentName({ className, onSubmit }: Props) {
  const [state, setState] = useState<string>("");

  const handleClick = useCallback(() => {
    // ...
  }, []);

  return (
    <div className={cn("base-classes", className)}>
      {/* content */}
    </div>
  );
}
```

### CSS/Tailwind
- Use utility classes first
- Extract repeated patterns to components
- Use `cn()` from @/lib/utils for conditional classes
- Keep responsive design in mind

### Error Handling
```typescript
try {
  // risky operation
} catch (error: any) {
  console.error("FeatureName: error", error?.message ?? error);
  // return user-friendly error
  return NextResponse.json(
    { error: "Human readable error message" },
    { status: 500 }
  );
}
```

---

## Important Notes

### Database
- This project uses Supabase for authentication and database
- Tables: users, tasks, documents, conversations
- Always use parameterized queries
- Never expose raw SQL to the client

### Caching
- Redis is used for caching (see `src/lib/redis.ts`)
- Cache user sessions, API responses
- Set appropriate TTL

### Security
- Never commit secrets, API keys, or .env files
- Validate all user inputs
- Use proper authentication checks
- Sanitize data before displaying

### Performance
- Use proper loading states
- Implement pagination for lists
- Lazy load heavy components
- Optimize images

---

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
- Update imports if files are moved

---

## Commit Protocol

Only commit when explicitly requested by the user:

### Before Committing
1. Run `git status` to see changes
2. Run `git diff` to see what was modified
3. Run `git log` to see commit message style
4. Review what will be committed

### Commit Message Format
```
type: short description

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

### Examples
```
feat: add task filtering by priority

- Add filter dropdown to task list
- Persist filter in URL params
- Update tests
```

```
fix: resolve task creation error

- Add validation for empty title
- Return proper error message
```

---

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

*Last updated: 2026-04-21*
