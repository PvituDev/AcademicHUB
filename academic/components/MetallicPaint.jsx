(function () {
  const { useState, useEffect, useRef } = React;
  window.IFinityHub = window.IFinityHub || {};

  function MetallicPaint({
    imageSrc,
    color = "#06b37a",
    density = 1.6,
    softness = 0.6,
    dispersion = 0,
    distortion = 0.05,
    edgeBend = 0.5,
    angle = 90,
    scale = 1,
  }) {
    const canvasRef = useRef(null);
    const [erroSvg, setErroSvg] = useState(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
      });
      if (!gl) {
        setErroSvg("WebGL não suportado neste navegador.");
        return;
      }

      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = a_position * 0.5 + 0.5;
          v_uv.y = 1.0 - v_uv.y;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision mediump float;
        varying vec2 v_uv;
        uniform sampler2D u_tex;
        uniform float u_time;
        uniform vec3 u_color;
        uniform float u_density;
        uniform float u_softness;
        uniform float u_distortion;
        uniform float u_angle;
        uniform float u_scale;

        void main() {
          vec2 center = vec2(0.5);
          vec2 uv = (v_uv - center) / u_scale + center;

          float rad = radians(u_angle);
          vec2 dir = vec2(cos(rad), sin(rad));

          float wave = sin(dot(uv * u_density * 12.0, dir) + u_time * 2.2)
                     + 0.5 * cos(dot(uv * u_density * 20.0, vec2(-dir.y, dir.x)) - u_time * 1.6);

          vec2 warpedUv = uv + dir * wave * u_distortion * 0.15;
          vec4 mask = texture2D(u_tex, clamp(warpedUv, 0.0, 1.0));

          float isWhiteBg = step(0.95, mask.r) * step(0.95, mask.g) * step(0.95, mask.b);
          float alphaMask = mask.a * (1.0 - isWhiteBg);
          if (alphaMask < 0.05) discard;

          float sheen = smoothstep(-1.0, 1.0, wave);
          sheen = pow(sheen, mix(2.5, 0.7, u_softness));

          vec3 darkMetal = u_color * 0.35;
          vec3 brightMetal = mix(u_color, vec3(1.0), 0.65);
          vec3 finalColor = mix(darkMetal, brightMetal, sheen);

          gl_FragColor = vec4(finalColor, alphaMask);
        }
      `;

      const compileShader = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };

      const program = gl.createProgram();
      gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
      gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
      gl.linkProgram(program);
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      gl.uniform3f(gl.getUniformLocation(program, "u_color"), r, g, b);
      gl.uniform1f(gl.getUniformLocation(program, "u_density"), density);
      gl.uniform1f(gl.getUniformLocation(program, "u_softness"), softness);
      gl.uniform1f(gl.getUniformLocation(program, "u_distortion"), distortion);
      gl.uniform1f(gl.getUniformLocation(program, "u_angle"), angle);
      gl.uniform1f(gl.getUniformLocation(program, "u_scale"), scale);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      let animId;
      let loaded = false;

      fetch(imageSrc)
        .then((res) => {
          if (!res.ok)
            throw new Error(
              `Arquivo não encontrado (${res.status}): ${imageSrc}`
            );
          return res.text();
        })
        .then((svgText) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgText, "image/svg+xml");
          const svgEl = doc.querySelector("svg");
          if (!svgEl)
            throw new Error("Arquivo inválido: não é um SVG válido.");

          if (!svgEl.getAttribute("width")) svgEl.setAttribute("width", "480");
          if (!svgEl.getAttribute("height"))
            svgEl.setAttribute("height", "480");

          const serializado = new XMLSerializer().serializeToString(svgEl);
          const blob = new Blob([serializado], {
            type: "image/svg+xml;charset=utf-8",
          });
          const blobUrl = URL.createObjectURL(blob);

          const img = new Image();
          img.onload = () => {
            const offscreen = document.createElement("canvas");
            offscreen.width = 480;
            offscreen.height = 480;
            const ctx2d = offscreen.getContext("2d");
            ctx2d.drawImage(img, 0, 0, 480, 480);

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              offscreen
            );
            loaded = true;
            URL.revokeObjectURL(blobUrl);
          };
          img.onerror = () => setErroSvg("Falha ao renderizar o SVG.");
          img.src = blobUrl;
        })
        .catch((err) => {
          console.error(err);
          setErroSvg(err.message);
        });

      const timeLoc = gl.getUniformLocation(program, "u_time");
      const startTime = performance.now();

      const render = (now) => {
        if (loaded) {
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform1f(timeLoc, (now - startTime) * 0.001);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        animId = requestAnimationFrame(render);
      };
      animId = requestAnimationFrame(render);

      return () => cancelAnimationFrame(animId);
    }, [
      imageSrc,
      color,
      density,
      softness,
      dispersion,
      distortion,
      edgeBend,
      angle,
      scale,
    ]);

    if (erroSvg) {
      return (
        <div className="p-4 border border-red-500/40 bg-red-500/10 rounded-xl text-xs text-red-300 text-center">
          {erroSvg}
        </div>
      );
    }

    return (
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="w-full h-full block"
      />
    );
  }

  function LogoIFinityDefMark() {
    return (
      <div
        style={{ maxWidth: 480, width: "100%", aspectRatio: "1 / 1" }}
        className="mx-auto"
      >
        <MetallicPaint
          imageSrc="./assets/logo-ifinity-def.svg"
          color="#06b37a"
          density={1.6}
          softness={0.6}
          dispersion={0}
          distortion={0.05}
          edgeBend={0.5}
          angle={90}
          scale={1}
        />
      </div>
    );
  }

  window.IFinityHub.MetallicPaint = MetallicPaint;
  window.IFinityHub.LogoIFinityDefMark = LogoIFinityDefMark;
})();