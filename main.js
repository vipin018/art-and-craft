import * as THREE from 'three';

window.onload = function () {
  let camera, scene, renderer;
  let mesh;
  let rtDensityA, rtDensityB;
  let rtVelocityA, rtVelocityB;
  let rtDivergence, rtPressureA, rtPressureB;
  let matSplatDensity, matSplatVelocity, matAdvect, matDisplay, matDivergence, matPressure, matSubtractGradient;
  let mouse = new THREE.Vector2(0.5, 0.5);
  let lastMouse = new THREE.Vector2(0.5, 0.5);
  let dissipation = 0.85; // Higher for longer-lasting ripples
  let splatRadius = 0.015;

  init();
  animate();

  function init() {
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); document.body.appendChild(renderer.domElement);

    const size = 512;
    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    };

    rtDensityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
    rtDensityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
    rtVelocityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
    rtVelocityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
    rtDivergence = new THREE.WebGLRenderTarget(size, size, rtOptions);
    rtPressureA = new THREE.WebGLRenderTarget(size, size, rtOptions);
    rtPressureB = new THREE.WebGLRenderTarget(size, size, rtOptions);

    renderer.setRenderTarget(rtDensityA);
    renderer.clearColor(new THREE.Color(0, 0, 0), 0);
    renderer.clear(true, true);
    renderer.setRenderTarget(rtVelocityA);
    renderer.clear(true, true);
    renderer.setRenderTarget(rtPressureA);
    renderer.clear(true, true);
    renderer.setRenderTarget(null);

    const geometry = new THREE.PlaneGeometry(2, 2);

    matSplatDensity = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uPoint: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Vector3() },
        uRadius: { value: splatRadius }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                  uniform sampler2D uTexture;
                  uniform vec2 uPoint;
                  uniform vec3 uColor;
                  uniform float uRadius;
                  varying vec2 vUv;
                  void main() {
                      vec4 base = texture2D(uTexture, vUv);
                      vec2 p = vUv - uPoint;
                      float d = length(p);
                      float expVal = exp(- (d * d) / (uRadius * uRadius));
                      vec3 splat = expVal * uColor * 0.3; // Increased for visible ripples
                      gl_FragColor = vec4(base.rgb + splat, 1.0);
                  }
              `,
      depthTest: false
    });

    matSplatVelocity = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uPoint: { value: new THREE.Vector2() },
        uForce: { value: new THREE.Vector2() },
        uRadius: { value: splatRadius }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                  uniform sampler2D uTexture;
                  uniform vec2 uPoint;
                  uniform vec2 uForce;
                  uniform float uRadius;
                  varying vec2 vUv;
                  void main() {
                      vec4 base = texture2D(uTexture, vUv);
                      vec2 p = vUv - uPoint;
                      float d = length(p);
                      float expVal = exp(- (d * d) / (uRadius * uRadius));
                      vec2 dir = p / (d + 1e-5); // Radial direction for ripple
                      vec2 splat = expVal * dir * length(uForce) * 1.5; // Amplify for stronger ripples
                      vec2 result = base.rg + splat;
                      float len = length(result);
                      if (len > 1.0) result = result / len;
                      gl_FragColor = vec4(result, base.ba);
                  }
              `,
      depthTest: false
    });

    matDivergence = new THREE.ShaderMaterial({
      uniforms: {
        uVelocityTexture: { value: null },
        uResolution: { value: new THREE.Vector2(size, size) }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                  uniform sampler2D uVelocityTexture;
                  uniform vec2 uResolution;
                  varying vec2 vUv;
                  void main() {
                      vec2 texel = 1.0 / uResolution;
                      vec2 right = texture2D(uVelocityTexture, vUv + vec2(texel.x, 0.0)).rg;
                      vec2 left = texture2D(uVelocityTexture, vUv - vec2(texel.x, 0.0)).rg;
                      vec2 up = texture2D(uVelocityTexture, vUv + vec2(0.0, texel.y)).rg;
                      vec2 down = texture2D(uVelocityTexture, vUv - vec2(0.0, texel.y)).rg;
                      float div = 0.5 * ((right.x - left.x) + (up.y - down.y));
                      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
                  }
              `,
      depthTest: false
    });

    matPressure = new THREE.ShaderMaterial({
      uniforms: {
        uPressureTexture: { value: null },
        uDivergenceTexture: { value: null },
        uResolution: { value: new THREE.Vector2(size, size) }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                  uniform sampler2D uPressureTexture;
                  uniform sampler2D uDivergenceTexture;
                  uniform vec2 uResolution;
                  varying vec2 vUv;
                  void main() {
                      vec2 texel = 1.0 / uResolution;
                      float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
                      float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
                      float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
                      float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
                      float div = texture2D(uDivergenceTexture, vUv).r;
                      float pressure = (right + left + up + down - div) * 0.25;
                      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
                  }
              `,
      depthTest: false
    });

    matSubtractGradient = new THREE.ShaderMaterial({
      uniforms: {
        uVelocityTexture: { value: null },
        uPressureTexture: { value: null },
        uResolution: { value: new THREE.Vector2(size, size) }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                  uniform sampler2D uVelocityTexture;
                  uniform sampler2D uPressureTexture;
                  uniform vec2 uResolution;
                  varying vec2 vUv;
                  void main() {
                      vec2 texel = 1.0 / uResolution;
                      float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
                      float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
                      float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
                      float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
                      vec2 vel = texture2D(uVelocityTexture, vUv).rg;
                      vec2 grad = 0.5 * vec2(right - left, up - down);
                      gl_FragColor = vec4(vel - grad, 0.0, 1.0);
                  }
              `,
      depthTest: false
    });

    matAdvect = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uVelocityTexture: { value: null },
        uDt: { value: 0.016 },
        uDissipation: { value: dissipation },
        uResolution: { value: new THREE.Vector2(size, size) }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                  uniform sampler2D uTexture;
                  uniform sampler2D uVelocityTexture;
                  uniform float uDt;
                  uniform float uDissipation;
                  uniform vec2 uResolution;
                  varying vec2 vUv;
                  void main() {
                      vec2 vel = texture2D(uVelocityTexture, vUv).rg;
                      vec2 offset = (vel / uResolution) * uDt;
                      vec2 backUv = clamp(vUv - offset, 0.0, 1.0);
                      vec4 color = texture2D(uTexture, backUv);
                      gl_FragColor = color * uDissipation;
                  }
              `,
      depthTest: false
    });

    matDisplay = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uResolution: { value: new THREE.Vector2(size, size) }
      },
      vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = vec4(position, 1.0);
                  }
              `,
      fragmentShader: `
                              uniform sampler2D uTexture;
                              uniform vec2 uResolution;
                              varying vec2 vUv;
                              void main() {
                                  vec3 dens = texture2D(uTexture, vUv).rgb;
                                  float h = dot(dens, vec3(0.333));
              
                                  if (h < 0.01) {
                                      discard; // Discard the fragment if there is no fluid
                                  }
              
                                  vec2 texel = 1.0 / uResolution;
                                  float hLeft = dot(texture2D(uTexture, vUv - vec2(texel.x, 0)).rgb, vec3(0.333));
                                  float hRight = dot(texture2D(uTexture, vUv + vec2(texel.x, 0)).rgb, vec3(0.333));
                                  float hDown = dot(texture2D(uTexture, vUv - vec2(0, texel.y)).rgb, vec3(0.333));
                                  float hUp = dot(texture2D(uTexture, vUv + vec2(0, texel.y)).rgb, vec3(0.333));
                                  float dx = (hRight - hLeft) * uResolution.x * 0.5;
                                  float dy = (hUp - hDown) * uResolution.y * 0.5;
                                  vec3 normal = normalize(vec3(dx, dy, 1.0));
                                  vec3 light = normalize(vec3(0.5, 0.5, 1.0));
                                  float diffuse = max(dot(normal, light), 0.0);
                                  float spec = pow(max(dot(normal, light), 0.0), 32.0);
                                                      vec3 waterColor = vec3(0.659, 1.0, 0.761);
                                                      vec3 color = waterColor * diffuse + vec3(1.0, 1.0, 1.0) * spec * 0.5;                                  vec3 bloom = vec3(0.0);
                                  for (int i = -2; i <= 2; i++) {
                                      for (int j = -2; j <= 2; j++) {
                                          vec2 offset = vec2(float(i), float(j)) * texel * 2.0;
                                          bloom += texture2D(uTexture, vUv + offset).rgb * 0.05;
                                      }
                                  }
                                  color += bloom * 0.3; // Slightly stronger bloom for shimmer
                                  gl_FragColor = vec4(color, 1.0);
                              }
                          `,
      depthTest: false
    });

    mesh = new THREE.Mesh(geometry, matDisplay);
    scene.add(mesh);

    renderer.domElement.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth);
      mouse.y = 1.0 - (e.clientY / window.innerHeight);
    });

    document.getElementById('dissipation').addEventListener('input', (e) => {
      dissipation = parseFloat(e.target.value);
      console.log('Dissipation:', dissipation);
    });
    document.getElementById('radius').addEventListener('input', (e) => {
      splatRadius = parseFloat(e.target.value);
      console.log('Splat Radius:', splatRadius);
    });

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    const dt = 0.016;

    const dx = (mouse.x - lastMouse.x);
    const dy = (mouse.y - lastMouse.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.001) { // Only apply if mouse moved significantly
      const numSplats = Math.max(Math.floor(distance * 300), 1);
      const stepX = dx / numSplats;
      const stepY = dy / numSplats;

      const force = new THREE.Vector2(dx, dy).multiplyScalar(10.0);
      if (force.length() > 1.0) force.normalize();

      const color = new THREE.Vector3(1.0, 1.0, 1.0); // White for height map

      for (let i = 0; i < numSplats; i++) {
        const point = new THREE.Vector2(lastMouse.x + stepX * i, lastMouse.y + stepY * i);

        matSplatVelocity.uniforms.uTexture.value = rtVelocityA.texture;
        matSplatVelocity.uniforms.uPoint.value = point;
        matSplatVelocity.uniforms.uForce.value = force;
        matSplatVelocity.uniforms.uRadius.value = splatRadius;
        mesh.material = matSplatVelocity;
        renderer.setRenderTarget(rtVelocityB);
        renderer.render(scene, camera);
        [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

        matSplatDensity.uniforms.uTexture.value = rtDensityA.texture;
        matSplatDensity.uniforms.uPoint.value = point;
        matSplatDensity.uniforms.uColor.value = color;
        matSplatDensity.uniforms.uRadius.value = splatRadius;
        mesh.material = matSplatDensity;
        renderer.setRenderTarget(rtDensityB);
        renderer.render(scene, camera);
        [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];
      }
    }
    matAdvect.uniforms.uTexture.value = rtVelocityA.texture;
    matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
    matAdvect.uniforms.uDt.value = dt;
    matAdvect.uniforms.uDissipation.value = dissipation;
    mesh.material = matAdvect;
    renderer.setRenderTarget(rtVelocityB);
    renderer.render(scene, camera);
    [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

    matDivergence.uniforms.uVelocityTexture.value = rtVelocityA.texture;
    mesh.material = matDivergence;
    renderer.setRenderTarget(rtDivergence);
    renderer.render(scene, camera);

    for (let i = 0; i < 20; i++) {
      matPressure.uniforms.uPressureTexture.value = rtPressureA.texture;
      matPressure.uniforms.uDivergenceTexture.value = rtDivergence.texture;
      mesh.material = matPressure;
      renderer.setRenderTarget(rtPressureB);
      renderer.render(scene, camera);
      [rtPressureA, rtPressureB] = [rtPressureB, rtPressureA];
    }

    matSubtractGradient.uniforms.uVelocityTexture.value = rtVelocityA.texture;
    matSubtractGradient.uniforms.uPressureTexture.value = rtPressureA.texture;
    mesh.material = matSubtractGradient;
    renderer.setRenderTarget(rtVelocityB);
    renderer.render(scene, camera);
    [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

    matAdvect.uniforms.uTexture.value = rtDensityA.texture;
    matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
    matAdvect.uniforms.uDt.value = dt;
    matAdvect.uniforms.uDissipation.value = dissipation;
    mesh.material = matAdvect;
    renderer.setRenderTarget(rtDensityB);
    renderer.render(scene, camera);
    [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];

    matDisplay.uniforms.uTexture.value = rtDensityA.texture;
    mesh.material = matDisplay;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    lastMouse.copy(mouse);
  }

  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
      const split = new SplitType(link, { types: 'chars' });
      const chars = split.chars;

      const tl = gsap.timeline({ paused: true });
      tl.to(chars, {
          y: -10,
          opacity: 0,
          stagger: {
              amount: 0.4,
              from: "center",
              grid: "auto",
              ease: "power2.inOut"
          }
      }).to(chars, {
          y: 10,
          opacity: 0,
          duration: 0
      }).to(chars, {
          y: 0,
          opacity: 1,
          stagger: {
              amount: 0.4,
              from: "center",
              grid: "auto",
              ease: "power2.inOut"
          }
      });

      link.addEventListener('mouseenter', () => {
          tl.restart();
      });
  });
};