# ChouChallenge — production image for Render (Docker web service).
# Runs server.ts: Next.js + Socket.IO in one long-lived Node process.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY server.ts ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "start"]
