// This is based on: http://berjon.com/jaytracer-js-raytracer/

// let writeln = console.log;
// let writeFn = console.log;

module.exports = {
  putImageData: (id, x, y) => putImageData(id, x, y),
  drawPixel: (pos, r, g, b, a) => drawPixel(pos, r, g, b, a),
  flushImage: () => flushImage(),

  vectorAdd: function (v1, v2) {
    let res = [];
    for (let i = 0; i < v1.length; i++) { res[i] = v1[i] + v2[i]; }
    return res;
  },
  vectorSub: function (v1, v2) {
    let res = [];
    for (let i = 0; i < v1.length; i++) { res[i] = v1[i] - v2[i]; }
    return res;
  },
  vectorNeg: function (v1) {
    let res = [];
    for (let i = 0; i < v1.length; i++) { res[i] = -v1[i]; }
    return res;
  },
  vectorScale: function (v1, x) {
    let res = [];
    for (let i = 0; i < v1.length; i++) { res[i] = v1[i] * x; }
    return res;
  },
  vectorDot: function (v1, v2) {
    let res = 0;
    for (let i = 0; i < v1.length; i++) { res += v1[i] * v2[i]; }
    return res;
  },
  vectorCross3: function (v1, v2) {
    return [v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
    ];
  },
  vectorBlend: function (v1, v2) {
    let res = [];
    for (let i = 0; i < v1.length; i++) { res[i] = v1[i] * v2[i]; }
    return res;
  },
  vectorLength: function (v1) {
    let sum = 0.0;
    for (let i = 0; i < v1.length; i++) { sum += (1 * v1[i]) * (1 * v1[i]); }
    return Math.sqrt(sum);
  },
  vectorNormalise: function (v1) {
    let len = this.vectorLength(v1);
    let res = [];
    for (let i = 0; i < v1.length; i++) { res[i] = v1[i] / len }
    return res;
  },
  vectorSum: function () {
    let vecs = [];
    for (let i = 0; i < arguments.length; i++) vecs.push(arguments[i]);
    return this.vectorSumArray(vecs);
  },
  vectorSumArray: function (vecs) {
    let res = [0, 0, 0];
    for (let i = 0; i < vecs.length; i++) {
      let v = vecs[i];
      res[0] += v[0];
      res[1] += v[1];
      res[2] += v[2];
    }
    return res;
  },
  computeRayDir: function(cam, x, y) {
    return this.vectorNormalise(
      this.vectorAdd(
        cam.forward,
        this.vectorAdd(this.vectorScale(cam.right, x), this.vectorScale(cam.up, y))
      )
    );
  },
  computePixel: function (scene, x, y) {
    let cam = scene.camera;
    let raySrc = cam.position;
    let rayDir = this.computeRayDir(cam, x, y);
    let chans = this.traceRay(scene, raySrc, rayDir, null, 1);
    for (let i = 0; i < chans.length; i++) {
      if (chans[i] < 0) chans[i] = 0;
      else if (chans[i] > 1) chans[i] = 1;
    }
    return chans;
  },

  shapeIntersect: function (start, dir, shape) {
    switch (shape.type) {
      case "plane":
        return this.intersectPlane(start, dir, shape);
      case "sphere":
        return this.intersectSphere(start, dir, shape);
      default:
        return [];
    };
  },
  intersectPlane: function (start, dir, plane) {
    let denom = this.vectorDot(dir, plane.normal);
    if (denom == 0) return;
    let res = plane.offset - this.vectorDot(start, plane.normal) / denom;
    if (res <= 0) return;
    return res;
  },
  intersectSphere: function (start, dir, sphere) {
    let y = this.vectorSub(start, sphere.centre);
    let beta = this.vectorDot(dir, y),
      gamma = this.vectorDot(y, y) - sphere.radius * sphere.radius;
    let descriminant = beta * beta - gamma;
    if (descriminant <= 0) return;
    let sqrt = Math.sqrt(descriminant);
    if (-beta - sqrt > 0) return -beta - sqrt;
    else if (-beta + sqrt > 0) return -beta + sqrt;
    else return;
  },
  shapeNormal: function (pos, shape) {
    switch (shape.type) {
      case "plane":
        return shape.normal;
      case "sphere":
        return this.sphereNormal(pos, shape);
      default:
        return [];
    };
  },
  sphereNormal: function (pos, sphere) {
    return this.vectorScale(this.vectorSub(pos, sphere.centre), 1 / sphere.radius);
  },
  shade: function (pos, dir, shape, scene, contrib) {
    let mat = this.material(shape.surface, pos);
    let norm = this.shapeNormal(pos, shape);
    let reflect = mat[3];
    contrib = contrib * reflect;
    norm = (this.vectorDot(dir, norm) > 0) ? -norm : norm;
    let reflectDir = this.vectorSub(dir, this.vectorScale(norm, 2 * this.vectorDot(norm, dir)));
    let light = this.light(scene, shape, pos, norm, reflectDir, mat);
    if (contrib > 0.01) {
      return this.vectorSum(
        light,
        this.vectorScale(
          this.traceRay(scene, pos, reflectDir, shape, contrib),
          reflect
        )
      );
    } else {
      return light;
    }
  },
  light: function (scene, shape, pos, norm, reflectDir, mat) {
    let colour = [mat[0], mat[1], mat[2]],
      reflect = mat[3],
      smooth = mat[4];
    let res = [];
    for (let i = 0; i < scene.lights.length; i++) {
      let lCol = scene.lights[i].colour,
        lPos = scene.lights[i].position;
      let lDir = this.vectorNormalise(this.vectorSub(lPos, pos));
      let lDist = this.vectorLength(this.vectorSub(lPos, pos));
      let tRay = this.testRay(scene, pos, lDir, shape);
      let skip = false;
      for (let j = 0; j < tRay.length; j++)
        if (tRay[j] < lDist) skip = true; // XXX use label
      if (skip) continue;
      let illum = this.vectorDot(lDir, norm);
      if (illum > 0) res.push(this.vectorScale(this.vectorBlend(lCol, colour), illum));
      let spec = this.vectorDot(lDir, reflectDir);
      if (spec > 0) res.push(this.vectorScale(lCol, Math.pow(spec, smooth) * reflect));
    }
    return this.vectorSumArray(res);
  },
  material: function (name, pos) {
    if (name == "shiny") {
      return [1, 1, 1, 0.6, 50]
    } else if (name == "checkerboard") {
      return ((Math.floor(pos[0]) + Math.floor(pos[2])) % 2) == 0 ? [0, 0, 0, 0.7, 150] : [1, 1, 1, 0.1, 50];
    }
  },
  testRay: function (scene, src, dir, curShape) {
    let res = [];
    for (let i = 0; i < scene.shapes.length; i++) {
      let shape = scene.shapes[i];
      if (shape.id == curShape.id) continue;
      let inter = this.shapeIntersect(src, dir, shape);
      if (inter != null) res.push(inter);
    }
    return res;
  },
  traceRay: function (scene, src, dir, ignore, contrib) {
    let tmp = [];
    for (let i = 0; i < scene.shapes.length; i++) {
      let shape = scene.shapes[i];
      if (ignore && ignore.id == shape.id) continue;
      let dist = this.shapeIntersect(src, dir, shape);
      if (dist == null) continue; // XXX optimisation
      let pos = this.vectorAdd(src, this.vectorScale(dir, dist));
      tmp.push({ dist: dist, pos: pos, shape: shape });
    }
    if (tmp.length == 0) return scene.background;
    else {
      tmp = tmp.sort(function (a, b) { return a.dist - b.dist; });
      return this.shade(tmp[0].pos, dir, tmp[0].shape, scene, contrib);
    }
  },
  calculateBasis: function (scene) {
    let cam = scene.camera;
    cam.forward = this.vectorNormalise(this.vectorSub(cam.lookAt, cam.position));
    cam.right = this.vectorNormalise(this.vectorCross3(cam.forward, [0, -1, 0]));
    cam.up = this.vectorCross3(cam.forward, cam.right);
  },
  prepareScene: function (scene) {
    this.calculateBasis(scene);
  }
};
