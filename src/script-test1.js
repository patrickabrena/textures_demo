// Import required modules
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Create a Three.js scene
const scene = new THREE.Scene();

// Add an AxesHelper to visualize axis (useful for debugging)
const sceneAxesHelper = new THREE.AxesHelper(3);
scene.add(sceneAxesHelper);

// Global variables
let model, pivot;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationSpeedX = 0, rotationSpeedY = 0;
let inertiaActive = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load GLB Model
const loader = new GLTFLoader();
loader.load("d12.glb", (gltf) => {
    model = gltf.scene;

    // Apply material to all meshes
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0x00ff00, roughness: 0.2, metalness: 0.8
            });
        }
    });

    // Create a pivot point and attach the model
    pivot = new THREE.Object3D();
    pivot.add(model);
    scene.add(pivot);

    model.position.set(0, 0, 0); // Center model in pivot
});

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 25);
pointLight.position.set(0, 3, 5);
scene.add(pointLight);

// Camera Setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 3, 5);

// Renderer Setup
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit Controls (Disabled)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enabled = false; // Disabled to allow custom controls

// Handle Window Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse & Touch Controls for Rotation
function startDragging(event) {
    // Normalize mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster based on camera and mouse
    raycaster.setFromCamera(mouse, camera);

    // Check if the ray intersects with the model
    const intersects = raycaster.intersectObject(model, true); // 'true' checks child meshes too

    if (intersects.length > 0) {
        isDragging = true;
        inertiaActive = false; // Stop inertia when dragging starts
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
    }
}

function stopDragging() {
    isDragging = false;
    inertiaActive = true;
    applyInertia();
}

function handleDrag(event) {
    if (!isDragging || !pivot) return;

    let deltaX = event.clientX - previousMousePosition.x;
    let deltaY = event.clientY - previousMousePosition.y;

    // Calculate rotation speed (adjust sensitivity if needed)
    rotationSpeedX = deltaY * 0.002;
    rotationSpeedY = deltaX * 0.002;

    // Convert delta rotation into a quaternion to avoid gimbal lock
    let quaternionX = new THREE.Quaternion();
    let quaternionY = new THREE.Quaternion();

    // Rotate around the Y-axis (left/right dragging)
    quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeedY);

    // Rotate around the X-axis (up/down dragging)
    quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeedX);

    // Apply the rotation while preserving the existing orientation
    pivot.quaternion.multiplyQuaternions(quaternionY, pivot.quaternion);
    pivot.quaternion.multiplyQuaternions(quaternionX, pivot.quaternion);

    // Update previous mouse position
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

function handleTouch(event) {
    if (!isDragging || !pivot) return;

    let deltaX = event.touches[0].clientX - previousMousePosition.x;
    let deltaY = event.touches[0].clientY - previousMousePosition.y;

    rotationSpeedX = deltaY * 0.002;
    rotationSpeedY = deltaX * 0.002;

    pivot.rotation.y += rotationSpeedY;
    pivot.rotation.x += rotationSpeedX;

    previousMousePosition.x = event.touches[0].clientX;
    previousMousePosition.y = event.touches[0].clientY;
}

// Mouse Events
window.addEventListener("mousedown", startDragging);
window.addEventListener("mouseup", stopDragging);
window.addEventListener("mousemove", handleDrag);

// Touch Events
window.addEventListener("touchstart", (event) => {
    startDragging(event);
});
window.addEventListener("touchend", stopDragging);
window.addEventListener("touchmove", handleTouch);

// Apply Inertia (Smooth Rotation After Release)
function applyInertia() {
    if (!inertiaActive || Math.abs(rotationSpeedX) < 0.0001 && Math.abs(rotationSpeedY) < 0.0001) {
        inertiaActive = false; // Stop when speed is very low
        return;
    }

    pivot.rotation.y += rotationSpeedY;
    pivot.rotation.x += rotationSpeedX;

    rotationSpeedX *= 0.99; // Friction effect
    rotationSpeedY *= 0.99;

    requestAnimationFrame(applyInertia);
}

// Animation Loop
function renderLoop() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
}

renderLoop();
