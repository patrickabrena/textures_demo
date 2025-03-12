import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Pane } from "tweakpane";

// initialize the pane
const pane = new Pane();

// initialize the scene
const scene = new THREE.Scene();

//init the loader
const textureLoader = new THREE.TextureLoader();



// initialize the geometry
const geometry = new THREE.BoxGeometry(1, 1, 1);
const torusKnotGeometry = new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16);
const planeGeometry = new THREE.PlaneGeometry(2, 2);
//creating a sphere & cylinder
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)

//init the texture
const textureTest = textureLoader.load();
//create a path variable to store path of the texture


const axisHelper = new THREE.AxesHelper();
scene.add(axisHelper);

// initialize the material
const material = new THREE.MeshBasicMaterial();
material.map = textureTest




//init a group
const group = new THREE.Group();


// initialize the mesh
const cube = new THREE.Mesh(geometry, material);

const knot = new THREE.Mesh(torusKnotGeometry, material);
knot.position.x = 1.5;

const plane = new THREE.Mesh(planeGeometry, material);
plane.material.side = THREE.DoubleSide
//plane.position.x = -1.5;
//rotating the plane about the x axis
plane.rotation.x = Math.PI * 0.5 // Pi is 180 degrees so to rotate it flat we need half
//setting the scale next
plane.scale.set(100, 100)
const sphere = new THREE.Mesh();
sphere.geometry = sphereGeometry;
sphere.material = material;
sphere.position.y = 1.5

const cylinder = new THREE.Mesh();
cylinder.geometry = cylinderGeometry;
cylinder.material = material;
cylinder.position.y = -1.5


// add the mesh to the scene
//scene.add(cube);
//scene.add(knot);
//scene.add(plane);
//scene.add(sphere, cylinder)

//group.add(sphere, cylinder, cube, knot, plane);
group.add(plane)
scene.add(group)

// initialize the light
const light = new THREE.AmbientLight(0xffffff, 0.02);
scene.add(light);

const pointLight = new THREE.PointLight(0xffffff, 1.2);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// initialize the camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.z = 5;
camera.position.y = 1;

// initialize the renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
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





// render the scene
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
