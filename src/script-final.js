// Import required modules
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Pane } from "tweakpane";

// Create a Three.js scene
const scene = new THREE.Scene();

// Add an AxesHelper to visualize axis (useful for debugging)
const sceneAxesHelper = new THREE.AxesHelper(3);
scene.add(sceneAxesHelper);

// Global variables
let model, pivot;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let inertiaActive = false;
let rotationSpeedX = 0;
let rotationSpeedY = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load GLB Model
const loader = new GLTFLoader();
loader.load("d12.glb", (gltf) => {
    model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0x00ff00, roughness: 0.2, metalness: 0.8
            });
        }
    });
    pivot = new THREE.Object3D();
    pivot.add(model);
    scene.add(pivot);
    model.position.set(0, 0, 0);
});

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 25);
pointLight.position.set(0, 3, 5);
scene.add(pointLight);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 5);

// Renderer Setup
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit Controls (Disabled)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enabled = false;

// Handle Window Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Rotation Speed Settings (Configurable via Tweakpane)
const rotationConfig = {
    rotationSpeedX: 0.5,
    rotationSpeedY: 0.5,
};

// Create Tweakpane GUI
const pane = new Pane();
pane.addBinding(rotationConfig, "rotationSpeedX", { min: 0.1, max: 0.9, step: 0.01 }).label = "Rotation Speed X";
pane.addBinding(rotationConfig, "rotationSpeedY", { min: 0.1, max: 0.9, step: 0.01 }).label = "Rotation Speed Y";

// Mouse Controls
const startDragging = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);
    if (intersects.length > 0) {
        isDragging = true;
        inertiaActive = false;
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
    }
};

const stopDragging = () => {
    isDragging = false;
    inertiaActive = true;
    applyInertia();
};

const handleDrag = (event) => {
    if (!isDragging || !pivot) return;
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    
    rotationSpeedX = deltaY * rotationConfig.rotationSpeedX * 0.002;
    rotationSpeedY = deltaX * rotationConfig.rotationSpeedY * 0.002;
    
    const quaternionX = new THREE.Quaternion();
    const quaternionY = new THREE.Quaternion();
    quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeedY);
    quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeedX);
    pivot.quaternion.multiplyQuaternions(quaternionY, pivot.quaternion);
    pivot.quaternion.multiplyQuaternions(quaternionX, pivot.quaternion);
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
};

// Apply Inertia Effect
const applyInertia = () => {
    if (!inertiaActive || (Math.abs(rotationSpeedX) < 0.0001 && Math.abs(rotationSpeedY) < 0.0001)) {
        inertiaActive = false; // Stop when speed is very low
        return;
    }

    pivot.rotation.y += rotationSpeedY;
    pivot.rotation.x += rotationSpeedX;

    rotationSpeedX *= 0.99; // Friction effect
    rotationSpeedY *= 0.99;

    requestAnimationFrame(applyInertia);
};

// Mouse Events
window.addEventListener("mousedown", startDragging);
window.addEventListener("mouseup", stopDragging);
window.addEventListener("mousemove", handleDrag);

// Animation Loop
const renderLoop = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
};
renderLoop();
