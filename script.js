import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene, camera, renderer;
let controls;

function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer( {antialias: true} );
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("canva").appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(300, 300, 300);
  camera.lookAt(0, 0, 0);
  
  controls = new OrbitControls( camera, renderer.domElement );

  loop();
}

function loop() {
  
  renderer.render(scene, camera);

  controls.update();

  window.requestAnimationFrame(loop);
}

init();