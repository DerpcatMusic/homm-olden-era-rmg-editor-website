# Continuous integration

## What runs

One Ubuntu 24.04 job checks every pull request and pushes to `master`.
A manual run is available after the workflow reaches the default branch.
Newer commits cancel obsolete runs for the same PR/ref. There are no path filters,
so documentation-only changes still produce a check result.

Uses pnpm because the existing development/test scripts invoke it and pnpm-lock.yaml is committed. build:web compiles TypeScript once and copies the web assets. A Jest command exists but no Jest tests are checked in; the JSON fixtures under data/DB/test are not executable tests. CI does not pretend that running an empty suite provides coverage.

Run the same commands locally:

```sh
pnpm install --frozen-lockfile
pnpm run build:web
```

## Reproducibility and safety

- CI uses Node.js 24.19.0 and pnpm 9.15.9. This is separate from the Node 24 runtime used internally by the pinned GitHub actions.
- Dependencies are installed from the committed lockfile. Package-download caches are keyed by that lockfile; a cache hit never skips installation or checks. Build output and credentials are not cached.
- Action revisions and the Ubuntu image are pinned. Updating them is a reviewed maintenance change, not an automatic application dependency upgrade.
- The job has read-only repository access, does not retain checkout credentials and receives no deployment secrets.
- Each validation step runs after a successful install even if a previous validation step failed. Any failed step keeps the job red; there are no retries or continue-on-error overrides.
- No publishing, deployment, database migration or repository-protection change is performed.

## Understanding the result

A build verifies that the selected source can be compiled/bundled. Static checks
find type/lint problems. Unit tests check only the cases actually present in the
repository. None of these alone proves production behavior, accessibility or
visual correctness. Failures in existing application code should be investigated,
not hidden by weakening CI.

## Learn more

- [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub workflow security](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub dependency caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
