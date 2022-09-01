# Capture

A simple service for capturing rendered Web pages using [puppeteer](https://github.com/GoogleChrome/puppeteer).

Ased as a companion service for [data-fair](https://koumoul-dev.github.io/data-fair/).

## Developper

To run locally you will need to install google-chrome-unstable for your system.

Install dependencies without downloading chromium:

    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    npm i

Then start the server:

    npm run dev

Or build and run the docker image:

    docker build -t capture . && docker run --rm -it -p 5607:5607 -p 9090:9090 -e DEBUG=capture,timer -e ONLY_SAME_HOST=false -e PORT=5607 --name capture capture

Check the service with these examples:

  - [simple screenshot](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html)
  - [custom size](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&width=200&height=150)
  - [custom lang](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&lang=en)
  - [custom timezone](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&timezone=America/Bogota)
  - [download with custom filename](http://localhost:5607/api/v1/screenshot?key=capture&target=http://localhost:5607/test/resources/test1.html&filename=test.png)
  - [simple pdf print](http://localhost:5607/api/v1/print?key=capture&target=http://localhost:5607/test/resources/test1.html)
  - [animated gif screenshot](http://localhost:5607/api/v1/screenshot?key=capture&type=gif&target=http://localhost:5607/test/resources/test-anim.html)
  - [animated gif screenshot with custom filename](http://localhost:5607/api/v1/screenshot?key=capture&type=gif&filename=test.gif&target=http://localhost:5607/test/resources/test-anim.html)
  - [fallback to standard screenshot with custom filename](http://localhost:5607/api/v1/screenshot?key=capture&type=gif&filename=test.gif&target=http://localhost:5607/test/resources/test1.html)
  - [screenshot converted to jpg](http://localhost:5607/api/v1/screenshot?key=capture&type=jpg&target=http://localhost:5607/test/resources/test-anim.html)
  - [screenshot with custom jpg filename](http://localhost:5607/api/v1/screenshot?key=capture&filename=test.jpg&target=http://localhost:5607/test/resources/test-anim.html)
