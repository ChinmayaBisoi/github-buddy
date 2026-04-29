# Engineering priorities and code principles

Every change to GitHub Buddy should be judged in this order. **Do not trade higher-priority goals for convenience.**

## 1. Security (highest)

- **Least privilege:** Request only manifest permissions and host access that the feature needs. Prefer narrow `matches` and avoid broad `*://*/*` patterns.
- **Trust boundary:** Treat all page-derived strings (titles, URLs, DOM text) as untrusted. Escape or encode appropriately before inserting into HTML (`text/html` clipboard, attributes, `innerHTML`). Keep escape logic centralized and tested (`src/utils.ts`).
- **No dynamic code execution:** Do not use `eval`, `new Function`, or string-based script injection.
- **Clipboard:** Rich clipboard is user-initiated only. Do not read clipboard unless there is a clear, scoped use and permission story.
- **Dependencies:** Prefer audited, minimal dependencies. Pin versions and review supply-chain risk for anything that ships in the extension bundle.

## 2. Robustness

- **Defensive DOM:** GitHub markup changes. Prefer stable selectors where possible; guard every query; avoid assuming nodes exist. Duplicate injection must be impossible (attributes like `data-github-buddy-*`, idempotent helpers).
- **Observers:** Subtree observers must never react to mutations they cause (for example updating a control that lives inside the observed tree). Prefer change detection (counts, hashes) or scoped observation before mutating.
- **Pure logic in tests:** Path checks, clipboard string builders, and HTML escaping live in testable modules with no hidden globals or DOM side effects.
- **Fail closed:** On error, prefer no-op or safe fallback (for example plain-text clipboard only) over partial or corrupt output.

## 3. Resilience

- **API fallbacks:** When `navigator.clipboard.write` is unavailable or throws, fall back to `writeText` with the plain payload.
- **Performance under churn:** Debounce expensive list reconciliation. Scope `MutationObserver` to the smallest container that still catches real navigations (for example PJAX).
- **UX feedback:** Surface copy failures in devtools; user-facing toasts for empty selection or success where it helps, without blocking the main thread indefinitely.

## 4. SOLID and maintainable structure

Apply these **after** security, robustness, and resilience are satisfied.

- **Single responsibility:** `utils.ts` holds pure helpers and formatting. `content_script.tsx` orchestrates injection and browser APIs. `domHelpers.ts` owns header discovery. Avoid smuggling business rules into React UI shells.
- **Open/closed:** Extend behavior via small, composable functions (new formatters, new matchers) rather than sprawling conditionals inside one giant entrypoint.
- **Liskov / contracts:** Keep function inputs and outputs predictable (explicit types, no `any`). Document edge cases (empty title, duplicate URLs) in tests.
- **Interface segregation:** Keep hooks and components minimal. The detail-page `CopyButton` should not depend on list-page concerns.
- **Dependency inversion:** High-level flow depends on pure utilities and small DOM helpers, not on GitHub’s internal class names as the sole abstraction.

## 5. General craft

- Match existing patterns (vanilla list UI vs React only where justified).
- Prefer small, reviewable diffs. Do not “clean up” unrelated code in the same change.
- Add or update tests when behavior or edge cases change.

For product behavior and clipboard examples, see [FUNCTIONALITY.md](FUNCTIONALITY.md).
