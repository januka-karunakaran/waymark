# Waymark Engineering & Contribution Guide

Welcome to the **Waymark 2100** project! This document outlines development standards, Git workflows, PR review rules, and security guidelines for both web and mobile engineering teams.

---

## 1. Branching Strategy

The repository follows Git Flow principles:

* `main`: Production-ready code only. Never commit or push directly to `main`.
* `develop`: Integration branch for active feature development. Never commit directly to `develop`.
* `feature/<owner>-<feature-name>`: Dedicated feature branches branched off the latest `develop`.
  * Example: `feature/sathu-mobile-foundation`
  * Example: `feature/janu-design-system`

---

## 2. Commit Standards & Mandatory Co-Author Trailer

* Use clear, imperative commit messages following Conventional Commits format:
  * `feat: ...`
  * `fix: ...`
  * `docs: ...`
  * `chore: ...`
  * `test: ...`

### Non-Negotiable Co-Author Trailer
For every commit created by Sathu or Janu, add the corresponding collaborator's co-author trailer to the Git commit body:

```text
feat: implement reusable mobile foundation

Co-authored-by: januka-karunakaran <karunakaranj.23@uom.lk>
```

---

## 3. Pull Request (PR) Policy

1. **Target Branch:** All feature PRs must target `develop`.
2. **Never Merge Your Own PR:** Every pull request requires review and approval from your collaborator (Sathu or Janu) before merging.
3. **CI Status:** The GitHub Actions workflow (`.github/workflows/mobile-ci.yml`) must pass completely before merging:
   * TypeScript typecheck
   * ESLint validation
   * Unit test suite execution
   * Expo configuration validation
4. **No Direct Pushes:** Pushes directly to `main` or `develop` are strictly prohibited.

---

## 4. Local Development Environment

### Prerequisites:
* Node.js v18+ (tested on v20 and v24)
* npm v9+

### Mobile App Setup:
```bash
# 1. Navigate to mobile workspace
cd mobile

# 2. Install dependencies cleanly
npm install

# 3. Copy environment configuration
cp .env.example .env.development

# 4. Start Expo development server
npm run start

# Run on Android emulator (requires Android Studio / SDK)
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web preview
npm run web
```

### Running Tests & Quality Checks:
```bash
cd mobile

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Run Jest unit test suite
npm run test

# Run tests with coverage
npm run test:coverage
```

### Web App Setup (Preserved):
```bash
# From repository root
npm install
npm run dev      # Launch Vite dev server
npm run build    # Build production website bundle
```

---

## 5. Security & Privacy Rules

1. **Never Commit Secrets:**
   * Do not commit `.env`, `.env.local`, API keys, certificates, or keystores.
   * Template files (`.env.example`) must contain only sanitized mock placeholders.
2. **Safe Logging:**
   * Always use `src/utils/logger.ts` for logging. Never use raw `console.log` with user tokens, passwords, or PII.
3. **Secure Storage:**
   * Store session tokens and user credentials strictly using `src/services/storage/secureStorage.ts` (backed by iOS Keychain / Android Keystore).
4. **Least Privilege Permissions:**
   * Do not declare unused permissions in `app.json`.
