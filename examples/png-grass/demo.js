/**
 * @purpose 让一张透明草叶 PNG 随二维网格弯曲，并可视化网格
 * @role 独立浏览器教学示例，展示固定视角的位图动画
 * @deps 浏览器 WebGL / Canvas 2D / ResizeObserver，grass.png
 * @gotcha 网格横向剪切会轻微拉伸笔触，不能生成叶片背面；根部整行保持固定
 */
const $ = (id) => document.getElementById(id);
const original = $("original");
const animated = $("animated");
const overlay = $("overlay");
const originalContext = original.getContext("2d");
const overlayContext = overlay.getContext("2d");
const controls = $("controls");
const pauseButton = $("pause");
const gridInput = $("grid");
const windInput = $("wind");
const motionStatus = $("motion-status");
const columns = 3;
const rows = 9;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;
let elapsed = 0.85;
let previousTime = null;
let frameId = 0;
let wind = Number(windInput.value) / 100;
let layout;

function fail(error) {
  cancelAnimationFrame(frameId);
  controls.disabled = true;
  $("error").hidden = false;
  $("error").textContent = `动画暂时无法运行：${error.message}`;
  motionStatus.textContent = "加载失败";
}

try {
  const image = new Image();
  image.src = "/grass.png";
  await image.decode();

  // 只读取透明通道定位植物；原始 PNG 文件不被改写。
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const probeContext = probe.getContext("2d", { willReadFrequently: true });
  probeContext.drawImage(image, 0, 0);
  const pixels = probeContext.getImageData(0, 0, image.width, image.height).data;
  let left = image.width;
  let top = image.height;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (pixels[(y * image.width + x) * 4 + 3] > 8) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (left > right) throw new Error("PNG 中没有可见植物");
  let rootSum = 0;
  let rootWeight = 0;
  for (let y = Math.max(top, bottom - 3); y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const alpha = pixels[(y * image.width + x) * 4 + 3];
      rootSum += x * alpha;
      rootWeight += alpha;
    }
  }
  const rootX = rootSum / rootWeight;
  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;
  const gl = animated.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) throw new Error("当前浏览器未启用 WebGL");

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(result));
    }
    return result;
  }

  const program = gl.createProgram();
  gl.attachShader(
    program,
    shader(
      gl.VERTEX_SHADER,
      `
      attribute vec2 a_position;
      attribute vec2 a_uv;
      uniform vec2 u_size;
      varying vec2 v_uv;
      void main() {
        vec2 clip = a_position / u_size * 2.0 - 1.0;
        gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
        v_uv = a_uv;
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
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);
  const positions = new Float32Array(columns * rows * 2);
  const uvs = new Float32Array(positions.length);
  const triangles = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const point = row * columns + column;
      uvs[point * 2] = (left + (column / (columns - 1)) * cropWidth) / image.width;
      uvs[point * 2 + 1] = (top + (row / (rows - 1)) * cropHeight) / image.height;
      if (row < rows - 1 && column < columns - 1) {
        triangles.push(point, point + 1, point + columns);
        triangles.push(point + 1, point + columns + 1, point + columns);
      }
    }
  }

  function attribute(name, values, usage) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, usage);
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    return buffer;
  }
  const positionBuffer = attribute("a_position", positions, gl.DYNAMIC_DRAW);
  attribute("a_uv", uvs, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const sizeUniform = gl.getUniformLocation(program, "u_size");

  function rootMarker(context) {
    context.beginPath();
    context.arc(layout.anchorX, layout.y + layout.height, 4, 0, Math.PI * 2);
    context.fillStyle = "#718f64";
    context.fill();
  }

  function draw() {
    if (!layout) return;
    // 两个缓慢周期叠加，避免像钟摆一样机械；暂停时保留当前相位。
    const breeze = Math.sin(elapsed * 1.35) * 0.78 + Math.sin(elapsed * 2.17) * 0.22;
    const bend = breeze * wind * layout.maxBend;
    for (let row = 0; row < rows; row++) {
      const heightFromRoot = 1 - row / (rows - 1);
      const offset = bend * heightFromRoot ** 2;
      for (let column = 0; column < columns; column++) {
        const index = (row * columns + column) * 2;
        positions[index] = layout.x + (column / (columns - 1)) * layout.width + offset;
        positions[index + 1] = layout.y + (row / (rows - 1)) * layout.height;
      }
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
    gl.drawElements(gl.TRIANGLES, triangles.length, gl.UNSIGNED_SHORT, 0);

    overlayContext.clearRect(0, 0, layout.canvasWidth, layout.canvasHeight);
    if (gridInput.checked) {
      overlayContext.strokeStyle = "#82967870";
      overlayContext.lineWidth = 0.8;
      for (let i = 0; i < triangles.length; i += 3) {
        overlayContext.beginPath();
        for (let corner = 0; corner < 3; corner++) {
          const point = triangles[i + corner] * 2;
          if (corner === 0) overlayContext.moveTo(positions[point], positions[point + 1]);
          else overlayContext.lineTo(positions[point], positions[point + 1]);
        }
        overlayContext.closePath();
        overlayContext.stroke();
      }
      for (let i = 0; i < positions.length; i += 2) {
        overlayContext.beginPath();
        overlayContext.arc(positions[i], positions[i + 1], 2, 0, Math.PI * 2);
        overlayContext.fillStyle = "#65855c";
        overlayContext.fill();
      }
    }
    rootMarker(overlayContext);
    // 将实际绘制状态写到 DOM，便于浏览器验收暂停、零风力与根部锚定。
    animated.dataset.bend = bend.toFixed(4);
    animated.dataset.rootOffset = (positions[(rows - 1) * columns * 2] - layout.x).toFixed(4);
    animated.dataset.time = elapsed.toFixed(4);
  }

  function resize() {
    const width = Math.min(original.clientWidth, animated.clientWidth);
    const height = animated.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    for (const canvas of [original, animated, overlay]) {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(height * dpr);
    }
    originalContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    overlayContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    const maxBend = Math.min(55, width * 0.14);
    const scale = Math.min((width - 40 - maxBend * 2) / cropWidth, (height - 62) / cropHeight);
    const anchorX = width / 2;
    layout = {
      x: anchorX - (rootX - left) * scale,
      y: height - 32 - cropHeight * scale,
      width: cropWidth * scale,
      height: cropHeight * scale,
      anchorX,
      maxBend,
      canvasWidth: width,
      canvasHeight: height,
    };
    originalContext.clearRect(0, 0, width, height);
    originalContext.drawImage(
      image,
      left,
      top,
      cropWidth,
      cropHeight,
      layout.x,
      layout.y,
      layout.width,
      layout.height,
    );
    rootMarker(originalContext);
    gl.viewport(0, 0, animated.width, animated.height);
    gl.uniform2f(sizeUniform, animated.clientWidth, height);
    draw();
  }

  function tick(time) {
    if (previousTime !== null) elapsed += Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    draw();
    frameId = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    cancelAnimationFrame(frameId);
    previousTime = null;
    pauseButton.textContent = paused ? "继续" : "暂停";
    motionStatus.textContent = paused ? "已暂停" : wind === 0 ? "无风" : "微风中";
    draw();
    if (!paused && !document.hidden) frameId = requestAnimationFrame(tick);
  }
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    updatePlayback();
  });
  gridInput.addEventListener("change", draw);
  windInput.addEventListener("input", () => {
    wind = Number(windInput.value) / 100;
    $("wind-value").value = windInput.value;
    updatePlayback();
  });
  reducedMotion.addEventListener("change", (event) => {
    paused = event.matches;
    updatePlayback();
  });
  document.addEventListener("visibilitychange", updatePlayback);
  animated.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail(new Error("图形上下文已丢失，请刷新页面"));
  });
  new ResizeObserver(resize).observe($("animated-stage"));
  controls.disabled = false;
  resize();
  updatePlayback();
  document.documentElement.dataset.ready = "true";
} catch (error) {
  fail(error);
}
