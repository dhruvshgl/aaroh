# Aaroh

AI career consultant. Next.js, Tailwind, shadcn/ui, PostgreSQL, and server-side OpenAI.

## Local setup

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
2. Start Postgres: `docker compose up -d`
3. Apply the schema: `npx prisma migrate dev`
4. Optional demo profile: `npx prisma db seed`
   - Email: `demo@aaroh.local`
   - Password: `AarohDemo123!`
5. `npm run dev`

## Environment

`DATABASE_URL` points at Postgres.

`AUTH_SECRET` and `AUTH_URL` configure Auth.js. Email and password always work. Google, LinkedIn, and Apple buttons appear only when their `AUTH_*_ID` and `AUTH_*_SECRET` values are set.

`OPENAI_API_KEY` stays on the server. Do not prefix it with `NEXT_PUBLIC_`.

`AI_MODEL` defaults to `gpt-5-mini` for career analysis. `AI_MODEL_CHAT` defaults to `gpt-5-nano` for the consultant. Analysis uses low reasoning effort. Chat uses minimal reasoning effort.

`ANALYSIS_DAILY_LIMIT` and `CHAT_HOURLY_LIMIT` cap spend per user.

Resumes are stored on local disk under `storage/`.

The alignment percentage is calculated in application code from skill depth, experience, goal clarity, evidence, and gap severity. The model explains it. It does not invent the number.
