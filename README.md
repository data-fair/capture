# <img alt="Data FAIR logo" src="https://cdn.jsdelivr.net/gh/data-fair/data-fair@master/ui/src/assets/logo.svg" width="40"> @data-fair/capture

![GitHub License](https://img.shields.io/github/license/data-fair/capture) ![GitHub package.json version](https://img.shields.io/github/package-json/v/data-fair/capture)  
*A simple service for capturing rendered Web pages using [puppeteer](https://github.com/GoogleChrome/puppeteer).*

Part of the [Data Fair](https://datafair.cloud) ecosystem.

## Sponsors

<a href="https://koumoul.com"><img alt="Koumoul logo" src="https://cdn.jsdelivr.net/gh/data-fair/data-fair@master/docs/assets/koumoul-logo.png" height="56" align="left"></a>

**[Koumoul](https://koumoul.com)** · *La donnée accessible*<br>
Koumoul develops the Data Fair ecosystem and hosts it as an online service.

<br clear="left">

Click [here to support the development of this project](https://github.com/sponsors/koumoul-dev).

## Developers

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dev environment.

Build and run the docker image:

    docker buildx build -t capture --progress plain --load . && docker run --rm -it --security-opt seccomp=$(pwd)/seccomp.json -p 5607:5607 -p 9090:9090 -e DEBUG=capture,timer -e ONLY_SAME_HOST=false -e SECRET_CAPTURE=capture -e HELMET_ACTIVE=false -e PORT=5607 --name capture capture

Check the service with these examples (in the dev environment, replace 5607 with `DEV_API_PORT` from `.env`):

  - [simple screenshot](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html)
  - [custom size](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&width=200&height=150)
  - [custom lang](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&lang=en)
  - [custom timezone](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&timezone=America/Bogota)
  - [download with custom filename](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&filename=test.png)
  - [simple pdf print](http://localhost:5607/api/v1/print?key=capture&target=http://localhost:5607/test/resources/test1.html)
  - [simple HTML print](http://localhost:5607/api/v1/print?key=capture&target=http://localhost:5607/test/resources/test1.html&type=html)
  - [animated gif screenshot](http://localhost:5607/api/v1/screenshot?key=capture&type=gif&target=http://localhost:5607/test/resources/test-anim.html)
  - [animated gif screenshot with custom filename](http://localhost:5607/api/v1/screenshot?key=capture&type=gif&filename=test.gif&target=http://localhost:5607/test/resources/test-anim.html)
  - [fallback to standard screenshot with custom filename](http://localhost:5607/api/v1/screenshot?key=capture&type=gif&filename=test.gif&target=http://localhost:5607/test/resources/test1.html)
  - [inspect: screenshot and render report as JSON (internal use)](http://localhost:5607/api/v1/inspect?key=capture&target=http://localhost:5607/test/resources/test-errors.html)
  - [remote url with a webgl based map](http://localhost:5617/api/v1/print?key=capture&target=https://staging-koumoul.com/cadastre/parcel?id=56251000AV0142)

## Configuration

Configuration is in `config/` and can be overridden with environment variables, see `config/custom-environment-variables.cjs`. Notably:

  - `INSPECT_CONCURRENCY` (`inspectConcurrency`, default 1): how many `/inspect` renders may run at the same time, each one holds a browser page; further requests wait for a free slot.

## Security

Consider reading this article https://github.com/Zenika/alpine-chrome#3-ways-to-securely-use-chrome-headless-with-this-image

We recommend using [./seccomp.json](./seccomp.json). If you trust all pages opened by capture you can use PUPPETEER_ARGS=["--no-sandbox"] environment variable.
