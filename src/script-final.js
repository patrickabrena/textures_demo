//code entire project from scratch with LOTS of comments

//import the libraries that we need from the node_modules directory
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { shiftLeft } from "three/tsl";
import { Pane } from "tweakpane";

//init the scene
const scene = new THREE.Scene();
const sceneAxesHelper = new THREE.AxesHelper();
scene.add(sceneAxesHelper)


let model; // Declare model globally

//init the model loader to load my glb
const loader = new GLTFLoader();
//Loading my glb
loader.load('d12.glb', (gltf) => {
    //console.log(gltf)
    model = gltf.scene
    
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.2, metalness: 0.8 }); // Green & shiny
        }
    });

    model.rotation.y = Math.PI / 4; // Rotate 45 degrees


    //test code for pivot on the model
      // Create a parent pivot object
      const pivot = new THREE.Object3D();
      pivot.add(model); // Attach the model to the pivot
      scene.add(pivot); // Add pivot to the scene
  
      model.position.set(0, 0, 0); // Make sure the model is centered in pivot



    //scene.add(gltf.scene)
    //console.log(gltf)

})
//trying to do it from scratch
//https://threejs.org/docs/?q=GLTF#examples/en/loaders/GLTFLoader // read for the docs
//https://www.youtube.com/watch?v=RSV7_f5dJhM // video on guy doing the texture load
//

////////////////////

// Mouse-based rotation variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Event listeners for mouse movement
window.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (event) => {
    if (!isDragging || !model) return;

    let deltaX = event.clientX - previousMousePosition.x;
    let deltaY = event.clientY - previousMousePosition.y;

    model.rotation.y += deltaX * 0.005; // Adjust speed if needed
    model.rotation.x += deltaY * 0.005;

    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
});



///////////////

//some set up for the lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 25);
pointLight.position.set(0, 3, 5);
scene.add(pointLight);

//initialize the camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);

camera.position.z = 5;
camera.position.y = 3;

//setup the renderer
//start by assigning the canvas html element to the "canvas" variable in this script-final.js
//<canvas> element is where WebGL operates
const canvas = document.querySelector("canvas.threejs")
//set up the renderer
//
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
//set renderer size and pixelratio
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// instantiate the controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enabled = false; // This disables OrbitControls

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });



  const renderloop = () => {

    //issue with this is if my array of children from the parent mesh has alot to iterate through, it can cause problems.
    //to solve this, create a group and instead of scene.children it would be group.children
   //group.children.forEach((child) => {
   //  if (child instanceof THREE.Mesh) {
   //    child.rotation.y += 0.01
   //  }
   //})
  
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(renderloop);
  };
  
  renderloop();