# Testing OpenClaw + Atlas Cloud Integration on Railway

- test

This guide walks you through deploying OpenClaw with Atlas Cloud integration on Railway and testing the new model selection feature.

## Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **Atlas Cloud API Key** - Get your key from [atlascloud.ai](https://www.atlascloud.ai)
3. **GitHub Account** - For connecting your repository to Railway

---

## Step 1: Get Your Atlas Cloud API Key

1. Visit [Atlas Cloud](https://www.atlascloud.ai)
2. Sign up or log in
3. Navigate to **Settings** → **API Key Management**
4. Click "Create API Key"
5. Copy the generated API key (save it securely)

---

## Step 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Create a new Railway project**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `openclaw-railway-template-easy-config` repository
   - Click "Deploy Now"

3. **Configure the service**:
   - Railway will detect the Dockerfile automatically
   - Wait for the initial deployment to complete

### Option B: One-Click Deploy (Template)

If this is a public template, you can click:
```
https://railway.app/new/template?template=<your-template-url>
```

---

## Step 3: Configure Railway Variables

After deployment, configure the required environment variables:

1. Go to your project → **Settings** → **Variables**

2. **Add the following variables**:

   | Variable | Value | Required |
   |----------|-------|----------|
   | `SETUP_PASSWORD` | Click 🔒 to generate a secure password | ✅ Yes |
   | `OPENCLAW_GATEWAY_TOKEN` | Click 🔒 to generate a stable token | ✅ Recommended |
   | `OPENCLAW_STATE_DIR` | `/data/.openclaw` | ✅ Yes |
   | `OPENCLAW_WORKSPACE_DIR` | `/data/workspace` | ✅ Yes |

3. **Add a Volume** (for persistent storage):
   - Go to **Settings** → **Volumes**
   - Click "New Volume"
   - Mount path: `/data`
   - Click "Create Volume"
   - Attach the volume to your service

4. **Redeploy** after adding variables and volume:
   - Click "Deploy" button or push a new commit

---

## Step 4: Access the Setup Wizard

1. Wait for the deployment to complete (green status)

2. **Find your Railway URL**:
   - Go to your project
   - Click on your service
   - Find the "Networking" section
   - Copy your Public URL (e.g., `https://your-app.up.railway.app`)

3. **Access the setup wizard**:
   ```
   https://your-app.up.railway.app/setup
   ```

4. **Authenticate**:
   - Username: leave empty
   - Password: the `SETUP_PASSWORD` you configured

---

## Step 5: Configure Atlas Cloud

### Using the Setup Wizard

1. **Step 1: Welcome**
   - Click "Get Started"

2. **Step 2: Configure Authentication**
   - **Provider Group**: Select "Atlas Cloud - API key"
   - **Auth Method**: Select "Atlas Cloud API key"
   - **API Key**: Paste your Atlas Cloud API key
   - **Wizard Flow**: Select "Quickstart" (or your preference)

3. **Select Your Model** (NEW Feature)
   - Below the Flow selector, you'll see **"Atlas Cloud Model"**
   - Choose from available models:
     - **MiniMax M2.1 (default)** - Lightweight, fast, cost-effective
     - **DeepSeek R1** - Reasoning-optimized with chain-of-thought
     - **Z.AI GLM-4.7** - Chinese-optimized LLM
     - **KwaiKAT Coder Pro** - 256K context for large files
     - **Moonshot V1 128K** - Long-context model
     - **Zhipu GLM-4 5B Plus** - Efficient 5B model
     - **Qwen 2.5 Coder 32B** - Code-specialized

   - The model info panel shows:
     - Context window size
     - Input/output pricing per million tokens

4. **Step 3: Channels** (Optional)
   - Skip or configure Telegram/Discord/Slack
   - Click "Next"

5. **Step 4: Review**
   - Verify your settings
   - Check the Atlas Cloud model selected
   - Check the confirmation box
   - Click "Run Setup"

6. **Step 5: Complete**
   - Wait for onboarding to complete
   - Click "Open OpenClaw UI"

---

## Step 6: Test the Integration

### Test 1: OpenClaw Control UI

1. Access the OpenClaw UI:
   ```
   https://your-app.up.railway.app/openclaw
   ```

2. You should see the OpenClaw interface with:
   - Your workspace
   - Chat interface
   - Model information

3. **Send a test message**:
   ```
   Hello! Can you explain what Atlas Cloud models are available?
   ```

4. Verify the response comes from Atlas Cloud (check model info)

### Test 2: API Test (cURL)

Test the gateway directly:

```bash
# Get your gateway URL and token from Railway variables
GATEWAY_URL="https://your-app.up.railway.app"
GATEWAY_TOKEN="your-gateway-token"

# Test a simple chat completion
curl -X POST "${GATEWAY_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${GATEWAY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimaxai/minimax-m2.1",
    "messages": [
      {"role": "user", "content": "Say hello from Atlas Cloud!"}
    ]
  }'
```

### Test 3: Model Switching Test

1. Go back to setup: `/setup`
2. Click "Reset" (this clears configuration)
3. Run setup again with a **different Atlas Cloud model**
4. Test the new model

### Test 4: Check Configuration

Verify the configuration via the debug endpoint:

```bash
curl -u :your-setup-password \
  "https://your-app.up.railway.app/setup/api/debug" | jq .
```

Look for:
```json
{
  "wrapper": {
    "stateDir": "/data/.openclaw",
    "gatewayTokenFromEnv": true
  }
}
```

---

## Step 7: Monitor Railway Logs

1. Go to your Railway project
2. Click on your service
3. View real-time logs to see:
   - Gateway startup messages
   - Atlas Cloud API calls
   - Any errors

**Key log entries to look for:**
```
[gateway] starting with command: ...
[gateway] ready at http://127.0.0.1:18789
[atlas] configured Atlas Cloud with OpenAI-compatible endpoint (model: minimai/minimax-m2.1)
```

---

## Troubleshooting

### Issue: "Cannot find module '/openclaw/dist/entry.js'"

**Solution**: This is expected during the first build. OpenClaw is being built from source in the Docker container. Wait for the build to complete.

### Issue: Setup wizard shows "Error" during onboarding

**Solutions**:
1. Check Railway logs for specific error messages
2. Verify `SETUP_PASSWORD` is set correctly
3. Ensure the Volume is mounted at `/data`
4. Check Atlas Cloud API key is valid

### Issue: "token_missing" or "token_mismatch" errors

**Solutions**:
1. Ensure `OPENCLAW_GATEWAY_TOKEN` is set in Railway Variables
2. Restart the service after setting the token
3. Check the gateway token is synced correctly

### Issue: Model not responding

**Solutions**:
1. Verify your Atlas Cloud API key has credits
2. Check the model ID is correct (e.g., `minimaxai/minimax-m2.1`)
3. Test the API key directly with Atlas Cloud:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
     https://api.atlascloud.ai/v1/models
   ```

### Issue: Changing model after setup

**Solution**: Currently, you need to reset and re-run setup:
1. Visit `/setup`
2. Click "Reset Configuration"
3. Run setup again with the new model

---

## Atlas Cloud Model Reference

| Model ID | Best For | Context | Input | Output |
|----------|----------|---------|-------|--------|
| `minimaxai/minimax-m2.1` | General coding, fast response | 197K | $0.30/M | $1.20/M |
| `deepseek-ai/deepseek-r1` | Reasoning, complex logic | 164K | $0.28/M | $0.40/M |
| `zai-org/glm-4.7` | Chinese language, general | 203K | $0.52/M | $1.95/M |
| `kwai-kat/kat-coder-pro` | Large codebases, long context | 256K | $0.30/M | $1.20/M |
| `moonshot-ai/moonshot-v1-128k` | Long documents, analysis | 262K | $0.60/M | $2.50/M |
| `zhipu-ai/glm-4-5b-plus` | Cost-effective, efficiency | 203K | $0.44/M | $1.74/M |
| `qwen/qwen-2.5-coder-32b-instruct` | Code specialization | 262K | $0.69/M | $2.70/M |

---

## Quick Reference

### Useful URLs

- **Setup Wizard**: `https://your-app.up.railway.app/setup`
- **OpenClaw UI**: `https://your-app.up.railway.app/openclaw`
- **Health Check**: `https://your-app.up.railway.app/setup/healthz`
- **API Status**: `https://your-app.up.railway.app/setup/api/status`

### Key Commands

```bash
# Check health
curl https://your-app.up.railway.app/setup/healthz

# Get status (requires auth)
curl -u :password https://your-app.up.railway.app/setup/api/status

# Export backup
curl -u :password https://your-app.up.railway.app/setup/export -o backup.tar.gz

# Reset configuration (requires auth)
curl -X POST -u :password https://your-app.up.railway.app/setup/api/reset
```

---

## Next Steps

1. **Configure messaging channels** - Add Telegram, Discord, or Slack for AI chat access
2. **Set up monitoring** - Enable Railway logging and alerts
3. **Customize models** - Try different Atlas Cloud models for your use case
4. **Configure workspace** - Add your projects for AI-assisted coding

---

## Support

- **OpenClaw Documentation**: [docs.openclaw.ai](https://docs.openclaw.ai)
- **Atlas Cloud Documentation**: [atlascloud.ai/docs](https://www.atlascloud.ai/docs)
- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **GitHub Issues**: [github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
