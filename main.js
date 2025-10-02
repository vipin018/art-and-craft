import * as THREE from 'three';

/**
 * This is colored version for the fluid simulation
 */
// window.onload = function() {
//     let camera, scene, renderer;
//     let mesh;
//     let rtDensityA, rtDensityB;
//     let rtVelocityA, rtVelocityB;
//     let rtDivergence, rtPressureA, rtPressureB;
//     let matSplatDensity, matSplatVelocity, matAdvect, matDisplay, matDivergence, matPressure, matSubtractGradient;
//     let mouse = new THREE.Vector2(0.5, 0.5);
//     let lastMouse = new THREE.Vector2(0.5, 0.5);
//     let dissipation = 0.98;
//     let splatRadius = 0.025;

//     init();
//     animate();

//     function init() {
//         camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
//         scene = new THREE.Scene();
//         renderer = new THREE.WebGLRenderer({ antialias: true });
//         renderer.setSize(window.innerWidth, window.innerHeight);
//         document.body.appendChild(renderer.domElement);

//         const size = 512;
//         const rtOptions = {
//             minFilter: THREE.LinearFilter,
//             magFilter: THREE.LinearFilter,
//             format: THREE.RGBAFormat,
//             type: THREE.FloatType
//         };

//         rtDensityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtDensityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtVelocityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtVelocityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtDivergence = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtPressureA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtPressureB = new THREE.WebGLRenderTarget(size, size, rtOptions);

//         renderer.setRenderTarget(rtDensityA);
//         renderer.clearColor(new THREE.Color(0, 0, 0), 0);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(rtVelocityA);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(rtPressureA);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(null);

//         const geometry = new THREE.PlaneGeometry(2, 2);

//         matSplatDensity = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uPoint: { value: new THREE.Vector2() },
//                 uColor: { value: new THREE.Vector3() },
//                 uRadius: { value: splatRadius }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uPoint;
//                 uniform vec3 uColor;
//                 uniform float uRadius;
//                 varying vec2 vUv;
//                 void main() {
//                     vec4 base = texture2D(uTexture, vUv);
//                     vec2 p = vUv - uPoint;
//                     float d = length(p);
//                     float expVal = exp(- (d * d) / (uRadius * uRadius));
//                     vec3 splat = expVal * uColor * 0.5;
//                     gl_FragColor = vec4(base.rgb + splat, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matSplatVelocity = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uPoint: { value: new THREE.Vector2() },
//                 uForce: { value: new THREE.Vector2() },
//                 uRadius: { value: splatRadius }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uPoint;
//                 uniform vec2 uForce;
//                 uniform float uRadius;
//                 varying vec2 vUv;
//                 void main() {
//                     vec4 base = texture2D(uTexture, vUv);
//                     vec2 p = vUv - uPoint;
//                     float d = length(p);
//                     float expVal = exp(- (d * d) / (uRadius * uRadius));
//                     vec2 splat = expVal * uForce;
//                     vec2 result = base.rg + splat;
//                     float len = length(result);
//                     if (len > 1.0) result = result / len;
//                     gl_FragColor = vec4(result, base.ba);
//                 }
//             `,
//             depthTest: false
//         });

//         matDivergence = new THREE.ShaderMaterial({
//             uniforms: {
//                 uVelocityTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uVelocityTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     vec2 right = texture2D(uVelocityTexture, vUv + vec2(texel.x, 0.0)).rg;
//                     vec2 left = texture2D(uVelocityTexture, vUv - vec2(texel.x, 0.0)).rg;
//                     vec2 up = texture2D(uVelocityTexture, vUv + vec2(0.0, texel.y)).rg;
//                     vec2 down = texture2D(uVelocityTexture, vUv - vec2(0.0, texel.y)).rg;
//                     float div = 0.5 * ((right.x - left.x) + (up.y - down.y));
//                     gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matPressure = new THREE.ShaderMaterial({
//             uniforms: {
//                 uPressureTexture: { value: null },
//                 uDivergenceTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uPressureTexture;
//                 uniform sampler2D uDivergenceTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
//                     float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
//                     float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
//                     float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
//                     float div = texture2D(uDivergenceTexture, vUv).r;
//                     float pressure = (right + left + up + down - div) * 0.25;
//                     gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matSubtractGradient = new THREE.ShaderMaterial({
//             uniforms: {
//                 uVelocityTexture: { value: null },
//                 uPressureTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uVelocityTexture;
//                 uniform sampler2D uPressureTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
//                     float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
//                     float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
//                     float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
//                     vec2 vel = texture2D(uVelocityTexture, vUv).rg;
//                     vec2 grad = 0.5 * vec2(right - left, up - down);
//                     gl_FragColor = vec4(vel - grad, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matAdvect = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uVelocityTexture: { value: null },
//                 uDt: { value: 0.016 },
//                 uDissipation: { value: dissipation },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform sampler2D uVelocityTexture;
//                 uniform float uDt;
//                 uniform float uDissipation;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 vel = texture2D(uVelocityTexture, vUv).rg;
//                     vec2 offset = (vel / uResolution) * uDt;
//                     vec2 backUv = clamp(vUv - offset, 0.0, 1.0);
//                     vec4 color = texture2D(uTexture, backUv);
//                     gl_FragColor = color * uDissipation;
//                 }
//             `,
//             depthTest: false
//         });

