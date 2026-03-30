############################
# ======== Builder ========
############################

FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY . .

ARG VITE_APP_NAME="Raad LMS"
ARG VITE_APP_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_URL=$VITE_APP_URL

RUN bun run build

############################
# ======== Runner =========
############################

FROM nginx:stable-alpine AS runner

RUN apk add --no-cache curl \
    && rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost/ >/dev/null || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
