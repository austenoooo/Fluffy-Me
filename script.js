import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer;
let controls;
let landmarks;
let objects = [];

let videoWidth = 640;
let videoHeight = 480;
let depthMax = 5;

const gltfLoader = new GLTFLoader();

let headStone;

function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.getElementById("canva").appendChild(renderer.domElement);

  let backgroundColor = new THREE.Color(0xf5f5f5); // create a color representation from a hex code
  renderer.setClearColor(backgroundColor);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // controls = new OrbitControls(camera, renderer.domElement);

  camera.position.set(videoWidth/2, videoHeight/2, -500);
  camera.lookAt(videoWidth/2, videoHeight/2, 2000);
  // controls.update();

  // camera.position.set(100, 100, 100);
  // camera.lookAt(0, 0, 0);

  // helper functions
  const axesHelper = new THREE.AxesHelper(30);
  scene.add(axesHelper);
  const gridHelper = new THREE.GridHelper(200, 200);
  // scene.add(gridHelper);

  environmentMap();

  const light = new THREE.PointLight( 0xffffff, 10, 100 );
  light.position.set(100, 100, 100);
  scene.add( light );

  loadHeadStone();

  loop();
}

function environmentMap() {
  let loader = new RGBELoader();
  loader.load("./textures/studio.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });
}

function loadHeadStone() {
  gltfLoader.load(
    "models/headStone.glb",
    function (gltf) {
      headStone = gltf.scene;
      headStone.scale.set(10, 10, 10);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );
}

function addHead() {
  // radius: nose (0) -> left_shoulder (11) / right_shoulder (12)
  // center: nose (0)

  let nose = landmarks[0];
  let leftShoulder = landmarks[11];
  let rightShoulder = landmarks[12];

  if (nose.score > 0.5 && leftShoulder.score > 0.5) {
    let nosePos = new THREE.Vector3(
      nose.x,
      videoHeight - nose.y,
      depthMax - nose.z
    );
    let leftShoulderPos = new THREE.Vector3(
      leftShoulder.x,
      videoHeight - leftShoulder.y,
      depthMax - leftShoulder.z
    );
    let r = nosePos.distanceTo(leftShoulderPos) * 0.4; // the radius can be used for rescaling the models

    scene.add(headStone);
    headStone.position.set(nosePos.x, nosePos.y, nosePos.z);
    headStone.scale.set(r/10, r/10, r/10);
    
    objects.push(headStone);
  }
  // in case if the left shoulder wasn't detected
  else if (nose.score > 0.5 && rightShoulder.score > 0.5) {
    // let nosePos = new THREE.Vector3(nose.x, nose.y, nose.z * videoWidth);
    // let rightShoulderPos = new THREE.Vector3(rightShoulder.x, rightShoulder.y, rightShoulder.z * videoWidth);
    // let r = nosePos.distanceTo(rightShoulderPos) * 0.8;
  }
}

function loop() {
  renderer.render(scene, camera);

  // when pose if available and detection is working
  if (pose != undefined && pose.length > 0) {
    let primaryPose = pose[0];
    landmarks = primaryPose.keypoints;

    // clear all the objects
    for (let i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    // add all the objects
    addHead();
  }

  window.requestAnimationFrame(loop);
}

init();
