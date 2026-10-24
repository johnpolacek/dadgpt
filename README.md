# DADGPT

Ask Dad anything. He answers with a dad joke. Every time.

DADGPT is a voice app. You tap the mic, say something, and Dad replies out loud with one shameless pun. He never gives a real answer, no matter how hard you push.

It was built for a Halloween party, so the jokes lean a little cheeky.

## The costume

DADGPT is a Halloween costume. Wear a black t-shirt and a black baseball hat. Set a phone sideways on the brim, screen out, and open the app. Pin the printable logo to your chest. People walk up, tap the mic, and talk to Dad.

<p align="center">
  <img src="docs/costume.svg" alt="Fig. 1. A pen and ink style drawing of the costume. A phone sits sideways on the brim of a black baseball hat and shows the DADGPT logo. A clip holds it in place. The wearer has on a black t-shirt with the printed logo pinned to the chest." width="480">
</p>

## Printable logo

Print it for a sign, a sticker, or the back of your shirt. The SVG and PDF files are vector, so they print sharp at any size. The PDF fills a landscape letter page.

<p align="center">
  <img src="docs/logo/dadgpt-logo-black-on-white.svg" alt="DADGPT logo, black on white" width="360">
  <img src="docs/logo/dadgpt-logo-white-on-black.svg" alt="DADGPT logo, white on black" width="360">
</p>

| Version | SVG | PDF | PNG |
|---|---|---|---|
| Black on white | [SVG](docs/logo/dadgpt-logo-black-on-white.svg) | [PDF](docs/logo/dadgpt-logo-black-on-white.pdf) | [PNG](docs/logo/dadgpt-logo-black-on-white.png) |
| White on black | [SVG](docs/logo/dadgpt-logo-white-on-black.svg) | [PDF](docs/logo/dadgpt-logo-white-on-black.pdf) | [PNG](docs/logo/dadgpt-logo-white-on-black.png) |

## How it works

1. You tap the mic and talk. The browser turns your speech into text.
2. The text goes to `/api/chat`.
3. A language model writes one dad joke using the prompt in `lib/dad-prompt.ts`.
4. The reply goes to `/api/speak`, which turns it into a dad voice with OpenAI text to speech.
5. The browser plays it. If the voice fails, it falls back to the built in browser voice.

## Two modes

- `/` is canned mode. It tells 20 stock jokes with prerecorded audio. It needs no API keys and anyone can use it.
- `/live` is live mode. It writes a new joke for whatever you say. It needs API keys and can sit behind a passcode.

## Models

- Jokes come from `gpt-6-luna` first. It won a blind party face off in the evals.
- `claude-haiku-5-5` is the backup if OpenAI is down or has no key.
- The voice is `gpt-4o-mini-tts` with the `ash` voice.

## Stack

- Next.js 16 with the App Router
- React 19
- GSAP for all the motion
- Anthropic and OpenAI APIs
- Web Speech API for listening in the browser

## Run it locally

You need Node 24 and pnpm.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

## Environment variables

| Name | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku, the backup joke writer |
| `OPENAI_API_KEY` | Luna jokes and the dad voice. Leave it empty to use the browser voice |
| `PASSCODE` | Locks everything except `/`. Leave it empty to skip the lock |

With no keys at all, canned mode still works.

## Passcode

When `PASSCODE` is set, every page but `/` sends you to `/unlock`. API routes return 401. The gate lives in `proxy.ts`. The cookie stores a SHA-256 hash, never the passcode itself.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm record-jokes` | Record the canned jokes to `public/jokes/`. Rerun after you edit `lib/jokes.ts` |
| `pnpm record-voices` | Record the voice lab samples to `public/voices/` |

Both record scripts need `OPENAI_API_KEY` in `.env.local`.

## Lab pages

These pages were used to pick the look, sound, and motion. They sit behind the passcode.

- `/designs` compares font weights for the logo
- `/motion` tries out text animations
- `/particles` tries out particle effects
- `/voices` plays every voice and style side by side

## Project layout

```
app/
  page.tsx          canned mode
  live/             live mode
  dad-chat.tsx      the chat UI, mic, and audio
  api/chat/         writes the joke
  api/speak/        turns the joke into speech
  api/unlock/       checks the passcode
  unlock/           the passcode page
lib/
  dad-prompt.ts     the system prompt
  joke.ts           model calls for Luna and Haiku
  jokes.ts          the 20 canned jokes
  voice.ts          text to speech
  motion.ts         logo and text animation
  embers.ts         ember effect
  particles.ts      press particles
  passcode.ts       passcode hashing
proxy.ts            the passcode gate
scripts/            audio recording scripts
evals/              prompt and model evals
```

## Evals

The prompt was tuned with evals in `evals/`. They run through the local Claude CLI, so they do not spend API credits.

- `evals/failure-modes.md` lists the ten ways Dad went wrong in the first run.
- `build-queries.mjs` and `build-party-queries.mjs` make synthetic test chats.
- `run.mjs` plays each chat through Dad.
- `checks.mjs` has code checks for length, markdown, quotes, and verbal tics.
- `judges.mjs` has LLM judges for things code cannot check, like whether a reply is really a joke.
- `validate-judges.mjs` measures each judge against hand labels.
- `review/server.mjs` is a small labeling UI at http://localhost:4173.

Run a set of chats and judge them:

```sh
node evals/run.mjs v5
node evals/judge-run.mjs v5
```

Run the code check tests:

```sh
node --test evals/checks.test.mjs
```

## Deploy

It runs on Vercel with no extra config. Add the environment variables in the project settings. Set `PASSCODE` if you add API keys, or anyone can spend your credits on `/live`.

## License

MIT
