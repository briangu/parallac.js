let clearCanvas = () => clear()

writeFn(clearCanvas)

let localeIds = Locales.map((locale) => locale.id)
writeln("Locales: ", localeIds)

let colors = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet"
]

// TODO: accumulate calls if we can
let calls = []

let pointIdx = 0

for (let x = -100; x < 100; x += 8) {
  for (let y = -100; y < 100; y += 8) {
    let localeId = pointIdx++ % Locales.length
    // writeln("on ", localeId, Locales[localeId].id)
    calls.push(on(Locales[localeId])
      .with({
        x: x,
        y: y,
        colors: colors
      })
      .do(() => {
        // writeln("drawing from locale: ", here.id)
        let drawPoint = (x, y, color) => point(x + canvasMidX, y + canvasMidY, color)
        writeFn(drawPoint, x, y, colors[here.id % colors.length])
      }))
  }
}

return Promise.all(calls);
