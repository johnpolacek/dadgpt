/** What a visitor pastes into their own coding agent to stand up a DADGPT. Kept in sync with the README. */
export const MAKE_YOUR_OWN_PROMPT = `Set up my own copy of DADGPT, the dad joke costume app at https://github.com/johnpolacek/dadgpt. Read the README first.

1. Clone it and install with pnpm. It needs Node 24.
2. Copy .env.example to .env.local. Ask me for my Anthropic API key and a passcode to lock live mode. An OpenAI key is optional and gives Dad a better voice.
3. Run pnpm dev. Open /live and confirm Dad answers out loud with a joke.
4. Deploy it to Vercel with the same environment variables, then give me the URL.`;
