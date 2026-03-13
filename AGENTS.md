# AGENTS.md - Project Instruction Manual for WebApp - Control

Welcome, Agent. This project is a premium **"Mission Control"** interface built with **React 19, Vite, Express, and Supabase**. As an agent working here, you must follow the standards of an **ELITE SENIOR SOFTWARE ARCHITECT**.

## 🏗️ Core Architecture & Tech Stack
- **Frontend**: React 19 (Strict Mode), Vite, Wouter (Routing).
- **Styling**: Vanilla CSS + Tailwind CSS (v4). Radix UI for primitive components.
- **Backend**: Express.js (ESM), Drizzle ORM, PostgreSQL (via Supabase/Neon).
- **Validation**: Zod (Every input must be sanitized and validated).

---

## 🧠 Specialized Skills & Activation Rules
We have a suite of global skills installed from Vercel Labs. You MUST activate them based on the context of the user request:

### 1. React Excellence (`react-best-practices`)
- **When to activate**: ANY task involving creating, refactoring, or reviewing React components.
- **Key Rules**:
    - Eliminate data waterfalls using `Promise.all()`.
    - Minimize client-side data fetching; leverage Server Components/Actions where possible.
    - Optimize re-renders by hoisting state and using functional `setState`.
- **How to use**: Consult `global_skills/react-best-practices/SKILL.md` before generating code.

### 2. Premium UI/UX (`web-design-guidelines`)
- **When to activate**: When the user asks to "Review UI", "Check accessibility", or "Improve aesthetics".
- **Key Rules**:
    - Pixel-perfect consistency in spacing and typography.
    - High-contrast accessibility and proper ARIA labels.
    - Professional color palettes (HSL) and smooth micro-animations.
- **How to use**: Audit code using the rules defined in `global_skills/web-design-guidelines/SKILL.md`.

### 3. Scalable Patterns (`composition-patterns`)
- **When to activate**: When building complex, reusable components or refactoring large files.
- **Key Rules**:
    - **Avoid Boolean Props**: Use compound components instead of adding more flags.
    - **React 19 Style**: Use the `use()` hook instead of `useContext()` and avoid `forwardRef` (use props).
- **How to use**: Apply structural patterns from `global_skills/composition-patterns/SKILL.md`.

---

### 🏛️ Architect's "Golden Rules"
- **Spec-First**: Always plan the logic (Trigger -> Context -> Action -> Verification) before coding.
- **No Placeholders**: Never use placeholder images or text. Use the `generate_image` tool for visual assets.
- **O(n) Efficiency**: Warn the user if a solution reaches O(n²) complexity and propose alternatives.
- **Security First**: Sanitize all inputs and verify RLS (Row Level Security) on every database query.

---

### 🛠️ Common Commands
- **Dev**: `npm run dev` (Starts backend + vite)
- **Database**: `npm run db:push` (Sync schema)
- **Audit**: `npm run predeploy:audit` (Security check)

*Note: This file is for AI Agents. If you are a human, please refer to README.md.*
