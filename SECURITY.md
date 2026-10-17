# Security policy

Please report vulnerabilities privately through GitHub's
**Report a vulnerability** button on the repository's *Security* tab. Do not
open a public issue.

Useful details: the address and version shown on the page, the browser, and
the steps to reproduce.

## Scope

- The site and its headers (`vercel.json`).
- The recovery-code function (`api/save.js`, `lib/save-codes.js`).
- Saved-game import and export (`dist/saves.js`), and moving progress
  between addresses (`dist/app.js`).

A recovery code is a bearer secret: anyone who has it can read and replace
that save. Reports about guessing codes by brute force are welcome only with a practical attack.
