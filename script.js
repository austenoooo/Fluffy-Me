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

let environment;

const gltfLoader = new GLTFLoader();

let headStone, bodyStone;

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

  camera.position.set(videoWidth / 2, videoHeight / 2, -800);
  camera.lookAt(videoWidth / 2, videoHeight / 2 - 200, 2000);
  // controls.update();

  // camera.position.set(100, 100, 100);
  // camera.lookAt(0, 0, 0);

  // helper functions
  const axesHelper = new THREE.AxesHelper(30);
  scene.add(axesHelper);
  const gridHelper = new THREE.GridHelper(200, 200);
  // scene.add(gridHelper);

  environmentMap();

  // createGround();

  const light = new THREE.PointLight(0xffffff, 10, 100);
  light.position.set(100, 100, 100);
  scene.add(light);

  loadHeadStone();
  loadBodyStone();

  loop();
}

function environmentMap() {
  let loader = new RGBELoader();
  loader.load("./textures/studio.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    environment = texture;
  });
}

function createGround() {
  let textureLoader = new THREE.TextureLoader();

  let groundAmbient = textureLoader.load(
    "./textures/ground/ground_AmbientOcclusion.jpg"
  );
  let groundHeight = textureLoader.load("./textures/ground/ground_Height.png");
  let groundNormal = textureLoader.load("./textures/ground/ground_Normal.jpg");
  let groundRoughness = textureLoader.load(
    "./textures/ground/ground_Roughness.jpg"
  );

  let groundMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0b3d22,
    roughness: 1,
    metalness: 0,
    environmentMap: environment,
    normalMap: groundNormal,
    roughnessMap: groundRoughness,
    displacementMap: groundHeight,
    displacementScale: 1,
    side: THREE.DoubleSide,
  });

  let ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    groundMaterial
  );
  scene.add(ground);
  ground.rotation.set(Math.PI / 2, 0, 0);
  ground.position.set(0, -200, 0);
}

function loadHeadStone() {
  gltfLoader.load(
    "models/headStone.glb",
    function (gltf) {
      headStone = gltf.scene;
      headStone.rotation.set(-Math.PI / 6, 0, 0);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );
}

function loadBodyStone() {
  gltfLoader.load(
    "models/bodyStone.glb",
    function (gltf) {
      bodyStone = gltf.scene;
      bodyStone.rotation.set(0, -Math.PI/2, 0);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );
}

function addBody() {
  // radius: center of left_shoulder (11) & right_shoulder (12) & right_hip (24) & left_hip (23) -> left_shoulder (11)
  // center: calculated center

  let leftShoulder = landmarks[11];
  let rightShoulder = landmarks[12];
  let leftHip = landmarks[23];
  let rightHip = landmarks[24];

  if (
    leftShoulder.score > 0.5 &&
    rightShoulder.score > 0.5 &&
    leftHip.score > 0.5 &&
    rightHip.score > 0.5
  ) {
    let leftShoulderPos = new THREE.Vector3(
      leftShoulder.x,
      videoHeight - leftShoulder.y,
      depthMax - leftShoulder.z
    );
    let rightShoulderPos = new THREE.Vector3(
      rightShoulder.x,
      videoHeight - rightShoulder.y,
      depthMax - rightShoulder.z
    );
    let leftHipPos = new THREE.Vector3(
      leftHip.x,
      videoHeight - leftHip.y,
      depthMax - leftHip.z
    );
    let rightHipPos = new THREE.Vector3(
      rightHip.x,
      videoHeight - rightHip.y,
      depthMax - rightHip.z
    );

    let center = new THREE.Vector3(
      (leftShoulderPos.x + rightShoulderPos.x + leftHipPos.x + rightHipPos.x) / 4,
      (leftShoulderPos.y + rightShoulderPos.y + leftHipPos.y + rightHipPos.y) / 4,
      (leftShoulderPos.z + rightShoulderPos.z + leftHipPos.z + rightHipPos.z) / 4
    );

    let r = leftShoulderPos.distanceTo(center);

    scene.add(bodyStone);
    bodyStone.position.set(center.x - 30, center.y - 30, center.z);
    bodyStone.scale.set(r / 35, r / 35, r / 35);

    objects.push(bodyStone);

  }
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

    // console.log(nosePos);

    scene.add(headStone);
    headStone.position.set(nosePos.x, nosePos.y, nosePos.z);
    headStone.scale.set(r / 10, r / 10, r / 10);

    objects.push(headStone);
  }
  // in case if the left shoulder wasn't detected
  else if (nose.score > 0.5 && rightShoulder.score > 0.5) {
    let nosePos = new THREE.Vector3(nose.x, nose.y, nose.z * videoWidth);
    let rightShoulderPos = new THREE.Vector3(
      rightShoulder.x,
      rightShoulder.y,
      rightShoulder.z * videoWidth
    );
    let r = nosePos.distanceTo(rightShoulderPos) * 0.8;

    scene.add(headStone);
    headStone.position.set(nosePos.x, nosePos.y, nosePos.z);
    headStone.scale.set(r / 10, r / 10, r / 10);

    objects.push(headStone);
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
    addBody();
  }

  window.requestAnimationFrame(loop);
}

init();