//         matDisplay = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec3 dens = texture2D(uTexture, vUv).rgb;
//                     vec2 texel = 1.0 / uResolution;
//                     vec3 bloom = vec3(0.0);
//                     for (int i = -2; i <= 2; i++) {
//                         for (int j = -2; j <= 2; j++) {
//                             vec2 offset = vec2(float(i), float(j)) * texel * 2.0;
//                             bloom += texture2D(uTexture, vUv + offset).rgb * 0.04;
//                         }
//                     }
//                     vec3 color = 0.6 + 0.4 * sin(dens * 6.28 + vec3(0.0, 2.0, 4.0));
//                     color += bloom * 0.3;
//                     gl_FragColor = vec4(color, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         mesh = new THREE.Mesh(geometry, matDisplay);
//         scene.add(mesh);

//         renderer.domElement.addEventListener('mousemove', (e) => {
//             mouse.x = (e.clientX / window.innerWidth);
//             mouse.y = 1.0 - (e.clientY / window.innerHeight);
//         });

//         document.getElementById('dissipation').addEventListener('input', (e) => {
//             dissipation = parseFloat(e.target.value);
//         });
//         document.getElementById('radius').addEventListener('input', (e) => {
//             splatRadius = parseFloat(e.target.value);
//         });

//         window.addEventListener('resize', () => {
//             renderer.setSize(window.innerWidth, window.innerHeight);
//         });
//     }

//     function animate() {
//         requestAnimationFrame(animate);

//         const dt = 0.016;

//         // Apply splat effect on mouse movement (hover)
//         const dx = (mouse.x - lastMouse.x) * 20.0;
//         const dy = (mouse.y - lastMouse.y) * 20.0;
//         const force = new THREE.Vector2(dx, dy);
//         const forceLen = force.length();
//         if (forceLen > 0.01) { // Only apply if mouse moved significantly
//             if (forceLen > 1.0) force.multiplyScalar(1.0 / forceLen);

//             const hue = Math.random() * 6.28;
//             const color = new THREE.Vector3(
//                 Math.sin(hue) * 0.3 + 0.7,
//                 Math.sin(hue + 2.1) * 0.3 + 0.7,
//                 Math.sin(hue + 4.2) * 0.3 + 0.7
//             );

//             matSplatVelocity.uniforms.uTexture.value = rtVelocityA.texture;
//             matSplatVelocity.uniforms.uPoint.value = mouse;
//             matSplatVelocity.uniforms.uForce.value = force;
//             matSplatVelocity.uniforms.uRadius.value = splatRadius;
//             mesh.material = matSplatVelocity;
//             renderer.setRenderTarget(rtVelocityB);
//             renderer.render(scene, camera);
//             [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//             matSplatDensity.uniforms.uTexture.value = rtDensityA.texture;
//             matSplatDensity.uniforms.uPoint.value = mouse;
//             matSplatDensity.uniforms.uColor.value = color;
//             matSplatDensity.uniforms.uRadius.value = splatRadius;
//             mesh.material = matSplatDensity;
//             renderer.setRenderTarget(rtDensityB);
//             renderer.render(scene, camera);
//             [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];
//         }

//         matAdvect.uniforms.uTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uDt.value = dt;
//         matAdvect.uniforms.uDissipation.value = dissipation;
//         mesh.material = matAdvect;
//         renderer.setRenderTarget(rtVelocityB);
//         renderer.render(scene, camera);
//         [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//         matDivergence.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         mesh.material = matDivergence;
//         renderer.setRenderTarget(rtDivergence);
//         renderer.render(scene, camera);

