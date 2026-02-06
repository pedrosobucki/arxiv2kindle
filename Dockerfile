FROM node:25.6.0-alpine

RUN apk add --no-cache chromium

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ENV CHROME_PATH=/usr/bin/chromium-browser

CMD ["npx", "ts-node", "epub.ts"]
