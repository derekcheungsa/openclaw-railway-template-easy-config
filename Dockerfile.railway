# Pull pre-built openclaw image instead of building from source.
ARG OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:latest
FROM ${OPENCLAW_IMAGE} AS openclaw-source


# Runtime image
FROM node:22-bookworm
ENV NODE_ENV=production

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    build-essential \
    gcc \
    g++ \
    make \
    procps \
    file \
    git \
    python3 \
    python3-venv \
    python3-pip \
    pkg-config \
    sudo \
  && rm -rf /var/lib/apt/lists/*

# Install Homebrew (must run as non-root user)
# Create a user for Homebrew installation, install it, then make it accessible to all users
# Cache-bust: v2
RUN useradd -m -s /bin/bash linuxbrew \
  && echo 'linuxbrew ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER linuxbrew
RUN NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install gog CLI for Google Workspace skill (Gmail, Calendar, Drive, etc.)
# Must run as linuxbrew user before chown to root
RUN /home/linuxbrew/.linuxbrew/bin/brew install steipete/tap/gogcli

USER root
RUN chown -R root:root /home/linuxbrew/.linuxbrew
ENV PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:${PATH}"

WORKDIR /app

# Wrapper deps
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Install Python PDF libraries for pdf skill using virtual environment approach
# Create a virtual environment to respect PEP 668 (externally managed Python)
RUN python3 -m venv /opt/pdf-venv

# Install PDF libraries in the virtual environment
RUN /opt/pdf-venv/bin/pip install --no-cache-dir pypdf pdfplumber reportlab && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    poppler-utils && \
    rm -rf /var/lib/apt/lists/*

# Add venv binaries to PATH for skill usage
ENV PATH="/opt/pdf-venv/bin:${PATH}"

# Install Chromium for Puppeteer (patient-health-portal-helper skill)
# Use specific version to ensure compatibility
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    && rm -rf /var/lib/apt/lists/* \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Copy all skills first (for dependency installation)
COPY skills /tmp/skills

# Install patient-health-portal-helper skill dependencies
# Note: package.json is in the lib/ subdirectory (ES modules structure)
WORKDIR /tmp/skills/patient-health-portal-helper/lib
RUN npm install && npm cache clean --force

# Return to app directory
WORKDIR /app

# Copy pre-built openclaw
COPY --from=openclaw-source /app /openclaw

# Provide a openclaw executable
RUN printf '%s\n' '#!/usr/bin/env bash' 'exec node /openclaw/openclaw.mjs "$@"' > /usr/local/bin/openclaw \
  && chmod +x /usr/local/bin/openclaw

COPY src ./src

# Copy ClawHub skills (with installed dependencies)
RUN mkdir -p /data/.openclaw && cp -r /tmp/skills /data/.openclaw/skills && rm -rf /tmp/skills

ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]
