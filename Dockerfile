# See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker for the base
# Also see https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile

##########################
FROM node:24.22.2-trixie-slim@sha256:54f84b4cf8432b21aaffd5d3ce8d41e12cea0d10d33c09d2f3c9879d49d6b446 AS base

WORKDIR /app
ENV NODE_ENV=production

############################################################################################################
# Stage: prepare a base image with all native utils pre-installed, used both by builder and definitive image

FROM base AS nativedeps

ARG TARGETARCH
RUN echo "Building for architecture $TARGETARCH"

# Install chromium-headless-shell (Debian's build of the "old" headless Chromium, amd64 and arm64,
# security updates with the rest of the distribution) and fonts to support major charsets
# (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y chromium-headless-shell gifsicle wget ca-certificates fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst-one fonts-freefont-ttf dbus dbus-x11 --no-install-recommends && \
    service dbus start

ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:

# It's a good idea to use dumb-init to help prevent zombie chrome processes.
# releases since 1.2.3 name the binaries by uname -m, not by docker's TARGETARCH
RUN case "$TARGETARCH" in \
      amd64) DUMB_INIT_ARCH=x86_64 ;; \
      arm64) DUMB_INIT_ARCH=aarch64 ;; \
      *) echo "unsupported architecture $TARGETARCH" && exit 1 ;; \
    esac && \
    wget -q -O /usr/local/bin/dumb-init "https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_$DUMB_INIT_ARCH" && \
    chmod +x /usr/local/bin/dumb-init

# cleanup: wget was only needed to download dumb-init
RUN apt-get purge -y --auto-remove wget && \
    test -x /usr/lib/chromium/chromium-headless-shell && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# skip the browser download when installing puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true

######################################
# Stage: nodejs dependencies and build
FROM nativedeps AS builder

ADD package.json .
ADD package-lock.json .

# use clean-modules on the same line as npm ci to be lighter in the cache
RUN npm i -g clean-modules@2.0.6
RUN npm ci --omit=dev &&\
    clean-modules --yes --exclude "**/*.mustache"

##################################
# Stage: main nodejs service stage
FROM nativedeps
LABEL org.opencontainers.image.vendor="Koumoul"
LABEL org.opencontainers.image.authors="contact@koumoul.com"
LABEL org.opencontainers.image.licenses="AGPL-3.0-only"

# npm and corepack are only needed by the builder stage, and they carry their own
# vulnerabilities; the service runs with plain node.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && mkdir -p /app \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

# The nodejs service
COPY --from=builder /app/node_modules /app/node_modules
ADD api api
ADD config config
ADD contract contract
ADD package.json .
ADD README.md BUILD.json* ./
ADD LICENSE .
ADD test-it/resources test/resources

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-http-header-size", "64000", "--disable-warning", "ExperimentalWarning", "api/index.ts"]
