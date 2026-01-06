import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);

// Wait for DOM and find container
function initCraneScene() {
    const container = document.getElementById('crane-container');
    if (!container) {
        console.warn('Crane container not found');
        return;
    }

    // Skip on very small screens for performance
    if (window.innerWidth < 480) {
        console.log('Crane scene skipped on small screen');
        return;
    }

    const scene = new THREE.Scene();

    // Camera - positioned further back for larger view
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(4, 3, 8);

    // Renderer - optimized for device
    const renderer = new THREE.WebGLRenderer({
        antialias: !isMobile, // Disable antialiasing on mobile for performance
        alpha: true,
        powerPreference: isMobile ? 'low-power' : 'high-performance'
    });

    // Lower resolution on mobile
    const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Controls - disabled for background, just auto-rotate slowly
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    // Environment lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(100, 32, 32);
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x6ba3c7, 1);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    const bottomLight = new THREE.DirectionalLight(0x4a7c9b, 0.5);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);

    // Load crane model
    const loader = new GLTFLoader();
    let model;

    loader.load(
        'ac9b83dc-f597-4cc9-bab6-3a2cab208564.glb',
        (gltf) => {
            model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5.0 / maxDim;
            model.scale.setScalar(scale);

            model.position.sub(center.multiplyScalar(scale));
            model.position.y -= 0.5;

            // Apply metallic material
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xd4a017,
                        metalness: 0.7,
                        roughness: 0.3,
                        envMap: envMap,
                        envMapIntensity: 1.2
                    });
                }
            });

            scene.add(model);
            console.log('Crane model loaded successfully');
        },
        (progress) => {
            console.log('Loading crane:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
        },
        (error) => {
            console.error('Error loading crane model:', error);
        }
    );

    // Animation loop with frame rate limiting on mobile
    let lastTime = 0;
    const targetFPS = isMobile ? 24 : 60;
    const frameInterval = 1000 / targetFPS;
    let isVisible = true;

    function animate(currentTime) {
        requestAnimationFrame(animate);

        if (!isVisible) return;

        // Frame rate limiting
        if (isMobile) {
            const deltaTime = currentTime - lastTime;
            if (deltaTime < frameInterval) return;
            lastTime = currentTime - (deltaTime % frameInterval);
        }

        controls.update();
        renderer.render(scene, camera);
    }
    animate(0);

    // Resize handler with debounce
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (container.clientWidth && container.clientHeight) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        }, 100);
    });
    resizeObserver.observe(container);

    // Pause when not visible
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });
}

// Initialize crane scene after page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let the page settle
    setTimeout(initCraneScene, 500);
});
