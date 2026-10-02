"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import * as THREE from "three";

function material(color, roughness = 0.62, metalness = 0) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: 0.28,
    clearcoatRoughness: 0.24,
  });
}

function mesh(geometry, color, roughness, metalness) {
  return new THREE.Mesh(geometry, material(color, roughness, metalness));
}

function lathe(points, color) {
  const geometry = new THREE.LatheGeometry(points.map(([radius, height]) => new THREE.Vector2(radius, height)), 64);
  return mesh(geometry, color);
}

function makeBurger(accent) {
  const group = new THREE.Group();
  const lowerBun = lathe([[0, 0], [0.64, 0], [0.82, 0.04], [0.91, 0.12], [0.9, 0.22], [0.82, 0.29], [0, 0.29]], "#d98a39");
  lowerBun.position.y = -0.76;
  group.add(lowerBun);

  const lettuce = mesh(new THREE.TorusGeometry(0.81, 0.13, 12, 72), "#6f9b42");
  lettuce.rotation.x = Math.PI / 2;
  lettuce.position.y = -0.39;
  group.add(lettuce);

  const patty = mesh(new THREE.CylinderGeometry(0.81, 0.86, 0.24, 48), "#523326");
  patty.position.y = -0.25;
  group.add(patty);

  const cheeseShape = new THREE.Shape();
  cheeseShape.moveTo(-0.84, -0.7);
  cheeseShape.lineTo(0.84, -0.7);
  cheeseShape.lineTo(0.76, 0.68);
  cheeseShape.lineTo(-0.72, 0.8);
  cheeseShape.closePath();
  const cheese = mesh(new THREE.ExtrudeGeometry(cheeseShape, { depth: 0.055, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.035, bevelThickness: 0.025 }), "#f2bc35");
  cheese.rotation.x = -Math.PI / 2;
  cheese.rotation.z = -0.15;
  cheese.position.y = -0.105;
  group.add(cheese);

  const tomato = mesh(new THREE.CylinderGeometry(0.7, 0.74, 0.12, 48), "#c95036");
  tomato.position.y = 0.01;
  group.add(tomato);

  const upperBun = lathe([[0, 0], [0.75, 0], [0.9, 0.06], [0.92, 0.18], [0.84, 0.36], [0.68, 0.52], [0.45, 0.64], [0.2, 0.7], [0, 0.71]], "#e3a54f");
  upperBun.position.y = 0.09;
  group.add(upperBun);

  for (let index = 0; index < 15; index += 1) {
    const angle = index * 2.4;
    const radius = 0.18 + (index % 4) * 0.14;
    const surfaceHeight = 0.09 + 0.71 * Math.sqrt(Math.max(0.12, 1 - radius * radius / (0.92 * 0.92)));
    const seed = mesh(new THREE.SphereGeometry(0.035, 10, 8), "#fff0bf", 0.86);
    seed.scale.set(1.5, 0.45, 0.65);
    seed.position.set(Math.cos(angle) * radius, surfaceHeight + 0.01, Math.sin(angle) * radius);
    group.add(seed);
  }

  group.rotation.y = -0.3;
  group.userData.accent = accent;
  return group;
}

function makeSushi(accent) {
  const group = new THREE.Group();
  const rice = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.7, 48), "#f5f1e5");
  rice.rotation.z = Math.PI / 2;
  group.add(rice);
  const salmon = mesh(new THREE.BoxGeometry(0.26, 0.82, 0.74), accent || "#e57861");
  salmon.rotation.z = -0.22;
  salmon.position.y = 0.38;
  group.add(salmon);
  const nori = mesh(new THREE.BoxGeometry(0.22, 0.88, 0.76), "#183d2b");
  nori.rotation.z = -0.22;
  nori.position.y = -0.25;
  group.add(nori);
  return group;
}

function makePizza(accent) {
  const group = new THREE.Group();
  const slice = new THREE.Shape();
  slice.moveTo(0, 0);
  slice.lineTo(1.25, -0.43);
  slice.absarc(0, 0, 1.32, -0.34, 0.34, false);
  slice.closePath();
  const crust = mesh(new THREE.ExtrudeGeometry(slice, { depth: 0.16, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.055, bevelThickness: 0.06 }), "#d89449");
  crust.rotation.x = -Math.PI / 2;
  group.add(crust);
  const cheese = mesh(new THREE.CircleGeometry(1.15, 48, -0.34, 0.68), "#f1ca69");
  cheese.rotation.x = -Math.PI / 2;
  cheese.position.y = 0.13;
  group.add(cheese);
  for (const [x, z] of [[0.45, -0.1], [0.73, 0.16], [0.9, -0.05], [0.66, -0.3], [0.38, 0.24]]) {
    const topping = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 24), accent || "#bd4936");
    topping.rotation.x = Math.PI / 2;
    topping.position.set(x, 0.17, z);
    group.add(topping);
  }
  group.rotation.y = -0.4;
  return group;
}

function makeTaco(accent) {
  const group = new THREE.Group();
  const shellShape = new THREE.Shape();
  shellShape.absarc(0, 0, 0.92, Math.PI, 0, false);
  shellShape.lineTo(0.92, -0.18);
  shellShape.quadraticCurveTo(0, -0.52, -0.92, -0.18);
  shellShape.closePath();
  const shell = mesh(new THREE.ExtrudeGeometry(shellShape, { depth: 0.18, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.06, bevelThickness: 0.05 }), "#dfa444");
  shell.rotation.x = -Math.PI / 2;
  group.add(shell);
  for (let index = 0; index < 11; index += 1) {
    const angle = Math.PI + index * Math.PI / 10;
    const filling = mesh(new THREE.SphereGeometry(0.12 + (index % 3) * 0.025, 16, 12), index % 2 ? "#6f943e" : (accent || "#bb523b"));
    filling.position.set(Math.cos(angle) * 0.73, 0.2 + (index % 3) * 0.05, Math.sin(angle) * 0.42);
    group.add(filling);
  }
  return group;
}

function makeTapas(accent) {
  const group = new THREE.Group();
  for (const [x, z] of [[-0.52, -0.18], [0.5, -0.16], [0, 0.42]]) {
    const saucer = mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.08, 40), "#f5eee0", 0.3);
    saucer.position.set(x, -0.58, z);
    group.add(saucer);
  }
  for (let index = 0; index < 4; index += 1) {
    const croquette = mesh(new THREE.CapsuleGeometry(0.13, 0.42, 5, 12), "#d99d48");
    croquette.rotation.z = Math.PI / 2 + (index % 2) * 0.24;
    croquette.position.set(-0.52 + (index % 2) * 0.13, -0.34, -0.3 + Math.floor(index / 2) * 0.22);
    group.add(croquette);
  }
  for (let index = 0; index < 6; index += 1) {
    const olive = mesh(new THREE.SphereGeometry(0.105, 18, 14), index % 2 ? "#7b8e37" : "#3d6334");
    olive.position.set(0.5 + Math.cos(index * 1.04) * 0.19, -0.32, -0.16 + Math.sin(index * 1.04) * 0.19);
    group.add(olive);
  }
  const tomato = mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.1, 40), accent || "#c9583b");
  tomato.position.set(0, -0.38, 0.42);
  group.add(tomato);
  const garnish = mesh(new THREE.SphereGeometry(0.1, 18, 14), "#689044");
  garnish.position.set(0, -0.28, 0.42);
  group.add(garnish);
  return group;
}

function makeGourmet(accent) {
  const group = new THREE.Group();
  const stemware = lathe([[0, 0], [0.31, 0], [0.35, 0.04], [0.08, 0.07], [0.045, 0.16], [0.045, 0.67], [0.13, 0.68], [0.3, 0.77], [0.4, 1.05], [0.36, 1.31], [0.25, 1.45], [0, 1.48]], "#e9e4d4");
  stemware.material.transparent = true;
  stemware.material.opacity = 0.56;
  stemware.material.roughness = 0.12;
  group.add(stemware);
  const wine = lathe([[0, 0], [0.32, 0], [0.35, 0.04], [0.34, 0.16], [0.2, 0.24], [0, 0.26]], accent || "#762d42");
  wine.position.y = 0.86;
  group.add(wine);
  const plate = mesh(new THREE.TorusGeometry(0.88, 0.018, 10, 80), accent || "#c6a260");
  plate.rotation.x = Math.PI / 2;
  plate.position.set(0, -0.58, -0.12);
  group.add(plate);
  return group;
}

function makeGeneral(accent) {
  const group = new THREE.Group();
  const bowl = lathe([[0, 0], [0.62, 0], [0.84, 0.06], [0.96, 0.19], [0.9, 0.32], [0.72, 0.42], [0, 0.42]], "#e9e2d3");
  bowl.position.y = -0.55;
  group.add(bowl);
  for (let index = 0; index < 10; index += 1) {
    const angle = index * Math.PI * 2 / 10;
    const leaf = mesh(new THREE.SphereGeometry(0.2, 18, 14), index % 3 ? "#70924a" : (accent || "#d78b43"));
    leaf.scale.set(1.25, 0.45, 0.8);
    leaf.position.set(Math.cos(angle) * 0.48, -0.04 + (index % 2) * 0.08, Math.sin(angle) * 0.48);
    group.add(leaf);
  }
  const center = mesh(new THREE.SphereGeometry(0.27, 24, 18), "#d7633d");
  center.scale.set(1.2, 0.55, 0.9);
  center.position.y = 0.02;
  group.add(center);
  return group;
}

function createFood(type, accent) {
  if (type === "sushi") return makeSushi(accent);
  if (type === "italiano") return makePizza(accent);
  if (type === "mexicano") return makeTaco(accent);
  if (type === "tapas") return makeTapas(accent);
  if (type === "gourmet") return makeGourmet(accent);
  if (type === "hamburgueseria") return makeBurger(accent);
  return makeGeneral(accent);
}

