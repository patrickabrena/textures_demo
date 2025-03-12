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
