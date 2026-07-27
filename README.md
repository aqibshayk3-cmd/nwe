# Darkroom — free multi-modal AI bot

A Next.js app with five tabs, powered by free, no-key public APIs — no
signup, no server cost.

- **Image** — text-to-image via Pollinations.ai, pick between `flux` and `turbo`
- **Style Transfer** — upload your own photo, describe a new style, get it restyled
- **Video** — free text-to-video via a public Hugging Face Space (not Pollinations)
- **Chat** — talk to a model (GPT/Mistral variants via Pollinations' text endpoint)
- **Audio** — text-to-speech with 6 voice options

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Put it on GitHub

```bash
git init
git add .
git commit -m "darkroom multi-modal bot"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy to Vercel (free)

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New → Project**, pick the repo you just pushed.
3. Leave defaults (Vercel auto-detects Next.js), click **Deploy**.
4. Live in about a minute at `your-project.vercel.app`.

No environment variables needed anywhere in this app.

## How each tab works

### Image (`app/components/ImageTab.js`)
Builds a URL like `https://image.pollinations.ai/prompt/<prompt>?model=flux&seed=...`
and loads it directly in an `<img>` tag. No server code.

### Style Transfer (`app/components/StyleTab.js`)
Pollinations' image-to-image model (`kontext`) needs your input photo to already
have a public URL — their server fetches it, it can't accept a raw upload directly.
So this tab:
1. Resizes/compresses your photo client-side (keeps it fast to upload)
2. Uploads it anonymously to **catbox.moe** (free, no signup, gives back a public link)
3. Calls Pollinations' `kontext` model with that link + your style prompt

**Heads up:** your photo becomes a public (if obscure) URL on catbox.moe for this
to work. Don't upload anything you need to keep private.

### Video (`app/components/VideoTab.js`)
Pollinations only offers video generation on its paid "Pollen" credit tier —
not free/anonymous like its other endpoints. So instead, this tab calls a
**free, public Hugging Face Space** running the open-source Wan2.1 video
model, using Gradio's official JS client (`@gradio/client`).

```js
import { Client } from "@gradio/client";
const app = await Client.connect("multimodalart/wan2-1-fast");
```

This is genuinely free and needs no API key. The tradeoff: it's shared,
volunteer-run infrastructure, so:
- Generation can take a minute or two (sometimes longer if the Space is busy)
- It can fail if the Space is asleep, overloaded, or temporarily down —
  the tab shows a retry-friendly error if that happens
- The exact Space could change its internals over time since it's not
  something Anthropic or Pollinations controls or guarantees

The code introspects the Space's API at call time (`app.view_api()`) rather
than hardcoding parameter names, so small changes on their end are less
likely to break it outright. If it stops working entirely, swap
`VIDEO_SPACE_ID` in `app/lib/pollinations.js` for another public text-to-video
Space — browse https://huggingface.co/spaces?category=text-to-video for
current options.

### Chat (`app/components/ChatTab.js`)
POSTs a message array to `https://text.pollinations.ai/openai`, OpenAI-compatible
format. Keeps conversation history client-side only (refreshing clears it).

### Audio (`app/components/AudioTab.js`)
Builds a URL like `https://text.pollinations.ai/<text>?model=openai-audio&voice=nova`
and plays it with a native `<audio>` element.

## Shared logic

All the URL-building and fetch calls for Pollinations live in
`app/lib/pollinations.js` — if you want to add a model, a voice, or a new
endpoint, that's the one file to touch. The video call lives in the same
file, in `generateVideo()`.

## Things you might want to add next

- **Persistence** — everything (chat history, generated images/audio/video)
  lives only in memory right now and disappears on refresh. Adding a
  database is a natural next step if you want history saved.
- **Rate-limit handling** — Pollinations' anonymous tier allows roughly one
  request every 15 seconds; heavy use may hit that limit. Registering a free
  Pollinations account raises it.
- **A more reliable video backend** — if the free Hugging Face Space proves
  too flaky for your needs, the next step up is Pollinations' own paid video
  tier (Pollen credits) or a dedicated GPU host — both need billing set up.

## A note on content

Pollinations, and the Hugging Face Space used for video, apply their own
content moderation upstream on these public endpoints, and this app doesn't
attempt to bypass or override that — that's not something I'll help build
into this or any other image/video/chat API integration.
