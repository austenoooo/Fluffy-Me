import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let scene, camera, renderer;
let material;
let controls;
let landmarks;
let objects = [];

let videoWidth = 640;
let videoHeight = 480;
let depthMax = 5;

let uniforms;

function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer( {antialias: true} );
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("canva").appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  
  // controls = new OrbitControls( camera, renderer.domElement );

  camera.position.set(videoWidth/2, videoHeight/2, -500);
  camera.lookAt(videoWidth/2, videoHeight/2, 2000);
  // controls.update();


  uniforms = {

    amplitude: { value: 50.0 },
    opacity: { value: 0.3},
    color: { value: new THREE.Color( 0xffffff ) }

  };

  material = new THREE.ShaderMaterial( {

    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true

  } );

  // let ball = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), meterial);
  // scene.add(ball);
  // ball.position.set(0, 0, 0);

  // environmentMap();

  loop();
}

function environmentMap(){

  let loader = new RGBELoader();
  loader.load("./textures/environment.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
  });

}

function addHead(){
  // radius: nose (0) -> left_shoulder (11) / right_shoulder (12)
  // center: nose (0)

  let nose = landmarks[0];
  let leftShoulder = landmarks[11];
  let rightShoulder = landmarks[12];

  if (nose.score > 0.5 && leftShoulder.score > 0.5) {
    let nosePos = new THREE.Vector3(nose.x, (videoHeight - nose.y), depthMax - nose.z);
    let leftShoulderPos = new THREE.Vector3(leftShoulder.x, (videoHeight - leftShoulder.y), depthMax - leftShoulder.z);
    let r = nosePos.distanceTo(leftShoulderPos) * 0.4;

    let baseGeometry = new THREE.SphereGeometry(r, 64, 32);

    baseGeometry.center();

    const count = baseGeometry.attributes.position.count;

    const displacement = new THREE.Float32BufferAttribute( count * 3, 3 );
    baseGeometry.setAttribute( 'displacement', displacement );

    const customColor = new THREE.Float32BufferAttribute( count * 3, 3 );
    baseGeometry.setAttribute( 'customColor', customColor );

    const color = new THREE.Color( 0xffffff );

    for ( let i = 0, l = customColor.count; i < l; i ++ ) {

      color.setHSL( i / l, 0.5, 0.5 );
      color.toArray( customColor.array, i * customColor.itemSize );

    }

    const array = baseGeometry.attributes.displacement.array;

    for ( let i = 0, l = array.length; i < l; i += 3 ) {

      const time = Date.now() / 1000;

      array[ i ] += 3 * ( 0.5 - Math.random());
      array[ i + 1 ] += 3 * ( 0.5 - Math.random());
      array[ i + 2 ] += 3 * ( 0.5 - Math.random());

    }

    let head = new THREE.Line(baseGeometry, material);
    // console.log(r);
    // console.log(nosePos);
    scene.add(head);
    head.position.set(nosePos.x, nosePos.y, nosePos.z);

    objects.push(head);
  }
  // in case if the left shoulder wasn't detected
  else if (nose.score > 0.5 && rightShoulder.score > 0.5){
    // let nosePos = new THREE.Vector3(nose.x, nose.y, nose.z * videoWidth);
    // let rightShoulderPos = new THREE.Vector3(rightShoulder.x, rightShoulder.y, rightShoulder.z * videoWidth);
    // let r = nosePos.distanceTo(rightShoulderPos) * 0.8;
    // let head = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), material);
    // scene.add(head);
    // head.position.set(nosePos);
  }
}

function loop() {
  
  renderer.render(scene, camera);

  // controls.update();


  // when pose if available and detection is working
  if (pose != undefined && pose.length > 0){
    
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