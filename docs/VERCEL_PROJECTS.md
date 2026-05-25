# Vercel Projects

This repository uses two separate Vercel projects so staging and production runtime environments cannot point at the
same backing services by accident.

## Projects

| Environment | Vercel project | Project ID | Intended branch |
| --- | --- | --- | --- |
| Staging | `church-app-staging` | `prj_QmkbvN4YQB5NVcffQdEvfbPKyBF9` | `develop` |
| Production | `church-app` | `prj_Vy1ldf01BUXeJbjU7HD1Pm1gCFy8` | `main` |

## Link State

The local `.vercel/project.json` currently points at the production project:

```json
{"projectId":"prj_Vy1ldf01BUXeJbjU7HD1Pm1gCFy8","orgId":"team_dVoQsbD2Jzt8ulHNTH124nQm","projectName":"church-app"}
```

## Git Connection Status

Both projects were created with the Vercel CLI and confirmed with `npx vercel project inspect`.

The CLI could not connect the GitHub repository automatically because the Vercel account does not currently have a
GitHub login connection:

```text
Failed to link bussywales/church-app. You need to add a Login Connection to your GitHub account first.
```

After adding the GitHub login connection in Vercel, connect `https://github.com/bussywales/church-app` to both projects
and set the production branch per project:

- `church-app-staging`: `develop`
- `church-app`: `main`
