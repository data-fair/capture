# See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker for the base
# Also see https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile

##########################
FROM node:24.12.0-trixie-slim AS base

WORKDIR /app
ENV NODE_ENV=production

############################################################################################################
# Stage: prepare a base image with all native utils pre-installed, used both by builder and definitive image

FROM base AS nativedeps

ARG TARGETARCH
RUN echo "Building for architecture $TARGETARCH"

# Install chrome and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
RUN apt-get update && \
    apt-get install -y wget gnupg ca-certificates && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
    sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst-one fonts-freefont-ttf libxss1 dbus dbus-x11 --no-install-recommends && \
    service dbus start

ENV DBUS_SESSION_BUS_ADDRESS autolaunch:

# It's a good idea to use dumb-init to help prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_$TARGETARCH /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# cleanup
RUN apt-get clean
RUN apt-get purge -y --auto-remove gnupg apt-transport-https

# skip the browser download when installing puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD true

######################################
# Stage: nodejs dependencies and build
FROM nativedeps AS builder

ADD package.json .
ADD package-lock.json .

# use clean-modules on the same line as npm ci to be lighter in the cache
RUN npm i -g clean-modules@2.0.6
RUN npm ci --omit=dev &&\
    clean-modules --yes --exclude exceljs/lib/doc/ --exclude "**/*.mustache"

##################################
# Stage: main nodejs service stage
FROM nativedeps
LABEL org.opencontainers.image.vendor="Koumoul"
LABEL org.opencontainers.image.authors="contact@koumoul.com"
LABEL org.opencontainers.image.licenses="AGPL-3.0-only"

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