//         for (let i = 0; i < 20; i++) {
//             matPressure.uniforms.uPressureTexture.value = rtPressureA.texture;
//             matPressure.uniforms.uDivergenceTexture.value = rtDivergence.texture;
//             mesh.material = matPressure;
//             renderer.setRenderTarget(rtPressureB);
//             renderer.render(scene, camera);
//             [rtPressureA, rtPressureB] = [rtPressureB, rtPressureA];
//         }

//         matSubtractGradient.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matSubtractGradient.uniforms.uPressureTexture.value = rtPressureA.texture;
//         mesh.material = matSubtractGradient;
//         renderer.setRenderTarget(rtVelocityB);
//         renderer.render(scene, camera);
//         [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//         matAdvect.uniforms.uTexture.value = rtDensityA.texture;
//         matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uDt.value = dt;
//         matAdvect.uniforms.uDissipation.value = dissipation;
//         mesh.material = matAdvect;
//         renderer.setRenderTarget(rtDensityB);
//         renderer.render(scene, camera);
//         [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];

//         matDisplay.uniforms.uTexture.value = rtDensityA.texture;
//         mesh.material = matDisplay;
//         renderer.setRenderTarget(null);
//         renderer.render(scene, camera);

//         lastMouse.copy(mouse);
//     }
// };


/**
 * This is bnw version of it 
 */

// window.onload = function() {
//     let camera, scene, renderer;
//     let mesh;
//     let rtDensityA, rtDensityB;
//     let rtVelocityA, rtVelocityB;
//     let rtDivergence, rtPressureA, rtPressureB;
//     let matSplatDensity, matSplatVelocity, matAdvect, matDisplay, matDivergence, matPressure, matSubtractGradient;
//     let mouse = new THREE.Vector2(0.5, 0.5);
//     let lastMouse = new THREE.Vector2(0.5, 0.5);
//     let dissipation = 0.98;
//     let splatRadius = 0.035; // Slightly larger for smoke-like effect

//     init();
//     animate();

//     function init() {
//         camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
//         scene = new THREE.Scene();
//         renderer = new THREE.WebGLRenderer({ antialias: true });
//         renderer.setSize(window.innerWidth, window.innerHeight);
//         renderer.setClearColor(new THREE.Color(0, 0, 0), 1); // Black background
//         document.body.appendChild(renderer.domElement);

//         const size = 512;
//         const rtOptions = {
//             minFilter: THREE.LinearFilter,
//             magFilter: THREE.LinearFilter,
//             format: THREE.RGBAFormat,
//             type: THREE.FloatType
//         };

//         rtDensityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtDensityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtVelocityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtVelocityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtDivergence = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtPressureA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtPressureB = new THREE.WebGLRenderTarget(size, size, rtOptions);

//         renderer.setRenderTarget(rtDensityA);
//         renderer.clearColor(new THREE.Color(0, 0, 0), 0);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(rtVelocityA);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(rtPressureA);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(null);

//         const geometry = new THREE.PlaneGeometry(2, 2);

//         matSplatDensity = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uPoint: { value: new THREE.Vector2() },
//                 uColor: { value: new THREE.Vector3() },
//                 uRadius: { value: splatRadius }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uPoint;
//                 uniform vec3 uColor;
//                 uniform float uRadius;
//                 varying vec2 vUv;
//                 void main() {
//                     vec4 base = texture2D(uTexture, vUv);
//                     vec2 p = vUv - uPoint;
//                     float d = length(p);
//                     float expVal = exp(- (d * d) / (uRadius * uRadius));
//                     vec3 splat = expVal * uColor * 0.3; // Lower intensity for smoky effect
//                     gl_FragColor = vec4(base.rgb + splat, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matSplatVelocity = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uPoint: { value: new THREE.Vector2() },
//                 uForce: { value: new THREE.Vector2() },
//                 uRadius: { value: splatRadius }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uPoint;
//                 uniform vec2 uForce;
//                 uniform float uRadius;
//                 varying vec2 vUv;
//                 void main() {
//                     vec4 base = texture2D(uTexture, vUv);
//                     vec2 p = vUv - uPoint;
//                     float d = length(p);
//                     float expVal = exp(- (d * d) / (uRadius * uRadius));
//                     vec2 splat = expVal * uForce;
//                     vec2 result = base.rg + splat;
//                     float len = length(result);
//                     if (len > 1.0) result = result / len;
//                     gl_FragColor = vec4(result, base.ba);
//                 }
//             `,
//             depthTest: false
//         });

