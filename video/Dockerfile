FROM mcr.microsoft.com/playwright:v1.55.1-noble
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg fonts-dejavu-core python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/voice-venv && \
    /opt/voice-venv/bin/pip install --no-cache-dir piper-tts==1.8.0 'qrcode[pil]==8.2'
ENV PATH="/opt/voice-venv/bin:${PATH}"
WORKDIR /video
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY avatar ./avatar
RUN npx esbuild avatar/main.js --bundle --format=iife --platform=browser --outfile=avatar/bundle.js
COPY scripts ./scripts
CMD ["node", "scripts/make-video.mjs"]
