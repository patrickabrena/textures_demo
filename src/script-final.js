// Import required modules
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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

const loader = new GLTFLoader();
loader.load("d12.glb", (gltf) => {
    model = gltf.scene;
    const textureLoader = new THREE.TextureLoader();
    const texturePath = "space-cruiser-panels2-bl/";

    // Load textures
    const albedoTexture = textureLoader.load(`${texturePath}space-cruiser-panels2_albedo.png`);
    const aoTexture = textureLoader.load(`${texturePath}space-cruiser-panels2_ao.png`);
    const metallicTexture = textureLoader.load(`${texturePath}space-cruiser-panels2_metallic.png`);
    const normalTexture = textureLoader.load(`${texturePath}space-cruiser-panels2_normal-ogl.png`);
    const roughnessTexture = textureLoader.load(`${texturePath}space-cruiser-panels2_roughness.png`);
    const displacementTexture = textureLoader.load(`${texturePath}space-cruiser-panels2_height.png`);



    // Set texture color space and flip Y-axis for textures used for color information
    albedoTexture.colorSpace = THREE.SRGBColorSpace;
    aoTexture.colorSpace = THREE.SRGBColorSpace;
    metallicTexture.colorSpace = THREE.SRGBColorSpace; // Not strictly necessary but good for consistency
    normalTexture.colorSpace = THREE.SRGBColorSpace; // Not typically needed for normal maps
    roughnessTexture.colorSpace = THREE.SRGBColorSpace;

    albedoTexture.flipY = true;
    aoTexture.flipY = true;
    metallicTexture.flipY = true;
    normalTexture.flipY = true;
    roughnessTexture.flipY = true;
    displacementTexture.flipY = true;


    // Set texture repetition (adjust to make the texture smaller)
    const repeatValue = 8; // Smaller value for better detail

    // Apply repeat settings and set repeat wrapping
    albedoTexture.wrapS = albedoTexture.wrapT = THREE.RepeatWrapping;
    aoTexture.wrapS = aoTexture.wrapT = THREE.RepeatWrapping;
    metallicTexture.wrapS = metallicTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
    roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
    displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;

    // Apply repeat settings to textures
    albedoTexture.repeat.set(repeatValue, repeatValue);
    aoTexture.repeat.set(repeatValue, repeatValue);
    normalTexture.repeat.set(repeatValue, repeatValue);
    roughnessTexture.repeat.set(repeatValue, repeatValue);
    metallicTexture.repeat.set(repeatValue, repeatValue);
    displacementTexture.repeat.set(repeatValue, repeatValue);

    // Create material with the loaded textures
    const material = new THREE.MeshStandardMaterial({
        map: albedoTexture,
        aoMap: aoTexture,
        metalnessMap: metallicTexture,
        metalness: 0.9,
        roughness: 0.1,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        aoMapIntensity: 1.3, // Adjusted AO intensity
        normalMap: normalTexture,
        displacementMap: displacementTexture,
        displacementScale: 0,
        displacementBias: 0,
        color: new THREE.Color(0x0000ff), // Applying blue color tint
    emissive: new THREE.Color(0x0000ff), // Optional: make the blue color appear as if it's glowing
    emissiveIntensity: 0.02 // Adjust the intensity of the emissive color
    });

    // Apply material to the model
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = material;

        
        }
    });

    // Create pivot and add model to the scene
    pivot = new THREE.Object3D();
    pivot.add(model);
    scene.add(pivot);
    model.position.set(0, 0, 0);
});

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 6.9);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1500);
pointLight.position.set(0, 0, 9);
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
    rotationSpeedX: 0.69,
    rotationSpeedY: 0.69,
};

// Create Tweakpane GUI
const pane = new Pane();
pane.addBinding(rotationConfig, "rotationSpeedX", { min: 0.1, max: 0.9, step: 0.01 }).label = "Friction X";
pane.addBinding(rotationConfig, "rotationSpeedY", { min: 0.1, max: 0.9, step: 0.01 }).label = "Friction Y";

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

// Touch Events
const handleTouch = (event) => {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(model, true);

        if (intersects.length > 0 && !isDragging) {
            isDragging = true;
            inertiaActive = false;
            previousMousePosition.x = touch.clientX;
            previousMousePosition.y = touch.clientY;
        } else if (isDragging) {
            const deltaX = touch.clientX - previousMousePosition.x;
            const deltaY = touch.clientY - previousMousePosition.y;
            
            rotationSpeedX = deltaY * rotationConfig.rotationSpeedX * 0.002;
            rotationSpeedY = deltaX * rotationConfig.rotationSpeedY * 0.002;
            
            const quaternionX = new THREE.Quaternion();
            const quaternionY = new THREE.Quaternion();
            quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeedY);
            quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeedX);
            pivot.quaternion.multiplyQuaternions(quaternionY, pivot.quaternion);
            pivot.quaternion.multiplyQuaternions(quaternionX, pivot.quaternion);
            
            previousMousePosition.x = touch.clientX;
            previousMousePosition.y = touch.clientY;
        }
    }
};

// Add touch event listeners
window.addEventListener("touchstart", startDragging);
window.addEventListener("touchend", stopDragging);
window.addEventListener("touchmove", handleTouch);

// Animation Loop
const renderLoop = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
};
renderLoop();
