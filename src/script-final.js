//code entire project from scratch with LOTS of comments

//import the libraries that we need from the node_modules directory
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Pane } from "tweakpane";

//init the scene
const scene = new THREE.Scene();

//init the model loader to load my glb
const GLTFloader = new THREE.GLTFLoader();

//Loading my glb
GLTFloader.load('src/d12.glb')
//trying to do it from scratch
//https://threejs.org/docs/?q=GLTF#examples/en/loaders/GLTFLoader // read for the docs
//https://www.youtube.com/watch?v=RSV7_f5dJhM // video on guy doing the texture load
//


//some set up for the lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
scene.add(pointLight);

//initialize the camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

camera.position.z = 25;
camera.position.y = 15;

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

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });