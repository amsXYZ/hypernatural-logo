import anime, { AnimeInstance } from "animejs";
import {
  Clock,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
  VertexColors,
  WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { createGUI } from "./gui";

// tslint:disable
const Postprocessing = require("postprocessing");
const Stats = require("stats.js");
// tslint:enable

const options = {
  matIdx: "default",
  animDirection: "outside",
  animRotate: true,
  animRotateSpeed: 2,
  animPlay: true,
  animSpeed: 5,
  animDuration: 50000,
  animElementDelay: 1000,
  animRingDelay: 8000,
  bloomScale: 0.5,
  bloomIntensity: 1.0
};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer({ canvas });
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false;

const stats = new Stats();
stats.dom.style.cssText =
  "position:fixed;bottom:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";
canvas.parentElement.appendChild(stats.dom);

const scene = new Scene();
const camera = new PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 1.5;
const controls = new OrbitControls(camera, canvas);
controls.autoRotate = options.animRotate;
controls.enableDamping = true;

const composer = new Postprocessing.EffectComposer(renderer);
composer.addPass(new Postprocessing.RenderPass(scene, camera));
const effectPass = new Postprocessing.EffectPass(
  camera,
  new Postprocessing.BloomEffect()
);
effectPass.renderToScreen = true;
effectPass.effects[0].luminancePass.enabled = false;
composer.addPass(effectPass);

const clock = new Clock();

const materials: Array<MeshBasicMaterial | MeshMatcapMaterial> = [
  new MeshBasicMaterial()
];
materials[0].vertexColors = VertexColors;
for (let i = 1; i <= 22; ++i) {
  if (i !== 2 && i !== 6 && i !== 10) {
    const matcapMaterial = new MeshMatcapMaterial({
      matcap: Texture.DEFAULT_IMAGE
    });
    const textureLoader = new TextureLoader()
      .setPath("./resources/matcap/")
      .load(`matcap_${i}.jpg`, (texture: Texture) => {
        matcapMaterial.matcap = texture;
        matcapMaterial.needsUpdate = true;
      });
    materials.push(matcapMaterial);
  }
}

interface ILogoMesh {
  rot: { x: number; y: number; z: number };
  mesh: Mesh;
}

interface ILogoGroup {
  group: Group;
  meshes: ILogoMesh[];
}

let currentGroup: Group;
const logoGroups: ILogoGroup[] = [];
const logoAnimations: AnimeInstance[] = [];
const logoAnimationPromises: Array<Promise<void>> = [];

// NOTE: Done since the GLTFLoader has a problem importing empty parent nodes.
const circleTranslation = new Vector3(-0.125, -0.17400002479553223, 0);
const squareTranslation = new Vector3(
  0.1520000398159027,
  0.09999999403953552,
  0
);
const squareRotationAxis = new Vector3(
  0.9743700204157045,
  0.22495124652933046,
  0
);
const triangleTranslation = new Vector3(
  -0.12889999151229858,
  0.24799999594688416,
  0
);

const sceneLoader = new GLTFLoader().setPath("./resources/");
sceneLoader.load("hypernatural-extruded-mesh.glb", (gltf: GLTF) => {
  gltf.scene.traverse((gltfNode: Mesh) => {
    if (
      gltfNode.name === "Circle" ||
      gltfNode.name === "Square" ||
      gltfNode.name === "Triangle"
    ) {
      currentGroup = new Group();
      currentGroup.name = gltfNode.name;
      currentGroup.matrix = gltfNode.matrix;
      switch (gltfNode.name) {
        case "Circle":
          currentGroup.position.copy(circleTranslation);
          break;
        case "Square":
          currentGroup.position.copy(squareTranslation);
          break;
        case "Triangle":
          currentGroup.position.copy(triangleTranslation);
          break;
      }
      logoGroups.push({ group: currentGroup, meshes: [] });
    }
    if (gltfNode.isMesh) {
      gltfNode.material = materials[0];
      logoGroups[logoGroups.length - 1].meshes.push({
        rot: { x: 0, y: 0, z: 0 },
        mesh: gltfNode
      });
    }
  });

  let elementDelay = 0;
  for (const logoGroup of logoGroups) {
    let ringDelay = 0;

    const startIdx =
      options.animDirection === "outside" ? 0 : logoGroup.meshes.length - 1;
    const endIdx =
      options.animDirection === "outside" ? logoGroup.meshes.length : -1;
    const loopDir = options.animDirection === "outside" ? 1 : -1;
    for (let i = startIdx; i !== endIdx; i += loopDir) {
      const logoMesh = logoGroup.meshes[i];
      const logoAnimation = anime({
        autoplay: options.animPlay,
        targets: logoMesh.rot,
        x: logoGroup.group.name === "Square" ? 2.0 * Math.PI : 0,
        y:
          logoGroup.group.name === "Triangle"
            ? 2.0 * Math.PI
            : logoGroup.group.name === "Circle"
            ? -2.0 * Math.PI
            : 0,
        delay: elementDelay + ringDelay,
        easing: "easeInOutQuad",
        duration: options.animDuration / options.animSpeed,
        update: () => {
          if (logoGroup.group.name === "Square") {
            logoMesh.mesh.setRotationFromAxisAngle(
              squareRotationAxis,
              logoMesh.rot.x
            );
          } else {
            logoMesh.mesh.rotation.set(
              logoMesh.rot.x,
              logoMesh.rot.y,
              logoMesh.rot.z
            );
          }
        }
      });
      ringDelay += options.animRingDelay / options.animSpeed;

      logoGroup.group.add(logoMesh.mesh);
      logoAnimations.push(logoAnimation);
      logoAnimationPromises.push(logoAnimation.finished);
    }
    elementDelay += options.animElementDelay / options.animSpeed;

    scene.add(logoGroup.group);
  }

  Promise.all(logoAnimationPromises).then(() => {
    restartAnimations();
  });
});

const restartAnimations = () => {
  logoAnimationPromises.length = 0;
  for (const logoAnimation of logoAnimations) {
    logoAnimation.restart();
    logoAnimationPromises.push(logoAnimation.finished);
  }
  Promise.all(logoAnimationPromises).then(() => {
    restartAnimations();
  });
};

createGUI(options, {
  materials,
  bloom: effectPass.effects[0],
  logoGroups,
  controls,
  logoAnimations,
  logoAnimationPromises,
  restartAnimations,
  squareRotationAxis
});

window.addEventListener("resize", (event: UIEvent) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
  renderer.setPixelRatio(window.devicePixelRatio);
});

function animate() {
  requestAnimationFrame(animate);
  stats.begin();
  controls.update();
  composer.render(clock.getDelta());
  stats.end();
}
animate();