//         matDivergence = new THREE.ShaderMaterial({
//             uniforms: {
//                 uVelocityTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uVelocityTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     vec2 right = texture2D(uVelocityTexture, vUv + vec2(texel.x, 0.0)).rg;
//                     vec2 left = texture2D(uVelocityTexture, vUv - vec2(texel.x, 0.0)).rg;
//                     vec2 up = texture2D(uVelocityTexture, vUv + vec2(0.0, texel.y)).rg;
//                     vec2 down = texture2D(uVelocityTexture, vUv - vec2(0.0, texel.y)).rg;
//                     float div = 0.5 * ((right.x - left.x) + (up.y - down.y));
//                     gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matPressure = new THREE.ShaderMaterial({
//             uniforms: {
//                 uPressureTexture: { value: null },
//                 uDivergenceTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uPressureTexture;
//                 uniform sampler2D uDivergenceTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
//                     float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
//                     float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
//                     float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
//                     float div = texture2D(uDivergenceTexture, vUv).r;
//                     float pressure = (right + left + up + down - div) * 0.25;
//                     gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matSubtractGradient = new THREE.ShaderMaterial({
//             uniforms: {
//                 uVelocityTexture: { value: null },
//                 uPressureTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uVelocityTexture;
//                 uniform sampler2D uPressureTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
//                     float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
//                     float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
//                     float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
//                     vec2 vel = texture2D(uVelocityTexture, vUv).rg;
//                     vec2 grad = 0.5 * vec2(right - left, up - down);
//                     gl_FragColor = vec4(vel - grad, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matAdvect = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uVelocityTexture: { value: null },
//                 uDt: { value: 0.016 },
//                 uDissipation: { value: dissipation },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform sampler2D uVelocityTexture;
//                 uniform float uDt;
//                 uniform float uDissipation;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 vel = texture2D(uVelocityTexture, vUv).rg;
//                     vec2 offset = (vel / uResolution) * uDt;
//                     vec2 backUv = clamp(vUv - offset, 0.0, 1.0);
//                     vec4 color = texture2D(uTexture, backUv);
//                     gl_FragColor = color * uDissipation;
//                 }
//             `,
//             depthTest: false
//         });

//         matDisplay = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec3 dens = texture2D(uTexture, vUv).rgb;
//                     vec2 texel = 1.0 / uResolution;
//                     vec3 bloom = vec3(0.0);
//                     for (int i = -2; i <= 2; i++) {
//                         for (int j = -2; j <= 2; j++) {
//                             vec2 offset = vec2(float(i), float(j)) * texel * 2.0;
//                             bloom += texture2D(uTexture, vUv + offset).rgb * 0.04;
//                         }
//                     }
//                     float intensity = dot(dens, vec3(0.333)); // Grayscale for smoke
//                     vec3 color = vec3(intensity * 1.2 + bloom * 0.4); // Enhance brightness
//                     gl_FragColor = vec4(color, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         mesh = new THREE.Mesh(geometry, matDisplay);
//         scene.add(mesh);

//         renderer.domElement.addEventListener('mousemove', (e) => {
//             mouse.x = (e.clientX / window.innerWidth);
//             mouse.y = 1.0 - (e.clientY / window.innerHeight);
//         });

//         document.getElementById('dissipation').addEventListener('input', (e) => {
//             dissipation = parseFloat(e.target.value);
//         });
//         document.getElementById('radius').addEventListener('input', (e) => {
//             splatRadius = parseFloat(e.target.value);
//         });

//         window.addEventListener('resize', () => {
//             renderer.setSize(window.innerWidth, window.innerHeight);
//         });
//     }

//     function animate() {
//         requestAnimationFrame(animate);

//         const dt = 0.016;

//         // Apply splat effect on mouse movement (hover)
//         const dx = (mouse.x - lastMouse.x) * 20.0;
//         const dy = (mouse.y - lastMouse.y) * 20.0;
//         const force = new THREE.Vector2(dx, dy);
//         const forceLen = force.length();
//         if (forceLen > 0.01) { // Only apply if mouse moved significantly
//             if (forceLen > 1.0) force.multiplyScalar(1.0 / forceLen);

//             const color = new THREE.Vector3(1.0, 1.0, 1.0); // White for smoke effect

