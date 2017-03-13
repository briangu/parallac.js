# parallac-ide
IDE for Parallac.js

Concepts
---

[Parallac.js](https://github.com/briangu/parallac.js) is a distributed computing framework for Javascript.  This project provides a REPL-like IDE that acts as a client to a Parallac.js cluster, allowing developers to create and run programs from the browser.  The programs are sent to the cluster and dynamically compiled and executed.  Programs and are able to communicate results back to the browser either via the writeln (think remote console.log) and writeFn (think remote lambda execution).

Examples
---

Saw Hello from each Locale

    Locales.map((locale) =>
      on(locale).do(() =>
        writeln("hello from locale", here.id)))

Draw a point from each Locale

    let clearCanvas = () => clear()

    writeFn(clearCanvas)

    Locales.map((locale) =>
      on(locale).do(() => {
        let drawPoint = (x, y, color) => point(x + canvasMidX, y + canvasMidY, color)
        let colors = [
          "red",
          "orange",
          "yellow",
          "green",
          "blue",
          "indigo",
          "violet"
        ]

        writeln("hello, from " + here.id)
        let color = colors[here.id % colors.length]
        writeFn(drawPoint, here.id, 0, color)
      }))

Draw squares

    let drawPoint = (x, y, color) => point(x + canvasMidX, y + canvasMidY, color)
    let clearCanvas = () => clear()

    writeFn(clearCanvas)

    let colorIdx = 0

    for (let x = -50; x < 50; x += 10) {
      for (let y = -50; y < 50; y += 10) {
        let color = colorIdx % 2 === 0 ? "red" : "blue"
        writeFn(drawPoint, x, y, color)
      }

      colorIdx++
    }


Setup
---

    $ git clone --recursive https://github.com/briangu/parallac-ide.git

Running
---

Start hosts (see [Parallac.js](https://github.com/briangu/parallac.js) for details)

    $ cd parallac.js
    $ source bin/deploy.sh <number of hosts>
    $ cd ..
    $ npm start

Open browser to [IDE](http://localhost:8080)


