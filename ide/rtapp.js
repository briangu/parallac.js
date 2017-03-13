// This is based on: http://berjon.com/jaytracer-js-raytracer/

// var writeln = console.log
// var writeFn = console.log
// var on = () => {
//   return {
//     with: function () { return this },
//     do: function () { return Promise.resolve() }
//   }
// }

var JayTracer = require('./raytracer')

function plotPixel(scene, pos, pix, x, y) {
  let shard = Math.floor(Math.abs(x) * 255) % Locales.length
  return on(Locales[shard])
    .with({
      scene: scene,
      x: x,
      y: y
    })
    .do(() => {
      // let JayTracer = require('./lib/raytracer')
      return JayTracer.computePixel(scene, x, y)
    })
    .then((chans) => {
      const offset = pos * 4;
      pix[offset + 0] = Math.floor(chans[0] * 255)
      pix[offset + 1] = Math.floor(chans[1] * 255)
      pix[offset + 2] = Math.floor(chans[2] * 255)
      pix[offset + 3] = 255;
    })
}

function writeImage(scene, width, height) {
  JayTracer.prepareScene(scene);

  const id = { 'width': width, 'height': height, 'data': new Array(width * height * 4) };
  const pix = id.data;
  const aspectRatio = width / height;

  const calls = [];
  let pos = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const yRec = (-y / height) + 0.5;
      const xRec = ((x / width) - 0.5) * aspectRatio;
      calls.push(plotPixel(scene, pos, pix, xRec, yRec))
      pos++
    }
  }

  return Promise.all(calls)
    .then(() => writeFn(JayTracer.putImageData, id, 0, 0))
}

let scene = {
  background: [0, 0, 0],
  shapes: [{
      id: "infinity",
      type: "plane",
      offset: 0,
      surface: "checkerboard",
      normal: [0, 1, 0],
    },
    {
      id: "big-sphere",
      type: "sphere",
      radius: 1,
      surface: "shiny",
      centre: [0, 1, 0],
    },
    {
      id: "lil-sphere",
      type: "sphere",
      radius: 0.5,
      surface: "shiny",
      centre: [-1, 0.5, 1.5],
    },
  ],
  camera: {
    position: [3, 2, 4],
    lookAt: [-1, 0.5, 0],
  },
  lights: [{
      position: [-2, 2.5, 0],
      colour: [0.49, 0.07, 0.07]
    },
    {
      position: [1.5, 2.5, 1.5],
      colour: [0.07, 0.07, 0.49]
    },
    {
      position: [1.5, 2.5, -1.5],
      colour: [0.07, 0.49, 0.07]
    },
    {
      position: [0, 3.5, 0],
      colour: [0.21, 0.21, 0.35]
    },
  ]
};

// TODO: can we get the size from the browser w/ a kind of "readFn"?
let width = 480;
let height = 360;

let time = (new Date()).getTime();
writeln("started at " + time + " with w=" + width + ", h=" + height);
return writeImage(scene, width, height)
  .then(() => {
    let newTime = (new Date()).getTime() - time;
    writeln("time taken: " + time + "ms");
  })