//             matSplatVelocity.uniforms.uTexture.value = rtVelocityA.texture;
//             matSplatVelocity.uniforms.uPoint.value = mouse;
//             matSplatVelocity.uniforms.uForce.value = force;
//             matSplatVelocity.uniforms.uRadius.value = splatRadius;
//             mesh.material = matSplatVelocity;
//             renderer.setRenderTarget(rtVelocityB);
//             renderer.render(scene, camera);
//             [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//             matSplatDensity.uniforms.uTexture.value = rtDensityA.texture;
//             matSplatDensity.uniforms.uPoint.value = mouse;
//             matSplatDensity.uniforms.uColor.value = color;
//             matSplatDensity.uniforms.uRadius.value = splatRadius;
//             mesh.material = matSplatDensity;
//             renderer.setRenderTarget(rtDensityB);
//             renderer.render(scene, camera);
//             [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];
//         }

//         matAdvect.uniforms.uTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uDt.value = dt;
//         matAdvect.uniforms.uDissipation.value = dissipation;
//         mesh.material = matAdvect;
//         renderer.setRenderTarget(rtVelocityB);
//         renderer.render(scene, camera);
//         [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//         matDivergence.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         mesh.material = matDivergence;
//         renderer.setRenderTarget(rtDivergence);
//         renderer.render(scene, camera);

//         for (let i = 0; i < 20; i++) {
//             matPressure.uniforms.uPressureTexture.value = rtPressureA.texture;
//             matPressure.uniforms.uDivergenceTexture.value = rtDivergence.texture;
//             mesh.material = matPressure;
//             renderer.setRenderTarget(rtPressureB);
//             renderer.render(scene, camera);
//             [rtPressureA, rtPressureB] = [rtPressureB, rtPressureA];
//         }

//         matSubtractGradient.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matSubtractGradient.uniforms.uPressureTexture.value = rtPressureA.texture;
//         mesh.material = matSubtractGradient;
//         renderer.setRenderTarget(rtVelocityB);
//         renderer.render(scene, camera);
//         [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//         matAdvect.uniforms.uTexture.value = rtDensityA.texture;
//         matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uDt.value = dt;
//         matAdvect.uniforms.uDissipation.value = dissipation;
//         mesh.material = matAdvect;
//         renderer.setRenderTarget(rtDensityB);
//         renderer.render(scene, camera);
//         [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];

//         matDisplay.uniforms.uTexture.value = rtDensityA.texture;
//         mesh.material = matDisplay;
//         renderer.setRenderTarget(null);
//         renderer.render(scene, camera);

//         lastMouse.copy(mouse);
//     }
// };

/**
 * This is some waterish effect
 */
// window.onload = function() {

//     let camera, scene, renderer;
//     let mesh;
//     let rtDensityA, rtDensityB;
//     let rtVelocityA, rtVelocityB;
//     let rtDivergence, rtPressureA, rtPressureB;
//     let matSplatDensity, matSplatVelocity, matAdvect, matDisplay, matDivergence, matPressure, matSubtractGradient;
//     let mouse = new THREE.Vector2(0.5, 0.5);
//     let lastMouse = new THREE.Vector2(0.5, 0.5);
//     let dissipation = 0.995;
//     let splatRadius = 0.025;

//     init();
//     animate();

//     function init() {
//         camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
//         scene = new THREE.Scene();
//         renderer = new THREE.WebGLRenderer({ antialias: true });
//         renderer.setSize(window.innerWidth, window.innerHeight);
//         renderer.setClearColor(new THREE.Color(0, 0, 0), 1); // Black background
//         document.body.appendChild(renderer.domElement);

//         const size = 512;
//         const rtOptions = {
//             minFilter: THREE.LinearFilter,
//             magFilter: THREE.LinearFilter,
//             format: THREE.RGBAFormat,
//             type: THREE.FloatType
//         };

//         rtDensityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtDensityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtVelocityA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtVelocityB = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtDivergence = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtPressureA = new THREE.WebGLRenderTarget(size, size, rtOptions);
//         rtPressureB = new THREE.WebGLRenderTarget(size, size, rtOptions);

//         renderer.setRenderTarget(rtDensityA);
//         renderer.clearColor(new THREE.Color(0, 0, 0), 0);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(rtVelocityA);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(rtPressureA);
//         renderer.clear(true, true);
//         renderer.setRenderTarget(null);

