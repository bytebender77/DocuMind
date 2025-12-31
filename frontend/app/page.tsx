"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fluid Animation Script
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      DENSITY_DISSIPATION: 1,
      VELOCITY_DISSIPATION: 0.2,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 30,
      SPLAT_RADIUS: 0.25,
      SPLAT_FORCE: 6000,
      SHADING: true,
    };

    function getWebGLContext(canvas: HTMLCanvasElement) {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
      const isWebGL2 = !!gl;
      if (!isWebGL2) gl = canvas.getContext('webgl', params) as any || canvas.getContext('experimental-webgl', params) as any;
      if (!gl) return null;

      let halfFloat: any;
      let supportLinearFiltering;

      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat?.HALF_FLOAT_OES || gl.FLOAT);
      return { gl, ext: { halfFloatTexType, supportLinearFiltering } };
    }

    const context = getWebGLContext(canvas);
    if (!context) return;
    const { gl, ext } = context;

    function createShader(type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
      return shader;
    }

    function createProgram(vsSource: string, fsSource: string) {
      const program = gl.createProgram()!;
      gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
      gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program));
      return program;
    }

    const baseVertexShader = `precision highp float; attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform vec2 texelSize; void main () { vUv = aPosition * 0.5 + 0.5; vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0); vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y); gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    const clearShader = `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value; void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;
    const displayShaderSource = `precision highp float; precision highp sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uTexture; uniform vec2 texelSize; void main () { vec3 c = texture2D(uTexture, vUv).rgb; vec3 lc = texture2D(uTexture, vL).rgb; vec3 rc = texture2D(uTexture, vR).rgb; vec3 tc = texture2D(uTexture, vT).rgb; vec3 bc = texture2D(uTexture, vB).rgb; float dx = length(rc) - length(lc); float dy = length(tc) - length(bc); vec3 n = normalize(vec3(dx, dy, length(texelSize))); vec3 l = vec3(0.0, 0.0, 1.0); float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0); c *= diffuse; float a = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c, a); }`;
    const splatShader = `precision highp float; precision highp sampler2D; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius; void main () { vec2 p = vUv - point.xy; p.x *= aspectRatio; vec3 splat = exp(-dot(p, p) / radius) * color; vec3 base = texture2D(uTarget, vUv).xyz; gl_FragColor = vec4(base + splat, 1.0); }`;
    const advectionShader = `precision highp float; precision highp sampler2D; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation; void main () { vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize; vec4 result = texture2D(uSource, coord); float decay = 1.0 + dissipation * dt; gl_FragColor = result / decay; }`;
    const divergenceShader = `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity; void main () { float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x; float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y; vec2 C = texture2D(uVelocity, vUv).xy; if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; } if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; } float div = 0.5 * (R - L + T - B); gl_FragColor = vec4(div, 0.0, 0.0, 1.0); }`;
    const curlShader = `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity; void main () { float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y; float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x; float vorticity = R - L - T + B; gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0); }`;
    const vorticityShader = `precision highp float; precision highp sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt; void main () { float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x; float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x; float C = texture2D(uCurl, vUv).x; vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0; vec2 velocity = texture2D(uVelocity, vUv).xy; velocity += force * dt; velocity = min(max(velocity, -1000.0), 1000.0); gl_FragColor = vec4(velocity, 0.0, 1.0); }`;
    const pressureShader = `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uPressure; uniform sampler2D uDivergence; void main () { float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x; float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x; float divergence = texture2D(uDivergence, vUv).x; float pressure = (L + R + B + T - divergence) * 0.25; gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0); }`;
    const gradientSubtractShader = `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uPressure; uniform sampler2D uVelocity; void main () { float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x; float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x; vec2 velocity = texture2D(uVelocity, vUv).xy; velocity.xy -= vec2(R - L, T - B); gl_FragColor = vec4(velocity, 0.0, 1.0); }`;

    const splatProgram = createProgram(baseVertexShader, splatShader);
    const curlProgram = createProgram(baseVertexShader, curlShader);
    const vorticityProgram = createProgram(baseVertexShader, vorticityShader);
    const divergenceProgram = createProgram(baseVertexShader, divergenceShader);
    const clearProgram = createProgram(baseVertexShader, clearShader);
    const pressureProgram = createProgram(baseVertexShader, pressureShader);
    const gradientSubtractProgram = createProgram(baseVertexShader, gradientSubtractShader);
    const advectionProgram = createProgram(baseVertexShader, advectionShader);
    const displayProgram = createProgram(baseVertexShader, displayShaderSource);

    function getUniforms(program: WebGLProgram) {
      const uniforms: any = {};
      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniformName = gl.getActiveUniform(program, i)?.name;
        if (uniformName) uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
      return uniforms;
    }

    const programs = [splatProgram, curlProgram, vorticityProgram, divergenceProgram, clearProgram, pressureProgram, gradientSubtractProgram, advectionProgram, displayProgram];
    const programUniforms = programs.map(p => getUniforms(p));

    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture, fbo, width: w, height: h, texelSizeX: 1.0 / w, texelSizeY: 1.0 / h, attach: (id: number) => { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }

    function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; }, set read(value) { fbo1 = value; },
        get write() { return fbo2; }, set write(value) { fbo2 = value; },
        swap() { const temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
      };
    }

    let dye: any, velocity: any, divergence: any, curl: any, pressure: any;

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = ext.halfFloatTexType;
      const formatRGBA = { internalFormat: (gl as any).RGBA16F || gl.RGBA, format: gl.RGBA };
      const formatRG = { internalFormat: (gl as any).RG16F || gl.RGBA, format: (gl as any).RG || gl.RGBA };
      const formatR = { internalFormat: (gl as any).R16F || gl.RGBA, format: (gl as any).RED || gl.RGBA };

      dye = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, texType, gl.LINEAR);
      velocity = createDoubleFBO(simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, texType, gl.LINEAR);
      divergence = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, texType, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, texType, gl.NEAREST);
    }

    function getResolution(resolution: number) {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
      else return { width: min, height: max };
    }

    function blit(target: any) {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    let lastUpdateTime = Date.now();
    let animationId: number;

    function splat(x: number, y: number, dx: number, dy: number, color: { r: number, g: number, b: number }) {
      gl.useProgram(splatProgram);
      gl.uniform1i(programUniforms[0]['uTarget'], velocity.read.attach(0));
      gl.uniform1f(programUniforms[0]['aspectRatio'], canvas!.width / canvas!.height);
      gl.uniform2f(programUniforms[0]['point'], x / canvas!.width, 1.0 - y / canvas!.height);
      gl.uniform3f(programUniforms[0]['color'], dx, dy, 0.0);
      gl.uniform1f(programUniforms[0]['radius'], config.SPLAT_RADIUS / 100.0);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(programUniforms[0]['uTarget'], dye.read.attach(0));
      gl.uniform3f(programUniforms[0]['color'], color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function update() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
        initFramebuffers();
      }

      const dt = Math.min((Date.now() - lastUpdateTime) / 1000, 0.016);
      lastUpdateTime = Date.now();

      gl.disable(gl.BLEND);
      gl.useProgram(curlProgram);
      gl.uniform2f(programUniforms[1]['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programUniforms[1]['uVelocity'], velocity.read.attach(0));
      blit(curl);

      gl.useProgram(vorticityProgram);
      gl.uniform2f(programUniforms[2]['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programUniforms[2]['uVelocity'], velocity.read.attach(0));
      gl.uniform1i(programUniforms[2]['uCurl'], curl.attach(1));
      gl.uniform1f(programUniforms[2]['curl'], config.CURL);
      gl.uniform1f(programUniforms[2]['dt'], dt);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(divergenceProgram);
      gl.uniform2f(programUniforms[3]['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programUniforms[3]['uVelocity'], velocity.read.attach(0));
      blit(divergence);

      gl.useProgram(clearProgram);
      gl.uniform1i(programUniforms[4]['uTexture'], pressure.read.attach(0));
      gl.uniform1f(programUniforms[4]['value'], config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      gl.useProgram(pressureProgram);
      gl.uniform2f(programUniforms[5]['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programUniforms[5]['uDivergence'], divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(programUniforms[5]['uPressure'], pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gl.useProgram(gradientSubtractProgram);
      gl.uniform2f(programUniforms[6]['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(programUniforms[6]['uPressure'], pressure.read.attach(0));
      gl.uniform1i(programUniforms[6]['uVelocity'], velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(advectionProgram);
      gl.uniform2f(programUniforms[7]['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform2f(programUniforms[7]['dyeTexelSize'], velocity.texelSizeX, velocity.texelSizeY);
      const velocityId = velocity.read.attach(0);
      gl.uniform1i(programUniforms[7]['uVelocity'], velocityId);
      gl.uniform1i(programUniforms[7]['uSource'], velocityId);
      gl.uniform1f(programUniforms[7]['dt'], dt);
      gl.uniform1f(programUniforms[7]['dissipation'], config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      gl.uniform2f(programUniforms[7]['dyeTexelSize'], dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(programUniforms[7]['uVelocity'], velocity.read.attach(0));
      gl.uniform1i(programUniforms[7]['uSource'], dye.read.attach(1));
      gl.uniform1f(programUniforms[7]['dissipation'], config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(displayProgram);
      gl.uniform1i(programUniforms[8]['uTexture'], dye.read.attach(0));
      gl.uniform2f(programUniforms[8]['texelSize'], 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationId = requestAnimationFrame(update);
    }

    initFramebuffers();
    update();
    splat(window.innerWidth / 2, window.innerHeight / 2, 0, -20, { r: 0.2, g: 0.4, b: 1.0 });

    const handleMouseMove = (e: MouseEvent) => {
      splat(e.clientX, e.clientY, e.movementX * 10, -e.movementY * 10, { r: 0.2, g: 0.4, b: 1.0 });
    };
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      splat(t.clientX, t.clientY, 10, 10, { r: 0.2, g: 0.4, b: 1.0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="fluid" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -10, opacity: 0.6 }} />

      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.png" alt="RAG AI Assistant Logo" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
            <span style={{ fontWeight: 600, letterSpacing: '-0.025em', fontSize: '0.875rem' }}>RAG AI ASSISTANT</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" style={{ transition: 'color 0.2s', color: '#a3a3a3' }} className="hover:text-white">Features</a>
            <a href="#how-it-works" style={{ transition: 'color 0.2s', color: '#a3a3a3' }} className="hover:text-white">How It Works</a>
            <a href="#about" style={{ transition: 'color 0.2s', color: '#a3a3a3' }} className="hover:text-white">About</a>
            <a href="#use-cases" style={{ transition: 'color 0.2s', color: '#a3a3a3' }} className="hover:text-white">Use Cases</a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#a3a3a3', transition: 'color 0.2s' }} className="hover:text-white">
              Login
            </Link>
            <Link href="/auth/signup" className="shiny-cta" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Sign Up
            </Link>
          </div>
          <button className="md:hidden" style={{ color: '#a3a3a3' }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>
        {isMenuOpen && (
          <div id="mobile-menu" style={{ position: 'absolute', top: '4rem', left: 0, width: '100%', background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="#features" style={{ color: '#a3a3a3' }} onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" style={{ color: '#a3a3a3' }} onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <a href="#use-cases" style={{ color: '#a3a3a3' }} onClick={() => setIsMenuOpen(false)}>Use Cases</a>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/auth/login" style={{ color: '#a3a3a3' }} onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link href="/auth/signup" style={{ color: '#60a5fa', fontWeight: 500 }} onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section style={{ position: 'relative', padding: '10rem 1.5rem 5rem', textAlign: 'center' }} className="md:pt-48 md:pb-32">
          <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '2rem' }}>
              <span style={{ position: 'relative', display: 'flex', height: '0.5rem', width: '0.5rem' }}>
                <span className="animate-ping" style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '9999px', background: '#60a5fa', opacity: 0.75 }}></span>
                <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '9999px', height: '0.5rem', width: '0.5rem', background: '#3b82f6' }}></span>
              </span>
              POWERED BY AI
            </div>

            <h1 style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.1, marginBottom: '1.5rem' }} className="md:text-7xl">
              Upload Documents. <br />
              <span style={{ color: '#525252' }}>Ask Anything.</span>
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#a3a3a3', maxWidth: '42rem', margin: '0 auto 2rem', lineHeight: 1.75 }} className="md:text-xl">
              Transform your documents into an intelligent knowledge base. Upload PDFs, ask questions in natural language, and get accurate answers instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', paddingTop: '1rem' }} className="md:flex-row">
              <Link href="/documents">
                <button className="shiny-cta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Start Uploading Documents
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </span>
                </button>
              </Link>
              <a href="#how-it-works" style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d4', fontWeight: 500, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                See How It Works
              </a>
            </div>

            <div style={{ paddingTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '3rem', maxWidth: '48rem', marginLeft: 'auto', marginRight: 'auto' }} className="md:grid-cols-4">
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>⚡ Fast</p>
                <p style={{ fontSize: '0.75rem', color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Response Time</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>📄 PDF</p>
                <p style={{ fontSize: '0.75rem', color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Document Support</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>🔒 Private</p>
                <p style={{ fontSize: '0.75rem', color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Your Data</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>🤖 GPT-4</p>
                <p style={{ fontSize: '0.75rem', color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Powered AI</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" style={{ padding: '6rem 1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: '1rem' }} className="md:text-4xl">Core Features</h2>
            <p style={{ color: '#a3a3a3', maxWidth: '32rem' }}>Everything you need to turn your documents into an intelligent assistant.</p>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }} className="md:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '0.75rem', transition: 'all 0.3s' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '1.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.75rem' }}>PDF Upload</h3>
              <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.625, marginBottom: '1rem' }}>
                Upload multiple PDF documents at once. We extract and index the content for intelligent querying.
              </p>
              <ul style={{ fontSize: '0.75rem', color: '#525252', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#22c55e' }}>✓</span> Multiple file upload</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#22c55e' }}>✓</span> Automatic text extraction</li>
              </ul>
            </div>

            <div className="glass-card" style={{ padding: '2rem', borderRadius: '0.75rem', transition: 'all 0.3s' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', marginBottom: '1.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.75rem' }}>Natural Language Chat</h3>
              <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.625, marginBottom: '1rem' }}>
                Ask questions in plain English. Our AI understands context and provides accurate, sourced answers.
              </p>
              <ul style={{ fontSize: '0.75rem', color: '#525252', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#22c55e' }}>✓</span> Context-aware responses</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#22c55e' }}>✓</span> Source attribution</li>
              </ul>
            </div>

            <div className="glass-card" style={{ padding: '2rem', borderRadius: '0.75rem', transition: 'all 0.3s' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', marginBottom: '1.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.75rem' }}>RAG Pipeline</h3>
              <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.625, marginBottom: '1rem' }}>
                Retrieval Augmented Generation ensures answers are grounded in your actual documents, not hallucinations.
              </p>
              <ul style={{ fontSize: '0.75rem', color: '#525252', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#22c55e' }}>✓</span> Vector embeddings</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#22c55e' }}>✓</span> Semantic search</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" style={{ padding: '6rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }} className="md:flex-row">
              <div style={{ width: '100%' }} className="md:w-1/3">
                <h2 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: '1.5rem' }} className="md:text-4xl">How It Works</h2>
                <p style={{ color: '#a3a3a3', marginBottom: '2rem' }}>Three simple steps to unlock the knowledge in your documents.</p>
                <Link href="/documents">
                  <button style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: '#fff', color: '#000', fontWeight: 500, fontSize: '0.875rem', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                    Get Started Now
                  </button>
                </Link>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="md:w-2/3">
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>1</div>
                    <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>
                  </div>
                  <div style={{ paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#fff', marginBottom: '0.5rem' }}>Upload Your Documents</h3>
                    <p style={{ color: '#a3a3a3', fontSize: '0.875rem' }}>Drag and drop your PDF files. We process and chunk them into searchable segments using advanced AI.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: '#171717', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>2</div>
                    <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>
                  </div>
                  <div style={{ paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#fff', marginBottom: '0.5rem' }}>AI Processes Content</h3>
                    <p style={{ color: '#a3a3a3', fontSize: '0.875rem' }}>Our system creates embeddings and indexes your content in a vector database for lightning-fast semantic search.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: '#171717', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>3</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#fff', marginBottom: '0.5rem' }}>Ask Questions</h3>
                    <p style={{ color: '#a3a3a3', fontSize: '0.875rem' }}>Chat naturally with your documents. Get accurate answers with references to the source material.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" style={{ background: 'linear-gradient(to bottom, #000, rgba(23,23,23,0.5))', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6rem 0' }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', gap: '3rem' }} className="flex-col items-center md:flex-row md:items-start">
              <div className="flex-shrink-0">
                <div style={{ position: 'relative', width: '16rem', height: '16rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', transition: 'filter 0.7s' }} className="group">
                  <img src="/kunal.jpg" alt="Kunal Kumar Gupta" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'filter 0.5s' }} />
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md:w-2/3">
                <h2 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>I'm Kunal Kumar Gupta.</h2>
                <h3 style={{ fontSize: '1.25rem', color: '#a3a3a3', fontWeight: 500 }}>Mathematics & Computing Student | AI Enthusiast</h3>
                <p style={{ color: '#a3a3a3', lineHeight: 1.75 }}>
                  I love building real-world AI products, especially those that combine modern web technologies with intelligent, context-aware systems like RAG (Retrieval-Augmented Generation).
                </p>
                <p style={{ color: '#a3a3a3', lineHeight: 1.75 }}>
                  This project is a step toward my bigger goal: creating scalable AI SaaS platforms that help businesses and institutions automate knowledge delivery and support using their own data.
                </p>
                <div style={{ paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <a href="https://www.linkedin.com/in/kunal-kumar-gupta-41bab327a/" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', transition: 'color 0.2s' }} className="hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg></a>
                  <a href="https://github.com/bytebender77" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', transition: 'color 0.2s' }} className="hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" style={{ padding: '8rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,58,138,0.1)', filter: 'blur(48px)', borderRadius: '9999px', zIndex: -1, transform: 'scale(0.5)' }}></div>

          <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#fff', marginBottom: '1.5rem' }} className="md:text-5xl">
              Ready to unlock your documents?
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#a3a3a3', marginBottom: '2rem' }}>
              Stop searching through endless pages. Let AI find the answers for you in seconds.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
              <Link href="/documents">
                <button className="shiny-cta">
                  <span>Start Uploading Now</span>
                </button>
              </Link>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#404040', marginTop: '2rem' }}>Free to use. No credit card required.</p>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 0', background: '#000' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }} className="md:flex-row">
          <div style={{ fontSize: '0.875rem', color: '#525252' }}>
            © 2025 RAG AI Assistant. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', fontWeight: 500, color: '#a3a3a3' }}>
            <Link href="/documents" style={{ transition: 'color 0.2s', color: '#a3a3a3' }} className="hover:text-white">Upload</Link>
            <Link href="/chat" style={{ transition: 'color 0.2s', color: '#a3a3a3' }} className="hover:text-white">Chat</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
