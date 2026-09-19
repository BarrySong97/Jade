/**
 * @purpose 用共享二维网格绘制多株透明花草 PNG
 * @role 组合预览的 WebGL 渲染器，独立于页面控制和排布
 * @deps 浏览器 WebGL / Canvas 2D / HTMLImageElement
 * @gotcha 纹理坐标不随风变化；根部 h=0，位移为零；使用预乘 alpha 避免黑边
 */
const COLUMNS = 3;
const ROWS = 9;

export async function loadPlant(id) {
  const image = new Image();
  image.src = `/assets/${id}.png`;
  await image.decode();
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const context = probe.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, image.width, image.height);
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (data[(y * image.width + x) * 4 + 3] > 8) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) throw new Error(`${id} 没有可见内容`);
  const width = right - left + 1;
  const height = bottom - top + 1;
  return {
    id,
    image,
    aspect: width / height,
    crop: [left / image.width, top / image.height, width / image.width, height / image.height],
  };
}

export function createRenderer(canvas, overlay, assets) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) throw new Error("浏览器未启用 WebGL；仍可在下方查看独立 PNG");
  const context = overlay.getContext("2d");
  const resources = [];
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(result));
    resources.push(() => gl.deleteShader(result));
    return result;
  }
  const program = gl.createProgram();
  gl.attachShader(
    program,
    shader(
      gl.VERTEX_SHADER,
      `
    attribute vec2 a_point;
    uniform vec2 u_size;
    uniform vec4 u_rect;
    uniform vec4 u_crop;
    uniform float u_bend;
    uniform float u_flip;
    varying vec2 v_uv;
    void main() {
      float h = 1.0 - a_point.y;
      vec2 p = u_rect.xy + a_point * u_rect.zw;
      p.x += u_bend * h * h;
      vec2 clip = p / u_size * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      float u = mix(a_point.x, 1.0 - a_point.x, u_flip);
      v_uv = u_crop.xy + vec2(u, a_point.y) * u_crop.zw;
    }
  `,
    ),
  );
  gl.attachShader(
    program,
    shader(
      gl.FRAGMENT_SHADER,
      `
    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_uv;
    void main() { gl_FragColor = texture2D(u_image, v_uv); }
  `,
    ),
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  resources.push(() => gl.deleteProgram(program));
  const vertices = [];
  const indices = [];
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      vertices.push(column / (COLUMNS - 1), row / (ROWS - 1));
      const point = row * COLUMNS + column;
      if (row < ROWS - 1 && column < COLUMNS - 1) {
        indices.push(
          point,
          point + 1,
          point + COLUMNS,
          point + 1,
          point + COLUMNS + 1,
          point + COLUMNS,
        );
      }
    }
  }
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  resources.push(
    () => gl.deleteBuffer(vertexBuffer),
    () => gl.deleteBuffer(indexBuffer),
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, "a_point");
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const uniforms = Object.fromEntries(
    ["size", "rect", "crop", "bend", "flip"].map((key) => [
      key,
      gl.getUniformLocation(program, `u_${key}`),
    ]),
  );
  gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const textures = new Map();
  for (const asset of assets) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures.set(asset.id, texture);
    resources.push(() => gl.deleteTexture(texture));
  }

  function resize(width, height) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    for (const surface of [canvas, overlay]) {
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.size, width, height);
  }

  function draw(plants, time, wind, grid) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    context.clearRect(0, 0, overlay.clientWidth, overlay.clientHeight);
    let maximumBend = 0;
    for (const plant of plants) {
      const { asset, x, base, height, flip, phase, stiffness } = plant;
      const width = height * asset.aspect;
      const left = x - width / 2;
      const top = base - height;
      const breeze =
        Math.sin(time * 1.08 + phase) * 0.8 + Math.sin(time * 1.93 + phase * 1.4) * 0.2;
      const bend = breeze * wind * height * 0.1 * stiffness;
      maximumBend = Math.max(maximumBend, Math.abs(bend));
      gl.bindTexture(gl.TEXTURE_2D, textures.get(asset.id));
      gl.uniform4f(uniforms.rect, left, top, width, height);
      gl.uniform4fv(uniforms.crop, asset.crop);
      gl.uniform1f(uniforms.bend, bend);
      gl.uniform1f(uniforms.flip, flip ? 1 : 0);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      if (grid && plant.inspect) {
        const points = vertices.map((value, i) =>
          i % 2 === 0
            ? left + value * width + bend * (1 - vertices[i + 1]) ** 2
            : top + value * height,
        );
        context.strokeStyle = "#57784b80";
        context.lineWidth = 0.6;
        for (let i = 0; i < indices.length; i += 3) {
          context.beginPath();
          indices.slice(i, i + 3).forEach((point, corner) => {
            if (corner === 0) context.moveTo(points[point * 2], points[point * 2 + 1]);
            else context.lineTo(points[point * 2], points[point * 2 + 1]);
          });
          context.closePath();
          context.stroke();
        }
        context.beginPath();
        context.arc(x, base, 3, 0, Math.PI * 2);
        context.fillStyle = "#4d6c41";
        context.fill();
      }
    }
    canvas.dataset.time = time.toFixed(4);
    canvas.dataset.maxBend = maximumBend.toFixed(4);
    canvas.dataset.plants = String(plants.length);
  }
  return { resize, draw, destroy: () => resources.forEach((dispose) => dispose()) };
}
