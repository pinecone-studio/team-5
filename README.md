# Team 5 Repo

## Local Setup

1. Bootstrap env files:
```bash
npm run setup:local
```

2. Fill real values in:
```txt
service/.env
web/.env
```

3. Install dependencies:
```bash
npm install
cd service && npm install
cd ../web && npm install
```

4. Start local services:
```bash
npm run service:dev
npm run web:dev
```

5. Validate setup:
```bash
npm run doctor
```

## Required Env

`service/.env`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `FRONTEND_ORIGIN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_API_TOKEN`

`web/.env`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GRAPHQL_URL`
- `NEXT_PUBLIC_BASE_URL`

## Common Employee Portal Issues

If `My Benefits` does not load:
- make sure `service` is running on `http://localhost:8787`
- make sure `web` is running on `http://localhost:3000`
- make sure the user is signed in with Clerk
- make sure the signed-in Clerk email matches `benefit_employee.email`

If `Activity Log` does not load:
- make sure the signed-in user has `admin`, `hr`, or `finance_manager` reviewer access as required by the page
