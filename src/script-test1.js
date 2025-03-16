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
//Function: startDragging(event)
//This function is triggered when the user clicks or touches the screen.
//it detects whether the mouse is interacting with the model and sets up the necessary variables for dragging
const startDragging = (event) => {


    
    //The EVENT parameter is an object automatically passed by the event listener (mousedown, touchstart)
    //It countains information about the mouse or touch event, such as:
    //event.clientX: The X-coordinate of the mouse relative to the viewport
    //event.clientY: The Y-coordinate of the mouse relative to the viewport
    //Other details like button cliks, touch positions, etc

    
    // Normalize mouse position
    //converting the pixel coordinates to the Normalized Device Coordinates

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //Three.js uses a Normalized Device Coordinate (NDC) system where:
    //The X-axis ranges from -1(left) to +1(right)
    //THe Y-axis ranges from -1(bottom) to +1(top)
    //The Z-axis ranges from -1(near) to +1(far)

    //clientX and clientY come from the event object, which is automatically passed into startDragging(event)
    //The event object is created by the browser when a user clicks (mousedown), moves the mouse (mousemove), or interacts (touchstart)

    //However, clientX and clientY use a pixel-based system, where:
    //clientX = 0 means the LEFT EDGE of the window
    //clientX = window.innerWidth means the RIGHT EDGE of the window
    //clientY = 0 means the TOP of the window
    //clientY = window.innerHeight means the BOTTOM of the window


    //1. X-coordinate Conversion:
    //mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    //(event.clientX / window.innerWidth): Converts clientX to a range of 0 to 1
    //multiplying by 2 scales it to 0 to 2
    //Subtracting 1 shifts to -1 to +1

    //Example:
    //If event.clientX = 0, then mouse.x = -1 (left edge)
    //If event.clientX = window.innerWidth / 2, then mouse.x = 0 (center)
    //If event.clientX = window.innerWidth, then mouse.x = +1 (right edge)

    //2. Y-coordinate conversion:
    //mouse.y = -(event.clientX / window.innerWidth) * 2 + 1;
    //(event.clientY / window.innerHeight): convers clientY to a range of 0 to 1.
    //Mutiplying by 2 scales it to 0 to 2
    //adding 1 shifts it to -1 to +1, but we negate it with -()
    //This is necessary because:
    //In Css pixels, clientY = 0 is at the TOP
    //in Three.js mouse.y = +1 is at the top.
    //So, we invert the y-axis to match

    //Example:
    //If event.clientY = 0, then mouse.y = + 1 (top edge)
    //If event.clientY = window.innerHeight / 2, then mouse.y = 0 (center)
    //If event.clientY = window.innerHeight, then mouse.y = - 1 (bottom edge)



    // Update raycaster based on camera and mouse
    raycaster.setFromCamera(mouse, camera);
    //This tells the Raycaster to cast a ray from the camera's position through the point on the screen where the mouse is located.
    //Since mouse is now noamrlized, Three.js can determine the exact direction from the camera


    // Check if the ray intersects with the model
    const intersects = raycaster.intersectObject(model, true); // 'true' checks child meshes too
    //raycaster.intersectObject(object, recursive): Checks if the ray hits the given object. 
    //The true argument makes it recursive, meaningg it checks all child meshes inside the model


    if (intersects.length > 0) {
        isDragging = true; // This enables dragging mode.//other parts ofthe code like handleDrag function will only run if isDragging is set to true.
        //it affects the handeDrag(event)
        //if if (!isDragging || !pivot) return;
        //the code above ensures that dragging behaviour only happens when a valid drag starts
        inertiaActive = false; // Stop inertia when dragging starts
        previousMousePosition.x = event.clientX; // stores the mouse's starting X position when the drag begins
        //this allows us to calculate how much the mouse moves in handleDrag(event)
        //we need this because wihtout storing the previous postiino, we wouldn't know how far the mouse moved between frames
        previousMousePosition.y = event.clientY;//Stores the mouse's starting Y position when the drag begins
        //we need this for the vertical rotation calculations in handleDrag(event)
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

    // Calculate rotation speed (adjust sensitivity if needed)
    rotationSpeedX = deltaY * 0.002;
    rotationSpeedY = deltaX * 0.002;

    // Convert delta rotation into a quaternion to avoid gimbal lock
    const quaternionX = new THREE.Quaternion();
    const quaternionY = new THREE.Quaternion();

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
};

const handleTouch = (event) => {
    if (!isDragging || !pivot) return;
    //


    const deltaX = event.touches[0].clientX - previousMousePosition.x;
    const deltaY = event.touches[0].clientY - previousMousePosition.y;

    rotationSpeedX = deltaY * 0.002;
    rotationSpeedY = deltaX * 0.002;

    pivot.rotation.y += rotationSpeedY;
    pivot.rotation.x += rotationSpeedX;

    previousMousePosition.x = event.touches[0].clientX;
    previousMousePosition.y = event.touches[0].clientY;
};

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

// Animation Loop
const renderLoop = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
};

renderLoop();