export default function FoodScene({ type, accent, fallbackImage }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    let animationFrame;
    let resizeObserver;
    let food;
    let dragging = false;
    let previousX = 0;
    let pointerX = 0;
    let pointerY = 0;
    let userRotation = 0;
    let previousTime = 0;
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 2.1, 6.3);
      camera.lookAt(0, 0, 0);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.appendChild(renderer.domElement);
      host.dataset.ready = "true";
      renderer.domElement.setAttribute("aria-label", "Modelo 3D interactivo del restaurante");
      renderer.domElement.setAttribute("role", "img");

      scene.add(new THREE.HemisphereLight("#fff5e7", "#514231", 2.3));
      const keyLight = new THREE.DirectionalLight("#fff0d7", 4.1);
      keyLight.position.set(-3, 5, 4);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -3;
      keyLight.shadow.camera.right = 3;
      keyLight.shadow.camera.top = 3;
      keyLight.shadow.camera.bottom = -3;
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(accent || "#e3a54f", 30, 12);
      fillLight.position.set(3, 1, -2);
      scene.add(fillLight);
      const edgeLight = new THREE.DirectionalLight("#fffaf0", 2.1);
      edgeLight.position.set(2, 3, 5);
      scene.add(edgeLight);

      const contactShadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.68, 80),
        new THREE.MeshBasicMaterial({ color: "#1f2b22", transparent: true, opacity: 0.11, depthWrite: false })
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = -0.985;
      contactShadow.scale.set(1.18, 0.82, 1);
      scene.add(contactShadow);

      const plate = mesh(new THREE.CylinderGeometry(1.58, 1.62, 0.12, 96), "#f5f0e7", 0.18, 0.04);
      plate.position.y = -0.91;
      plate.receiveShadow = true;
      scene.add(plate);
      const plateRim = mesh(new THREE.TorusGeometry(1.39, 0.018, 12, 120), "#c59a59", 0.2, 0.62);
      plateRim.rotation.x = Math.PI / 2;
      plateRim.position.y = -0.84;
      scene.add(plateRim);
      const plateInnerRim = mesh(new THREE.TorusGeometry(1.29, 0.012, 10, 120), "#fffaf0", 0.2, 0.05);
      plateInnerRim.rotation.x = Math.PI / 2;
      plateInnerRim.position.y = -0.835;
      scene.add(plateInnerRim);

      const orbit = mesh(new THREE.TorusGeometry(1.93, 0.009, 8, 120), accent || "#d8ad70", 0.34, 0.48);
      orbit.material.transparent = true;
      orbit.material.opacity = 0.58;
      orbit.rotation.set(1.16, 0.08, -0.28);
      orbit.position.y = 0.06;
      scene.add(orbit);

      food = createFood(type, accent);
      food.position.y = 0.05;
      food.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      scene.add(food);

      const resize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const canvas = renderer.domElement;
      const onPointerDown = (event) => {
        dragging = true;
        previousX = event.clientX;
        canvas.setPointerCapture(event.pointerId);
      };
      const onPointerMove = (event) => {
        const bounds = canvas.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        if (!dragging) return;
        userRotation += (event.clientX - previousX) * 0.012;
        previousX = event.clientX;
      };
      const onPointerUp = () => { dragging = false; };
      const onPointerLeave = () => {
        if (!dragging) {
          pointerX = 0;
          pointerY = 0;
        }
      };
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerLeave);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const render = (time) => {
        animationFrame = requestAnimationFrame(render);
        const delta = Math.min((time - previousTime) / 1000, 0.05);
        previousTime = time;
        if (!dragging && !reduceMotion) {
          food.rotation.y = userRotation + Math.sin(time * 0.0003) * 0.12 + pointerX * 0.12;
          food.rotation.x = THREE.MathUtils.lerp(food.rotation.x, pointerY * 0.08, 0.06);
          food.position.y = 0.05 + Math.sin(time * 0.0012) * 0.045;
          orbit.rotation.z -= delta * 0.035;
        }
        renderer.render(scene, camera);
      };
      animationFrame = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((item) => item.dispose());
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
        delete host.dataset.ready;
      };
    } catch {
      delete host.dataset.ready;
      renderer?.dispose();
      renderer?.domElement.remove();
      return undefined;
    }
  }, [accent, type]);

  return (
    <div className="food-scene-frame">
      <div className="food-scene" ref={hostRef} />
      <div className="food-scene-fallback" aria-hidden="true">
        {fallbackImage ? <Image className="food-scene-fallback-image" src={fallbackImage} alt="" width={800} height={800} unoptimized /> : type === "hamburgueseria" ? "🍔" : type === "italiano" ? "🍕" : type === "mexicano" ? "🌮" : "🍣"}
      </div>
      <span className="food-scene-hint">Vista 3D</span>
    </div>
  );
}