//         const geometry = new THREE.PlaneGeometry(2, 2);

//         matSplatDensity = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uPoint: { value: new THREE.Vector2() },
//                 uColor: { value: new THREE.Vector3() },
//                 uRadius: { value: splatRadius }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uPoint;
//                 uniform vec3 uColor;
//                 uniform float uRadius;
//                 varying vec2 vUv;
//                 void main() {
//                     vec4 base = texture2D(uTexture, vUv);
//                     vec2 p = vUv - uPoint;
//                     float d = length(p);
//                     float expVal = exp(- (d * d) / (uRadius * uRadius));
//                     vec3 splat = expVal * uColor * 0.1;
//                     gl_FragColor = vec4(base.rgb + splat, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matSplatVelocity = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uPoint: { value: new THREE.Vector2() },
//                 uForce: { value: new THREE.Vector2() },
//                 uRadius: { value: splatRadius }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uPoint;
//                 uniform vec2 uForce;
//                 uniform float uRadius;
//                 varying vec2 vUv;
//                 void main() {
//                     vec4 base = texture2D(uTexture, vUv);
//                     vec2 p = vUv - uPoint;
//                     float d = length(p);
//                     float expVal = exp(- (d * d) / (uRadius * uRadius));
//                     vec2 dir = p / (d + 1e-5);
//                     vec2 splat = expVal * dir * length(uForce);
//                     vec2 result = base.rg + splat;
//                     float len = length(result);
//                     if (len > 1.0) result = result / len;
//                     gl_FragColor = vec4(result, base.ba);
//                 }
//             `,
//             depthTest: false
//         });

//         matDivergence = new THREE.ShaderMaterial({
//             uniforms: {
//                 uVelocityTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uVelocityTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     vec2 right = texture2D(uVelocityTexture, vUv + vec2(texel.x, 0.0)).rg;
//                     vec2 left = texture2D(uVelocityTexture, vUv - vec2(texel.x, 0.0)).rg;
//                     vec2 up = texture2D(uVelocityTexture, vUv + vec2(0.0, texel.y)).rg;
//                     vec2 down = texture2D(uVelocityTexture, vUv - vec2(0.0, texel.y)).rg;
//                     float div = 0.5 * ((right.x - left.x) + (up.y - down.y));
//                     gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matPressure = new THREE.ShaderMaterial({
//             uniforms: {
//                 uPressureTexture: { value: null },
//                 uDivergenceTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uPressureTexture;
//                 uniform sampler2D uDivergenceTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
//                     float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
//                     float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
//                     float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
//                     float div = texture2D(uDivergenceTexture, vUv).r;
//                     float pressure = (right + left + up + down - div) * 0.25;
//                     gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matSubtractGradient = new THREE.ShaderMaterial({
//             uniforms: {
//                 uVelocityTexture: { value: null },
//                 uPressureTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uVelocityTexture;
//                 uniform sampler2D uPressureTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     float right = texture2D(uPressureTexture, vUv + vec2(texel.x, 0.0)).r;
//                     float left = texture2D(uPressureTexture, vUv - vec2(texel.x, 0.0)).r;
//                     float up = texture2D(uPressureTexture, vUv + vec2(0.0, texel.y)).r;
//                     float down = texture2D(uPressureTexture, vUv - vec2(0.0, texel.y)).r;
//                     vec2 vel = texture2D(uVelocityTexture, vUv).rg;
//                     vec2 grad = 0.5 * vec2(right - left, up - down);
//                     gl_FragColor = vec4(vel - grad, 0.0, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         matAdvect = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uVelocityTexture: { value: null },
//                 uDt: { value: 0.016 },
//                 uDissipation: { value: dissipation },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform sampler2D uVelocityTexture;
//                 uniform float uDt;
//                 uniform float uDissipation;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 vel = texture2D(uVelocityTexture, vUv).rg;
//                     vec2 offset = (vel / uResolution) * uDt;
//                     vec2 backUv = clamp(vUv - offset, 0.0, 1.0);
//                     vec4 color = texture2D(uTexture, backUv);
//                     gl_FragColor = color * uDissipation;
//                 }
//             `,
//             depthTest: false
//         });

