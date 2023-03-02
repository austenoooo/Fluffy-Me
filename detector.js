// HTML elements
const video = document.getElementById("webcam");

// detector
var detector = undefined;

// the detected body pose
let pose = undefined;

loadModel();

function loadModel() {
  const model = poseDetection.SupportedModels.BlazePose;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
  };
  poseDetection.createDetector(model, detectorConfig).then((loadedDetector) => {
    detector = loadedDetector;
    loadCamera();
  });
}

function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function loadCamera() {
  if (getUserMediaSupported()){
    enableCam();
  }
  else{
    console.warn("webcam is not supported by your browser");
  }
}

function enableCam() {
  if (!detector){
    return;
  }

  const constraints = {
    video: true,
  }

  //activate the webcam strem
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    renderPrediction();
  });
}

async function renderPrediction() {
  await renderResult();

  requestAnimationFrame(renderPrediction);
}

async function renderResult() {
  if (video.readyState < 2){
    await new Promise((resolve) => {
      video.onloadeddata = () => {
        resolve(video);
      }
    });
  }

  if (detector) {

    try{
      pose = await detector.estimatePoses(video, {enableSmoothing: true, flipHorizontal: false});
      // console.log(pose);
    }
    catch (error) {
      detector.dispose();
      detector = undefined;
      alert(error);
    }
  }
}