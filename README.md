# Openclaw Railway Template (1‑click deploy)

This repo packages **Openclaw** for Railway with a small **/setup** web wizard so users can deploy and onboard **without running any commands**.

## What you get

- **Openclaw Gateway + Control UI** (served at `/` and `/openclaw`)
- A friendly **Setup Wizard** at `/setup` (protected by a password)
- Persistent state via **Railway Volume** (so config/credentials/memory survive redeploys)
- One-click **Export backup** (so users can migrate off Railway later)

## How it works (high level)

- The container runs a wrapper web server.
- The wrapper protects `/setup` with `SETUP_PASSWORD`.
- During setup, the wrapper runs `openclaw onboard --non-interactive ...` inside the container, writes state to the volume, and then starts the gateway.
- After setup, **`/` is Openclaw**. The wrapper reverse-proxies all traffic (including WebSockets) to the local gateway process.

## Railway deploy instructions

Create a new template in Railway with these steps:

1. **Create a new template** from this GitHub repo
2. **Add a Volume** mounted at `/data`
3. **Set one environment variable**:
   - `SETUP_PASSWORD` — Your password to access the setup wizard and authenticate with the gateway
4. **Enable Public Networking** (HTTP) — Railway will assign a domain like `https://your-app.up.railway.app`
5. **Deploy**

That's it! Just one variable to set.

## Getting started

After deployment:

1. Visit `https://<your-app>.up.railway.app/setup`
2. Login with your `SETUP_PASSWORD`
3. Select your AI provider and enter your API key
4. Optionally configure messaging channels (Telegram, Discord, Slack)
5. Click "Run Setup" and you're done!

The setup wizard supports these AI providers:
- **Anthropic** (Claude) - Recommended
- **OpenAI** (GPT models)
- **Google** (Gemini)
- **OpenRouter**
- **Atlas Cloud**
- **Vercel AI Gateway**
- **Moonshot AI**
- **Z.AI (GLM 4.7)**
- **MiniMax**
- **Qwen**
- **Synthetic**
- **OpenCode Zen**

## Getting chat tokens (so you don’t have to scramble)

### Telegram bot token

1. Open Telegram and message **@BotFather**
2. Run `/newbot` and follow the prompts
3. BotFather will give you a token that looks like: `123456789:AA...`
4. Paste that token into `/setup`

### Discord bot token

1. Go to the Discord Developer Portal: https://discord.com/developers/applications
2. **New Application** → pick a name
3. Open the **Bot** tab → **Add Bot**
4. Copy the **Bot Token** and paste it into `/setup`
5. Invite the bot to your server (OAuth2 URL Generator → scopes: `bot`, `applications.commands`; then choose permissions)

## Local testing

```bash
# Build the container
docker build -t openclaw-railway-template .

# Run locally (only need SETUP_PASSWORD!)
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SETUP_PASSWORD=test \
  -v $(pwd)/.tmpdata:/data \
  openclaw-railway-template

# Open http://localhost:8080/setup
# Password: test
```