//         matDisplay = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: null },
//                 uResolution: { value: new THREE.Vector2(size, size) }
//             },
//             vertexShader: `
//                 varying vec2 vUv;
//                 void main() {
//                     vUv = uv;
//                     gl_Position = vec4(position, 1.0);
//                 }
//             `,
//             fragmentShader: `
//                 uniform sampler2D uTexture;
//                 uniform vec2 uResolution;
//                 varying vec2 vUv;
//                 void main() {
//                     vec2 texel = 1.0 / uResolution;
//                     vec3 dens = texture2D(uTexture, vUv).rgb;
//                     float h = dot(dens, vec3(0.333));
//                     float hLeft = dot(texture2D(uTexture, vUv - vec2(texel.x, 0)).rgb, vec3(0.333));
//                     float hRight = dot(texture2D(uTexture, vUv + vec2(texel.x, 0)).rgb, vec3(0.333));
//                     float hDown = dot(texture2D(uTexture, vUv - vec2(0, texel.y)).rgb, vec3(0.333));
//                     float hUp = dot(texture2D(uTexture, vUv + vec2(0, texel.y)).rgb, vec3(0.333));
//                     float dx = (hRight - hLeft) * uResolution.x * 0.5;
//                     float dy = (hUp - hDown) * uResolution.y * 0.5;
//                     vec3 normal = normalize(vec3(dx, dy, 1.0));
//                     vec3 light = normalize(vec3(0.5, 0.5, 1.0));
//                     float diffuse = max(dot(normal, light), 0.0);
//                     float spec = pow(max(dot(normal, light), 0.0), 32.0);
//                     vec3 waterColor = vec3(0.1, 0.2, 0.3);
//                     vec3 color = waterColor * diffuse + vec3(1.0) * spec;
//                     vec3 bloom = vec3(0.0);
//                     for (int i = -2; i <= 2; i++) {
//                         for (int j = -2; j <= 2; j++) {
//                             vec2 offset = vec2(float(i), float(j)) * texel * 2.0;
//                             bloom += texture2D(uTexture, vUv + offset).rgb * 0.05;
//                         }
//                     }
//                     color += bloom * 0.2;
//                     gl_FragColor = vec4(color, 1.0);
//                 }
//             `,
//             depthTest: false
//         });

//         mesh = new THREE.Mesh(geometry, matDisplay);
//         scene.add(mesh);

//         renderer.domElement.addEventListener('mousemove', (e) => {
//             mouse.x = (e.clientX / window.innerWidth);
//             mouse.y = 1.0 - (e.clientY / window.innerHeight);
//         });

//         document.getElementById('dissipation').addEventListener('input', (e) => {
//             dissipation = parseFloat(e.target.value);
//         });
//         document.getElementById('radius').addEventListener('input', (e) => {
//             splatRadius = parseFloat(e.target.value);
//         });

//         window.addEventListener('resize', () => {
//             renderer.setSize(window.innerWidth, window.innerHeight);
//         });
//     }

//     function animate() {
//         requestAnimationFrame(animate);

//         const dt = 0.016;

//         // Apply splat effect on mouse movement (hover)
//         const dx = (mouse.x - lastMouse.x) * 10.0;
//         const dy = (mouse.y - lastMouse.y) * 10.0;
//         const force = new THREE.Vector2(dx, dy);
//         const forceLen = force.length();
//         if (forceLen > 0.01) { // Only apply if mouse moved significantly
//             if (forceLen > 1.0) force.multiplyScalar(1.0 / forceLen);

//             const color = new THREE.Vector3(1.0, 1.0, 1.0); // White for height map

//             matSplatVelocity.uniforms.uTexture.value = rtVelocityA.texture;
//             matSplatVelocity.uniforms.uPoint.value = mouse;
//             matSplatVelocity.uniforms.uForce.value = force;
//             matSplatVelocity.uniforms.uRadius.value = splatRadius;
//             mesh.material = matSplatVelocity;
//             renderer.setRenderTarget(rtVelocityB);
//             renderer.render(scene, camera);
//             [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//             matSplatDensity.uniforms.uTexture.value = rtDensityA.texture;
//             matSplatDensity.uniforms.uPoint.value = mouse;
//             matSplatDensity.uniforms.uColor.value = color;
//             matSplatDensity.uniforms.uRadius.value = splatRadius;
//             mesh.material = matSplatDensity;
//             renderer.setRenderTarget(rtDensityB);
//             renderer.render(scene, camera);
//             [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];
//         }

