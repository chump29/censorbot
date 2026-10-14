#!/usr/bin/env -S docker image build . --tag censorbot --file

FROM oven/bun:alpine AS build

WORKDIR /app

COPY .husky/prepare.min.mjs ./.husky/
COPY patches/ ./patches/
COPY package.json bun.lock ./

ENV BUN_INSTALL_CACHE_DIR=/.bun-cache

RUN --mount=type=cache,target=/.bun-cache \
  bun ci --production

# -=-

FROM oven/bun:alpine

# hadolint ignore=DL3018
RUN apk add --no-cache \
  tzdata

WORKDIR /app

LABEL org.opencontainers.image.authors="Chris Post <admin@postfmly.com>" \
  org.opencontainers.image.description="CensorBot for Discord" \
  org.opencontainers.image.licenses="GPL-3.0-only" \
  org.opencontainers.image.title="CensorBot" \
  org.opencontainers.image.url="https://github.com/chump29/censorbot"

ENV TZ=Etc/GMT

COPY --from=build /app/node_modules ./node_modules
COPY . .

HEALTHCHECK --interval=60s CMD source healthcheck.sh

EXPOSE 8011

ENTRYPOINT ["bun", "run", "prod"]
