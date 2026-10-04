# SCSS Formatting Ruleset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prettier-based SCSS formatting with a single `npm run precommit` script.

**Architecture:** Install Prettier, drop two config files at the project root, add one npm script. No git hooks — the script is run manually before committing.

**Tech Stack:** Prettier, npm scripts, SCSS

---

### Task 1: Install Prettier

**Files:**
- Modify: `package.json` (devDependencies + scripts)

- [ ] **Step 1: Install prettier as a dev dependency**

```bash
npm install --save-dev prettier
```

Expected: `package.json` devDependencies now includes `"prettier": "^<version>"`, `package-lock.json` updated.

- [ ] **Step 2: Verify install**

```bash
npx prettier --version
```

Expected: prints a version string like `3.x.x`

---

### Task 2: Create `.prettierrc`

**Files:**
- Create: `.prettierrc`

- [ ] **Step 1: Create config file**

Create `/Users/marcel/projects/recipes/.prettierrc` with:

```json
{
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

---

### Task 3: Create `.prettierignore`

**Files:**
- Create: `.prettierignore`

- [ ] **Step 1: Create ignore file**

Create `/Users/marcel/projects/recipes/.prettierignore` with:

```
_site
node_modules
```

---

### Task 4: Add `precommit` npm script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the script**

In `package.json`, add to the `"scripts"` block:

```json
"precommit": "prettier --write 'src/**/*.scss'"
```

Final `scripts` block should look like:

```json
"scripts": {
  "build": "eleventy",
  "start": "eleventy --serve",
  "test": "vitest run",
  "test:watch": "vitest",
  "precommit": "prettier --write 'src/**/*.scss'"
}
```

- [ ] **Step 2: Smoke-test the script**

```bash
npm run precommit
```

Expected: Prettier runs over all `src/**/*.scss` files, prints which files were changed (single-line rules expand to multi-line), exits 0.

- [ ] **Step 3: Commit**

```bash
git add .prettierrc .prettierignore package.json package-lock.json
git commit -m "feat: add prettier formatting for SCSS with npm run precommit"
```