//         matAdvect.uniforms.uTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uDt.value = dt;
//         matAdvect.uniforms.uDissipation.value = dissipation;
//         mesh.material = matAdvect;
//         renderer.setRenderTarget(rtVelocityB);
//         renderer.render(scene, camera);
//         [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//         matDivergence.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         mesh.material = matDivergence;
//         renderer.setRenderTarget(rtDivergence);
//         renderer.render(scene, camera);

//         for (let i = 0; i < 20; i++) {
//             matPressure.uniforms.uPressureTexture.value = rtPressureA.texture;
//             matPressure.uniforms.uDivergenceTexture.value = rtDivergence.texture;
//             mesh.material = matPressure;
//             renderer.setRenderTarget(rtPressureB);
//             renderer.render(scene, camera);
//             [rtPressureA, rtPressureB] = [rtPressureB, rtPressureA];
//         }

//         matSubtractGradient.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matSubtractGradient.uniforms.uPressureTexture.value = rtPressureA.texture;
//         mesh.material = matSubtractGradient;
//         renderer.setRenderTarget(rtVelocityB);
//         renderer.render(scene, camera);
//         [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

//         matAdvect.uniforms.uTexture.value = rtDensityA.texture;
//         matAdvect.uniforms.uVelocityTexture.value = rtVelocityA.texture;
//         matAdvect.uniforms.uDt.value = dt;
//         matAdvect.uniforms.uDissipation.value = dissipation;
//         mesh.material = matAdvect;
//         renderer.setRenderTarget(rtDensityB);
//         renderer.render(scene, camera);
//         [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];

//         matDisplay.uniforms.uTexture.value = rtDensityA.texture;
//         mesh.material = matDisplay;
//         renderer.setRenderTarget(null);
//         renderer.render(scene, camera);

//         lastMouse.copy(mouse);
//     }
// };

/**
 * This is something real with water effect
 */
  window.onload = function() {
      let camera, scene, renderer;
      let mesh;
      let rtDensityA, rtDensityB;
      let rtVelocityA, rtVelocityB;
      let rtDivergence, rtPressureA, rtPressureB;
      let matSplatDensity, matSplatVelocity, matAdvect, matDisplay, matDivergence, matPressure, matSubtractGradient;
      let mouse = new THREE.Vector2(0.5, 0.5);
      let lastMouse = new THREE.Vector2(0.5, 0.5);
      let dissipation = 0.95; // Higher for longer-lasting ripples
      let splatRadius = 0.02;

      init();
      animate();

      function init() {
          camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          scene = new THREE.Scene();
          renderer = new THREE.WebGLRenderer({ antialias: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setClearColor(new THREE.Color('#FCF4E7'), 1); // Beige background
          document.body.appendChild(renderer.domElement);

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
                                  vec3 waterColor = vec3(0.1, 0.2, 0.3); // Subtle blue-green
                                  vec3 color = waterColor * diffuse + vec3(0.8, 0.9, 1.0) * spec * 0.5;
                                  vec3 bloom = vec3(0.0);
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

          // Apply splat effect on mouse movement (hover)
          const dx = (mouse.x - lastMouse.x) * 10.0; // Reduced for controlled ripples
          const dy = (mouse.y - lastMouse.y) * 10.0;
          const force = new THREE.Vector2(dx, dy);
          const forceLen = force.length();
          if (forceLen > 0.01) { // Only apply if mouse moved significantly
              if (forceLen > 1.0) force.multiplyScalar(1.0 / forceLen);

              const color = new THREE.Vector3(1.0, 1.0, 1.0); // White for height map

              matSplatVelocity.uniforms.uTexture.value = rtVelocityA.texture;
              matSplatVelocity.uniforms.uPoint.value = mouse;
              matSplatVelocity.uniforms.uForce.value = force;
              matSplatVelocity.uniforms.uRadius.value = splatRadius;
              mesh.material = matSplatVelocity;
              renderer.setRenderTarget(rtVelocityB);
              renderer.render(scene, camera);
              [rtVelocityA, rtVelocityB] = [rtVelocityB, rtVelocityA];

              matSplatDensity.uniforms.uTexture.value = rtDensityA.texture;
              matSplatDensity.uniforms.uPoint.value = mouse;
              matSplatDensity.uniforms.uColor.value = color;
              matSplatDensity.uniforms.uRadius.value = splatRadius;
              mesh.material = matSplatDensity;
              renderer.setRenderTarget(rtDensityB);
              renderer.render(scene, camera);
              [rtDensityA, rtDensityB] = [rtDensityB, rtDensityA];
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
  };