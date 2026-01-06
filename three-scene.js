import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);

// Scene setup
const container = document.getElementById('model-container');
if (!container) {
    console.warn('Model container not found');
}

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// Renderer - optimized for device
const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    alpha: true,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
});

const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(pixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

if (container) {
    container.appendChild(renderer.domElement);
}

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;
controls.enableRotate = !isMobile; // Disable rotation on mobile to prevent conflicts with swipe
controls.autoRotate = true;
controls.autoRotateSpeed = isMobile ? 1.0 : 1.5;

// Environment map - simplified for mobile
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const envScene = new THREE.Scene();
const envSegments = isMobile ? 16 : 32;
const envGeo = new THREE.SphereGeometry(100, envSegments, envSegments);
const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        topColor: { value: new THREE.Color(0x4a7c9b) },
        bottomColor: { value: new THREE.Color(0x0d1520) },
        offset: { value: 20 },
        exponent: { value: 0.6 }
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
    `
});
envScene.add(new THREE.Mesh(envGeo, envMat));

const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
scene.environment = envMap;

// Lighting - reduced on mobile
const ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 1.0 : 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, isMobile ? 1.5 : 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0x6ba3c7, isMobile ? 1.0 : 1.5);
directionalLight2.position.set(-5, 3, -5);
scene.add(directionalLight2);

if (!isMobile) {
    const frontLight = new THREE.DirectionalLight(0xffffff, 1);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);

    const bottomLight = new THREE.DirectionalLight(0x4a7c9b, 0.8);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);
}

// Load 3D model
const loader = new GLTFLoader();
let model;

loader.load(
    'абстрактная 3d модель.glb',
    (gltf) => {
        model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (isMobile ? 2.0 : 2.5) / maxDim;
        model.scale.setScalar(scale);

        model.position.sub(center.multiplyScalar(scale));

        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x8899aa,
                    metalness: isMobile ? 0.7 : 0.85,
                    roughness: isMobile ? 0.25 : 0.15,
                    envMap: envMap,
                    envMapIntensity: isMobile ? 1.0 : 1.5
                });
            }
        });

        scene.add(model);
        console.log('3D model loaded successfully');
    },
    (progress) => {
        console.log('Loading:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
    },
    (error) => {
        console.error('Error loading model:', error);
    }
);

// Mouse interaction - only on desktop
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

if (!isMobile) {
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });
}

// Animation loop with frame limiting on mobile
let lastTime = 0;
const targetFPS = isMobile ? 30 : 60;
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Frame rate limiting on mobile
    if (isMobile) {
        const deltaTime = currentTime - lastTime;
        if (deltaTime < frameInterval) return;
        lastTime = currentTime - (deltaTime % frameInterval);
    }

    if (!isMobile) {
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        if (model) {
            model.rotation.y += targetX * 0.01;
            model.rotation.x += targetY * 0.005;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}
animate(0);

// Resize handler with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
});

// Visibility change - pause rendering when hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        controls.autoRotate = false;
    } else {
        controls.autoRotate = true;
    }
});
