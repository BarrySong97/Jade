/**
 * @purpose 在同一画布合成风动花草、猫和落花蝴蝶
 * @role 追蝶场景 WebGL 绘制与静态 Canvas 回退
 * @deps chase-layout.mjs、chase-assets.mjs、浏览器 WebGL/Canvas 2D
 * @gotcha 后景→猫→前景草→蝴蝶；UV 保留原图，预乘 alpha；落花点与植物共用投影函数
 */
import { plantPoint } from "./chase-layout.mjs";
import { CHASE_ATLASES, spriteTransform, projectSprite } from "./chase-assets.mjs";

export function createChaseRenderer(canvas, images) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) throw new Error("WebGL 不可用");
  const resources = [];
  const dispose = () =>
    resources
      .splice(0)
      .reverse()
      .forEach((remove) => remove());
  try {
    const shader = (type, source) => {
      const value = gl.createShader(type);
      resources.push(() => gl.deleteShader(value));
      gl.shaderSource(value, source);
      gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(value));
      return value;
    };
    const program = gl.createProgram();
    resources.push(() => gl.deleteProgram(program));
    gl.attachShader(
      program,
      shader(
        gl.VERTEX_SHADER,
        `attribute vec2 a_position; attribute vec2 a_uv; uniform vec2 u_size; varying vec2 v_uv; void main(){vec2 p = a_position / u_size * 2.0 - 1.0; gl_Position = vec4(p.x,-p.y,0.,1.); v_uv = a_uv;}`,
      ),
    );
    gl.attachShader(
      program,
      shader(
        gl.FRAGMENT_SHADER,
        `precision mediump float; uniform sampler2D u_image; varying vec2 v_uv; void main(){gl_FragColor = texture2D(u_image,v_uv);}`,
      ),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    resources.push(() => gl.deleteBuffer(buffer));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, 384 * 4, gl.DYNAMIC_DRAW);
    for (const [name, offset] of [
      ["a_position", 0],
      ["a_uv", 8],
    ]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 16, offset);
    }
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    const size = gl.getUniformLocation(program, "u_size");
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const textures = new Map();
    for (const [id, image] of images) {
      const texture = gl.createTexture();
      resources.push(() => gl.deleteTexture(texture));
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
        gl.texParameteri(gl.TEXTURE_2D, parameter, gl.LINEAR);
      for (const parameter of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
        gl.texParameteri(gl.TEXTURE_2D, parameter, gl.CLAMP_TO_EDGE);
      textures.set(id, texture);
    }
    const vertices = new Float32Array(384);
    const draw = (id, count) => {
      gl.bindTexture(gl.TEXTURE_2D, textures.get(id));
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices.subarray(0, count * 4));
      gl.drawArrays(gl.TRIANGLES, 0, count);
    };
    const plant = (item, time, wind) => {
      let cursor = 0;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 2; col++) {
          for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 0],
            [1, 1],
            [0, 1],
          ]) {
            const u = (col + dx) / 2;
            const v = (row + dy) / 8;
            const position = plantPoint(item, u, v, time, wind);
            vertices[cursor++] = position[0];
            vertices[cursor++] = position[1];
            vertices[cursor++] = item.asset.crop[0] + (item.flip ? 1 - u : u) * item.asset.crop[2];
            vertices[cursor++] = item.asset.crop[1] + v * item.asset.crop[3];
          }
        }
      }
      draw(item.asset.id, cursor / 4);
    };
    const sprite = (pose, unit) => {
      const atlas = CHASE_ATLASES[pose.sheet];
      const transform = spriteTransform(pose, unit);
      const [left, top, width, height] = transform.rect;
      let cursor = 0;
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const point = projectSprite([u * width, v * height], transform);
        vertices[cursor++] = point[0];
        vertices[cursor++] = point[1];
        vertices[cursor++] = (left + 0.5 + u * (width - 1)) / atlas.width;
        vertices[cursor++] = (top + 0.5 + v * (height - 1)) / atlas.height;
      }
      draw(pose.sheet, 6);
    };
    return {
      draw(layout, motion, time) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(size, layout.width, layout.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (const item of layout.plants) if (item.layer < 3) plant(item, time, layout.wind);
        sprite(motion.cat, layout.unit);
        for (const item of layout.plants) if (item.layer === 3) plant(item, time, layout.wind);
        sprite(motion.butterfly, layout.unit);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export function drawChaseFallback(canvas, layout, motion, images) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(canvas.width / layout.width, 0, 0, canvas.height / layout.height, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);
  const plant = (item) => {
    const { image, crop, aspect } = item.asset;
    context.save();
    context.translate(item.x, item.base - item.height);
    context.scale(item.flip ? -1 : 1, 1);
    context.drawImage(
      image,
      crop[0] * image.width,
      crop[1] * image.height,
      crop[2] * image.width,
      crop[3] * image.height,
      (-item.height * aspect) / 2,
      0,
      item.height * aspect,
      item.height,
    );
    context.restore();
  };
  const sprite = (pose) => {
    const image = images.get(pose.sheet);
    if (!image) return;
    const t = spriteTransform(pose, layout.unit);
    context.save();
    context.translate(t.x, t.y);
    context.rotate(t.angle);
    context.scale(t.scale * t.direction, t.scale);
    context.drawImage(image, ...t.rect, -t.anchor[0], -t.anchor[1], t.rect[2], t.rect[3]);
    context.restore();
  };
  for (const item of layout.plants) if (item.layer < 3) plant(item);
  sprite(motion.cat);
  for (const item of layout.plants) if (item.layer === 3) plant(item);
  sprite(motion.butterfly);
}
