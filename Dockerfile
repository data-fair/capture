# See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker for the base

############################################################################################################
# Stage: prepare a base image with all native utils pre-installed, used both by builder and definitive image

FROM node:20.11.0-slim AS nativedeps

ARG TARGETARCH
RUN echo "Building for architecture $TARGETARCH"

# See https://crbug.com/795759
RUN apt-get update
RUN apt-get install -y libgconf-2-4

# Install chromium and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
RUN apt-get install -y chromium chromium-driver fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf --no-install-recommends

# It's a good idea to use dumb-init to help prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_$TARGETARCH /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# cleanup
RUN apt-get clean
RUN apt-get purge -y --auto-remove gnupg apt-transport-https

# skip the chromium download when installing puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

######################################
# Stage: nodejs dependencies and build
FROM nativedeps AS builder

WORKDIR /webapp
ADD package.json .
ADD package-lock.json .

# deps for gifsicle install
# RUN apt-get install -y dh-autoreconf

# use clean-modules on the same line as npm ci to be lighter in the cache
RUN npm i -g clean-modules@2.0.6
RUN npm ci --omit=dev &&\
    clean-modules --yes --exclude exceljs/lib/doc/ --exclude mocha/lib/test.js --exclude "**/*.mustache"

##################################
# Stage: main nodejs service stage
FROM nativedeps
MAINTAINER "contact@koumoul.com"

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && mkdir -p /webapp \
    && chown -R pptruser:pptruser /webapp

# Run everything after as non-privileged user.
USER pptruser

# The nodejs service
ENV NODE_ENV production
WORKDIR /webapp
COPY --from=builder /webapp/node_modules /webapp/node_modules
ADD server server
ADD config config
ADD contract contract
ADD package.json .
ADD README.md BUILD.json* ./
ADD LICENSE .
ADD test test

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-http-header-size", "64000", "server"]
