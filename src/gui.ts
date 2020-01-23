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
      for (const logoGroup of target.groups) {
        for (const logoMesh of logoGroup.meshes) {
          logoMesh.material = mat;
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
    label: "Play",
    folder: "Animation",
    object: options,
    property: "animPlay",
    onChange: (value: number) => {
      for (const animation of target.animations) {
        value ? animation.play() : animation.pause();
      }
    }
  });
  gui.Register({
    type: "range",
    label: "Speed",
    folder: "Animation",
    min: 0.1,
    max: 10,
    object: options,
    property: "animSpeed",
    onChange: (value: number) => {
      target.animations.length = 0;
      target.animationPromises.length = 0;

      let elementDelay = 0;
      for (const logoGroup of target.groups) {
        let ringDelay = 0;
        // for (const logoMesh of logoGroup.meshes) {
        for (let i = logoGroup.meshes.length - 1; i >= 0; --i) {
          const logoMesh = logoGroup.meshes[i];
          logoMesh.rotation.set(0, 0, 0);

          anime.remove(logoMesh);
          const logoAnimation = anime({
            autoplay: true,
            targets: logoMesh.rotation,
            x: 2.0 * Math.PI,
            y: 2.0 * Math.PI,
            z: 2.0 * Math.PI,
            delay: elementDelay + ringDelay,
            duration: options.animDuration / value - ringDelay - elementDelay
          });
          ringDelay += options.animRingDelay / value;

          target.animations.push(logoAnimation);
          target.animationPromises.push(logoAnimation.finished);
        }
        elementDelay += options.animElementDelay / value;
      }
    }
  });
  gui.Register({
    type: "checkbox",
    label: "Rotate",
    folder: "Animation",
    object: options,
    property: "animRotate",
    onChange: (value: number) => {
      target.controls.autoRotate = value;
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
