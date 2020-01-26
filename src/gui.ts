import anime, { AnimeInstance } from "animejs";
// tslint:disable:no-var-requires
const guify = require("guify");
// tslint:enable:no-var-requires

export function createGUI(options: any, target: any) {
  const gui = new guify({
    title: "AMS - Hypernatural Berlin",
    align: "right",
    barMode: "above",
    open: true
  });
  gui.Register({
    type: "select",
    label: "Material",
    options: [
      "default",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18"
    ],
    object: options,
    property: "matIdx",
    onChange: (value: string) => {
      let mat = target.materials[0];
      if (value !== "default") {
        mat = target.materials[Number(value)];
      }
      for (const logoGroup of target.logoGroups) {
        for (const logoMesh of logoGroup.meshes) {
          logoMesh.mesh.material = mat;
        }
      }
    }
  });
  gui.Register({
    type: "folder",
    label: "Animation",
    open: true
  });
  gui.Register({
    type: "checkbox",
    label: "Camera Rotation",
    folder: "Animation",
    object: options,
    property: "animRotate",
    onChange: (value: number) => {
      target.controls.autoRotate = value;
    }
  });
  gui.Register({
    type: "range",
    label: "Camera Rotation Speed",
    folder: "Animation",
    min: 0,
    max: 10,
    object: options,
    property: "animRotateSpeed",
    onChange: (value: number) => {
      target.controls.autoRotateSpeed = value;
    }
  });
  gui.Register({
    type: "checkbox",
    label: "Ring Rotation",
    folder: "Animation",
    object: options,
    property: "animPlay",
    onChange: (value: number) => {
      for (const animation of target.logoAnimations) {
        value ? animation.play() : animation.pause();
      }
    }
  });
  gui.Register({
    type: "range",
    label: "Ring Rotation Speed",
    folder: "Animation",
    min: 0.1,
    max: 100,
    object: options,
    property: "animSpeed",
    onChange: (value: number) => {
      recomputeAnimations(options, target);
    }
  });
  gui.Register({
    type: "range",
    label: "Full Rotation Count",
    folder: "Animation",
    min: 1,
    max: 100,
    object: options,
    property: "animRotations",
    onChange: (value: string) => {
      recomputeAnimations(options, target);
    }
  });
  gui.Register({
    type: "select",
    label: "Ring Rotation Direction",
    folder: "Animation",
    options: ["inside", "outside"],
    object: options,
    property: "animDirection",
    onChange: (value: string) => {
      recomputeAnimations(options, target);
    }
  });
  gui.Register({
    type: "folder",
    label: "Bloom",
    open: true
  });
  gui.Register({
    type: "range",
    label: "Scale",
    folder: "Bloom",
    min: 0,
    max: 1,
    object: options,
    property: "bloomScale",
    onChange: (value: number) => {
      target.bloom.setResolutionScale(Math.max(0.1, 1.0 - value));
    }
  });
  gui.Register({
    type: "range",
    label: "Intensity",
    folder: "Bloom",
    min: 0,
    max: 8,
    object: options,
    property: "bloomIntensity",
    onChange: (value: number) => {
      target.bloom.blendMode.opacity.value = value;
    }
  });
}

function recomputeAnimations(options: any, target: any) {
  target.logoAnimations.length = 0;
  target.logoAnimationPromises.length = 0;

  let elementDelay = 0;
  for (const logoGroup of target.logoGroups) {
    let ringDelay = 0;

    const startIdx =
      options.animDirection === "outside" ? 0 : logoGroup.meshes.length - 1;
    const endIdx =
      options.animDirection === "outside" ? logoGroup.meshes.length : -1;
    const loopDir = options.animDirection === "outside" ? 1 : -1;
    for (let i = startIdx; i !== endIdx; i += loopDir) {
      const logoMesh = logoGroup.meshes[i];
      logoMesh.rot.x = 0;
      logoMesh.rot.y = 0;
      logoMesh.rot.z = 0;

      anime.remove(logoMesh.rot);
      const logoAnimation = anime({
        autoplay: options.animPlay,
        targets: logoMesh.rot,
        x:
          options.animRotations *
          (logoGroup.group.name === "Square" ? -2.0 * Math.PI : 0),
        y:
          options.animRotations *
          (logoGroup.group.name === "Triangle"
            ? 2.0 * Math.PI
            : logoGroup.group.name === "Circle"
            ? -2.0 * Math.PI
            : 0),
        delay: elementDelay + ringDelay,
        easing: "easeInOutQuad",
        duration:
          (options.animRotations * options.animDuration) / options.animSpeed,
        update: () => {
          if (logoGroup.group.name === "Square") {
            logoMesh.mesh.setRotationFromAxisAngle(
              target.squareRotationAxis,
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

      target.logoAnimations.push(logoAnimation);
      target.logoAnimationPromises.push(logoAnimation.finished);
    }
    elementDelay += options.animElementDelay / options.animSpeed;
  }

  Promise.all(target.logoAnimationPromises).then(() => {
    target.restartAnimations();
  });
}
