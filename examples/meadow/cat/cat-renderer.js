/**
 * @purpose 在独立 WebGL Canvas 中绘制坐姿尾巴网格和跑跳姿势图集
 * @role 猫动画板专用渲染器，不复用花草的动作公式或状态
 * @deps tail-motion.mjs、cat-motion.mjs、cat-atlas.mjs、WebGL 1、Canvas 2D 叠加
 * @gotcha 坐姿图层保留完整画布坐标；跑跳按注册点播放真实姿势，不能只平移坐姿
 */
import { CAT_SIZE, deformTailPoint } from "./tail-motion.mjs";
import { catLayout } from "./cat-motion.mjs";
import { CAT_ATLASES } from "./cat-atlas.mjs";

export function createCatRenderer(canvas, overlay, body, tail, atlases) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) throw new Error("浏览器没有启用 WebGL，暂时显示静态小猫。");
  const context = overlay.getContext("2d");
  const resources = [];
  let view;

  function compile(type, source) {
    const shader = gl.createShader(type);
    resources.push(() => gl.deleteShader(shader));
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  resources.push(() => gl.deleteProgram(program));
  gl.attachShader(
    program,
    compile(
      gl.VERTEX_SHADER,
      `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    uniform vec2 u_size;
    uniform vec2 u_origin;
    uniform float u_scale;
    varying vec2 v_uv;
    void main() {
      vec2 p = u_origin + a_position * u_scale;
      vec2 clip = p / u_size * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      v_uv = a_uv;
    }
  `,
    ),
  );
  gl.attachShader(
    program,
    compile(
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
  const position = gl.getAttribLocation(program, "a_position");
  const uv = gl.getAttribLocation(program, "a_uv");
  const size = gl.getUniformLocation(program, "u_size");
  const origin = gl.getUniformLocation(program, "u_origin");
  const scale = gl.getUniformLocation(program, "u_scale");
  gl.enableVertexAttribArray(position);
  gl.enableVertexAttribArray(uv);
  gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  function makeMesh(image, rect, columns, rows, dynamic) {
    const points = [];
    const indices = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = rect[0] + (rect[2] * column) / (columns - 1);
        const y = rect[1] + (rect[3] * row) / (rows - 1);
        points.push([x, y]);
        const i = row * columns + column;
        if (row < rows - 1 && column < columns - 1)
          indices.push(i, i + 1, i + columns, i + 1, i + columns + 1, i + columns);
      }
    }
    const data = new Float32Array(
      points.flatMap(([x, y]) => [x, y, x / image.naturalWidth, y / image.naturalHeight]),
    );
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const texture = gl.createTexture();
    resources.push(
      () => gl.deleteBuffer(vertexBuffer),
      () => gl.deleteBuffer(indexBuffer),
      () => gl.deleteTexture(texture),
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { points, indices, data, vertexBuffer, indexBuffer, texture };
  }
  const bodyMesh = makeMesh(body, [0, 0, CAT_SIZE, CAT_SIZE], 2, 2, false);
  const tailMesh = makeMesh(tail, [100, 925, 630, 329], 19, 9, true);
  const spriteMeshes = Object.fromEntries(
    Object.entries(atlases).map(([name, image]) => [
      name,
      makeMesh(image, [0, 0, 1, 1], 2, 2, true),
    ]),
  );

  function resize(width, height) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    for (const surface of [canvas, overlay]) {
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
    }
    view = catLayout(width, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(size, width, height);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawMesh(mesh) {
    gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  }
  function draw(time, amplitude, grid, tailOnly, motion, tailStudy = false) {
    if (!view) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    context?.clearRect(0, 0, view.width, view.height);
    const center = view.width / 2 + motion.x * view.travel;
    const ground = view.ground;
    const unit = view.unit;
    if (context && !tailOnly) {
      context.save();
      const shadowWidth = unit * (0.53 - motion.lift * 0.17);
      context.fillStyle = `rgba(79, 91, 67, ${0.11 - motion.lift * 0.07})`;
      context.beginPath();
      context.ellipse(center, ground + 5, shadowWidth, unit * 0.035, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    if (motion.sheet !== "idle") {
      const atlas = CAT_ATLASES[motion.sheet];
      const mesh = spriteMeshes[motion.sheet];
      const { rect, anchor } = atlas.frames[motion.frame];
      const pixelScale = (unit * 2.05) / atlas.maxWidth;
      const [sx, sy, sw, sh] = rect;
      for (let i = 0; i < 4; i++) {
        const column = i % 2;
        const row = Math.floor(i / 2);
        mesh.data[i * 4] = (column * sw - anchor[0]) * pixelScale * motion.direction;
        mesh.data[i * 4 + 1] = (row * sh - anchor[1]) * pixelScale;
        mesh.data[i * 4 + 2] = (sx + column * sw) / atlas.width;
        mesh.data[i * 4 + 3] = (sy + row * sh) / atlas.height;
      }
      gl.uniform2f(origin, center, ground - motion.lift * unit);
      gl.uniform1f(scale, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.data);
      drawMesh(mesh);
      canvas.dataset.pose = `${motion.sheet}-${motion.frame}`;
      canvas.dataset.time = time.toFixed(4);
      canvas.dataset.x = center.toFixed(3);
      canvas.dataset.lift = motion.lift.toFixed(3);
      return;
    }
    const artworkSize = tailStudy ? Math.min(view.width - 32, view.height - 64, 390) : unit * 1.35;
    const idleScale = artworkSize / CAT_SIZE;
    // The composite's visible paws/tail end around y=1244; use that as the ground anchor.
    const idleY = ground - 1244 * idleScale;
    gl.uniform1f(scale, idleScale);
    // The seated reference is a three-quarter view; keep its original orientation at rest.
    gl.uniform2f(origin, center - (CAT_SIZE / 2) * idleScale, idleY);
    if (!tailOnly) drawMesh(bodyMesh);
    tailMesh.points.forEach(([x, y], i) => {
      const point = deformTailPoint(x, y, time, amplitude);
      tailMesh.data[i * 4] = point[0];
      tailMesh.data[i * 4 + 1] = point[1];
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, tailMesh.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, tailMesh.data);
    drawMesh(tailMesh);
    if (grid && context) {
      context.save();
      context.translate(center - artworkSize / 2, idleY);
      context.scale(idleScale, idleScale);
      context.lineWidth = 0.65 / idleScale;
      context.strokeStyle = "#55744888";
      context.beginPath();
      for (let i = 0; i < tailMesh.indices.length; i += 3) {
        for (let corner = 0; corner < 3; corner++) {
          const offset = tailMesh.indices[i + corner] * 4;
          const x = tailMesh.data[offset];
          const y = tailMesh.data[offset + 1];
          if (corner === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
      }
      context.stroke();
      context.fillStyle = "#425a3c";
      context.beginPath();
      context.arc(270, 1015, 4 / idleScale, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    const tip = deformTailPoint(680, 1160, time, amplitude);
    canvas.dataset.time = time.toFixed(4);
    canvas.dataset.pose = "idle";
    canvas.dataset.x = center.toFixed(3);
    canvas.dataset.lift = "0";
    canvas.dataset.tipX = tip[0].toFixed(3);
    canvas.dataset.tipY = tip[1].toFixed(3);
    canvas.dataset.grid = String(grid);
    canvas.dataset.tailOnly = String(tailOnly);
  }
  return { resize, draw, destroy: () => resources.forEach((dispose) => dispose()) };
}
