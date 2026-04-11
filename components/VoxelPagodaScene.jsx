import { useEffect, useRef } from 'react';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function createScene(container, screenEl) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0xb0c4de, 0.008);

  const camera = new THREE.PerspectiveCamera(
    60,
    Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
    0.1,
    1000,
  );
  camera.position.set(60, 50, 60);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 10, 0);
  controls.maxPolarAngle = Math.PI / 2.1;

  const ambientLight = new THREE.AmbientLight(0x6688aa, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  sunLight.position.set(50, 80, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -80;
  sunLight.shadow.camera.right = 80;
  sunLight.shadow.camera.top = 80;
  sunLight.shadow.camera.bottom = -80;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xffb6c1, 0.3);
  fillLight.position.set(-30, 20, -40);
  scene.add(fillLight);

  const voxels = new Map();

  function addVoxel(x, y, z, color) {
    const key = `${x},${y},${z}`;
    if (!voxels.has(key)) {
      voxels.set(key, { x, y, z, color });
    }
  }

  const C = {
    grass: 0x4a7c3f,
    grassLight: 0x5d8f52,
    grassDark: 0x3d6b34,
    dirt: 0x8b6914,
    sand: 0xe8d5a3,
    sandDark: 0xd4c08a,
    path: 0xc4b08a,
    pathDark: 0xa89470,
    water: 0x4a90d9,
    waterLight: 0x5ba3ec,
    waterDark: 0x3a7bc8,
    wood: 0x8b4513,
    woodDark: 0x6b3410,
    woodLight: 0xa0522d,
    roof: 0x2f1b14,
    roofAccent: 0x4a2d1f,
    gold: 0xffd700,
    goldDark: 0xdaa520,
    wall: 0xf5e6d3,
    wallAccent: 0xe8d5c0,
    pillar: 0xcc3333,
    pillarDark: 0xaa2222,
    cherryPink: 0xffb7c5,
    cherryLight: 0xffd1dc,
    cherryDark: 0xff91a4,
    cherryWhite: 0xfff0f5,
    cherryHot: 0xff69b4,
    trunk: 0x5c4033,
    trunkDark: 0x4a3228,
    green: 0x228b22,
    greenLight: 0x32cd32,
    greenDark: 0x006400,
    greenDeep: 0x004d00,
    pine: 0x2e5e3f,
    pineDark: 0x1e4e2f,
    bridgeWood: 0xa0522d,
    bridgeRail: 0xcc3333,
    stone: 0x808080,
    stoneLight: 0x909090,
    stoneDark: 0x606060,
    lanternGlow: 0xffa500,
    lanternBright: 0xffd700,
    red: 0xff4444,
    yellow: 0xffd700,
    purple: 0x9370db,
    white: 0xffffff,
    orange: 0xff8c00,
    blue: 0x4169e1,
    torii: 0xff2400,
    toriiDark: 0xcc1d00,
    fence: 0xf5f5dc,
    fenceDark: 0xd4c4a8,
    rock: 0x696969,
    rockLight: 0x808080,
    rockDark: 0x505050,
    moss: 0x556b2f,
    cloud: 0xffffff,
    cloudShadow: 0xe8e8e8,
    koiOrange: 0xff6b35,
    koiWhite: 0xfff8dc,
    koiRed: 0xdc143c,
    bamboo: 0x7cb342,
    bambooDark: 0x558b2f,
    bambooLight: 0x9ccc65,
    maple: 0xff4500,
    mapleLight: 0xff6347,
    mapleDark: 0xcc3700,
    mapleYellow: 0xffd700,
  };

  function box(x, y, z, w, h, d, color) {
    for (let i = 0; i < w; i += 1) {
      for (let j = 0; j < h; j += 1) {
        for (let k = 0; k < d; k += 1) {
          addVoxel(x + i, y + j, z + k, color);
        }
      }
    }
  }

  function cylinder(cx, cy, cz, radius, height, color) {
    for (let j = 0; j < height; j += 1) {
      for (let i = -radius; i <= radius; i += 1) {
        for (let k = -radius; k <= radius; k += 1) {
          if (i * i + k * k <= radius * radius) {
            addVoxel(cx + i, cy + j, cz + k, color);
          }
        }
      }
    }
  }

  function sphere(cx, cy, cz, radius, color, variation) {
    for (let i = -radius; i <= radius; i += 1) {
      for (let j = -radius; j <= radius; j += 1) {
        for (let k = -radius; k <= radius; k += 1) {
          if (i * i + j * j + k * k <= radius * radius) {
            const voxelColor = variation ? variation(i, j, k) : color;
            addVoxel(cx + i, cy + j, cz + k, voxelColor);
          }
        }
      }
    }
  }

  function noise2D(x, z, seed = 0) {
    const n = Math.sin(x * 12.9898 + z * 78.233 + seed * 45.164) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothNoise(x, z, seed = 0) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const a = noise2D(ix, iz, seed);
    const b = noise2D(ix + 1, iz, seed);
    const c = noise2D(ix, iz + 1, seed);
    const d = noise2D(ix + 1, iz + 1, seed);
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);
    return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
  }

  const groundSize = 55;
  for (let x = -groundSize; x <= groundSize; x += 1) {
    for (let z = -groundSize; z <= groundSize; z += 1) {
      const n = smoothNoise(x * 0.1, z * 0.1, 42);
      const n2 = smoothNoise(x * 0.05, z * 0.05, 99);
      let color;
      if (n < 0.3) color = C.grassDark;
      else if (n < 0.5) color = C.grass;
      else if (n < 0.7) color = C.grassLight;
      else color = C.grass;
      const heightVar = Math.floor(n2 * 2);
      for (let h = -2; h <= heightVar; h += 1) {
        addVoxel(x, h, z, h === heightVar ? color : C.dirt);
      }
    }
  }

  for (let x = 20; x <= 35; x += 1) {
    for (let z = -25; z <= -10; z += 1) {
      const n = smoothNoise(x * 0.3, z * 0.3, 77);
      addVoxel(x, 0, z, n > 0.5 ? C.sand : C.sandDark);
      if (Math.floor(z / 2) % 2 === 0) {
        addVoxel(x, 1, z, C.sand);
      }
    }
  }

  const pondCx = -25;
  const pondCz = -20;
  for (let x = -groundSize; x <= groundSize; x += 1) {
    for (let z = -groundSize; z <= groundSize; z += 1) {
      const dx = x - pondCx;
      const dz = z - pondCz;
      const dist = Math.sqrt((dx / 12) ** 2 + (dz / 9) ** 2);
      if (dist < 1) {
        const n = smoothNoise(x * 0.2, z * 0.2, 55);
        addVoxel(x, -1, z, n > 0.6 ? C.waterLight : n < 0.3 ? C.waterDark : C.water);
        addVoxel(x, -2, z, C.waterDark);
      } else if (dist < 1.15) {
        const n = smoothNoise(x * 0.5, z * 0.5, 88);
        addVoxel(x, 0, z, n > 0.5 ? C.rock : C.rockDark);
      }
    }
  }

  function addKoi(x, y, z, dir, colors) {
    const dx = dir === 'x' ? 1 : 0;
    const dz = dir === 'z' ? 1 : 0;
    for (let i = 0; i < 4; i += 1) addVoxel(x + dx * i, y, z + dz * i, colors[i % colors.length]);
    addVoxel(x - dx, y, z - dz, colors[0]);
    addVoxel(x - dx, y, z + dz, colors[0]);
  }

  addKoi(-25, 0, -20, 'x', [C.koiOrange, C.koiWhite, C.koiOrange, C.koiRed]);
  addKoi(-22, 0, -18, 'z', [C.koiWhite, C.koiOrange, C.koiWhite, C.koiWhite]);
  addKoi(-28, 0, -22, 'x', [C.koiRed, C.koiWhite, C.koiRed, C.koiOrange]);

  function createPath(points, width, color) {
    for (let p = 0; p < points.length - 1; p += 1) {
      const s = points[p];
      const e = points[p + 1];
      const steps = Math.max(Math.abs(e.x - s.x), Math.abs(e.z - s.z)) * 2;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const px = Math.round(s.x + (e.x - s.x) * t);
        const pz = Math.round(s.z + (e.z - s.z) * t);
        for (let w = -width; w <= width; w += 1) {
          const nx = px + (e.z !== s.z ? w : 0);
          const nz = pz + (e.x !== s.x ? w : 0);
          addVoxel(nx, 1, nz, smoothNoise(nx * 0.4, nz * 0.4, 33) > 0.5 ? color : C.pathDark);
        }
      }
    }
  }

  createPath([{ x: 0, z: 50 }, { x: 0, z: 30 }, { x: 0, z: 18 }], 2, C.path);
  createPath([{ x: -15, z: 0 }, { x: -5, z: 0 }, { x: 0, z: 5 }], 1, C.path);
  createPath([{ x: 15, z: 0 }, { x: 5, z: 0 }, { x: 0, z: 5 }], 1, C.path);

  function buildPagoda(cx, cz) {
    const baseY = 2;
    box(cx - 12, baseY, cz - 12, 24, 2, 24, C.stone);
    box(cx - 11, baseY + 2, cz - 11, 22, 1, 22, C.stoneLight);

    const stories = [
      { y: baseY + 3, w: 10, rw: 14, h: 7 },
      { y: baseY + 12, w: 8, rw: 12, h: 6 },
      { y: baseY + 20, w: 7, rw: 10, h: 5 },
      { y: baseY + 27, w: 6, rw: 9, h: 5 },
      { y: baseY + 34, w: 5, rw: 8, h: 4 },
    ];

    stories.forEach((story) => {
      const { y, w, rw, h } = story;
      for (let wy = 0; wy < h; wy += 1) {
        for (let wx = -Math.floor(w / 2); wx <= Math.floor(w / 2); wx += 1) {
          for (let wz = -Math.floor(w / 2); wz <= Math.floor(w / 2); wz += 1) {
            const isEdge = Math.abs(wx) === Math.floor(w / 2) || Math.abs(wz) === Math.floor(w / 2);
            if (isEdge) {
              const isCorner =
                Math.abs(wx) === Math.floor(w / 2) && Math.abs(wz) === Math.floor(w / 2);
              const isWindow = !isCorner && wy >= 2 && wy <= 4 && (wx % 3 === 0 || wz % 3 === 0);
              if (isCorner) addVoxel(cx + wx, y + wy, cz + wz, C.pillar);
              else if (isWindow) addVoxel(cx + wx, y + wy, cz + wz, C.wallAccent);
              else addVoxel(cx + wx, y + wy, cz + wz, C.wall);
            } else if (wy === 0 || wy === h - 1) {
              addVoxel(cx + wx, y + wy, cz + wz, C.wood);
            }
          }
        }
      }

      const bw = Math.floor(w / 2) + 1;
      for (let rx = -bw; rx <= bw; rx += 1) {
        for (let rz = -bw; rz <= bw; rz += 1) {
          if (Math.abs(rx) === bw || Math.abs(rz) === bw) {
            addVoxel(cx + rx, y, cz + rz, C.woodDark);
            if ((rx + rz) % 2 === 0) addVoxel(cx + rx, y + 1, cz + rz, C.woodDark);
          }
        }
      }

      const roofY = y + h;
      for (let ry = 0; ry < 3; ry += 1) {
        const crw = rw - ry * 2;
        for (let rx = -crw; rx <= crw; rx += 1) {
          for (let rz = -crw; rz <= crw; rz += 1) {
            const isEdge = Math.abs(rx) === crw || Math.abs(rz) === crw;
            const isCorner = Math.abs(rx) === crw && Math.abs(rz) === crw;
            if (ry < 2 || isEdge) {
              let lift = 0;
              if (isCorner) {
                lift = 1;
                if (Math.abs(rx) > crw - 2 && Math.abs(rz) > crw - 2) lift = 2;
              }
              addVoxel(cx + rx, roofY + ry + lift, cz + rz, ry === 0 ? C.roof : C.roofAccent);
            }
          }
        }
      }

      for (let rx = -rw; rx <= rw; rx += 1) {
        addVoxel(cx + rx, roofY, cz + rw, C.goldDark);
        addVoxel(cx + rx, roofY, cz - rw, C.goldDark);
        addVoxel(cx + rw, roofY, cz + rx, C.goldDark);
        addVoxel(cx - rw, roofY, cz + rx, C.goldDark);
      }
    });

    const spireBase = baseY + 34 + 4 + 3;
    cylinder(cx, spireBase, cz, 1, 12, C.gold);
    for (let r = 0; r < 7; r += 1) {
      const ry = spireBase + 2 + r * 1.5;
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        addVoxel(cx + Math.round(Math.cos(a) * 2), ry, cz + Math.round(Math.sin(a) * 2), C.gold);
      }
    }
    sphere(cx, spireBase + 14, cz, 2, C.gold);
    addVoxel(cx, spireBase + 17, cz, C.gold);
    addVoxel(cx, spireBase + 18, cz, C.gold);
  }

  buildPagoda(0, 0);

  function buildCherryTree(x, z, scale = 1) {
    const trunkH = Math.round(8 * scale);
    const canopyR = Math.round(6 * scale);

    for (let y = 0; y < trunkH; y += 1) {
      const tx = x + Math.round(Math.sin(y * 0.3) * 1.5);
      const r = y < 2 ? 2 : 1;
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dz = -r; dz <= r; dz += 1) {
          if (dx * dx + dz * dz <= r * r + 1) {
            addVoxel(
              tx + dx,
              y + 2,
              z + dz,
              noise2D(dx + y, dz + y, 123) > 0.5 ? C.trunk : C.trunkDark,
            );
          }
        }
      }
    }

    const branches = [
      { dx: 3, dz: 0, dy: 2 },
      { dx: -3, dz: 1, dy: 3 },
      { dx: 1, dz: 3, dy: 1 },
      { dx: -2, dz: -3, dy: 2 },
      { dx: 2, dz: -2, dy: 1 },
    ];
    const topY = trunkH + 2;
    branches.forEach((b) => {
      const len = Math.round(4 * scale);
      for (let t = 0; t < len; t += 1) {
        const bx = x + Math.round((b.dx * t) / len * scale * 2);
        const bz = z + Math.round((b.dz * t) / len * scale * 2);
        const by = topY + Math.round((b.dy * t) / len);
        addVoxel(bx, by, bz, C.trunk);
        addVoxel(bx, by + 1, bz, C.trunk);
      }
    });

    const cherryVar = (dx, dy, dz) => {
      const n = noise2D(dx, dy + dz, 456);
      if (n < 0.15) return C.cherryDark;
      if (n < 0.35) return C.cherryPink;
      if (n < 0.55) return C.cherryLight;
      if (n < 0.75) return C.cherryWhite;
      if (n < 0.9) return C.cherryPink;
      return C.cherryHot;
    };

    const blobs = [
      { x: 0, y: canopyR * 0.5, z: 0, r: canopyR },
      { x: 3, y: canopyR * 0.3, z: 1, r: canopyR * 0.7 },
      { x: -3, y: canopyR * 0.4, z: -1, r: canopyR * 0.75 },
      { x: 1, y: canopyR * 0.7, z: 3, r: canopyR * 0.65 },
      { x: -2, y: canopyR * 0.2, z: -3, r: canopyR * 0.7 },
      { x: 2, y: -canopyR * 0.2, z: -2, r: canopyR * 0.6 },
      { x: -1, y: canopyR * 0.6, z: 2, r: canopyR * 0.55 },
    ];
    blobs.forEach((b) => {
      sphere(x + b.x, topY + b.y, z + b.z, Math.max(1, Math.round(b.r)), null, cherryVar);
    });
  }

  buildCherryTree(18, 15, 1.2);
  buildCherryTree(-18, 12, 1.0);
  buildCherryTree(25, -5, 0.9);
  buildCherryTree(-30, 5, 1.1);
  buildCherryTree(10, -25, 0.8);
  buildCherryTree(-12, -30, 1.0);
  buildCherryTree(35, 10, 0.85);
  buildCherryTree(-35, -10, 0.95);

  function buildGreenTree(x, z, scale = 1) {
    const trunkH = Math.round(6 * scale);
    for (let y = 0; y < trunkH; y += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          addVoxel(x + dx, y + 2, z + dz, C.trunk);
        }
      }
    }

    const greenVar = (dx, dy, dz) => {
      const n = noise2D(dx, dy + dz, 789);
      if (n < 0.25) return C.greenDark;
      if (n < 0.5) return C.green;
      if (n < 0.75) return C.greenLight;
      return C.green;
    };

    const layers = [
      { y: trunkH + 2, r: Math.round(5 * scale) },
      { y: trunkH + 5, r: Math.round(4 * scale) },
      { y: trunkH + 7, r: Math.round(3 * scale) },
      { y: trunkH + 9, r: Math.round(2 * scale) },
    ];
    layers.forEach((l) => {
      sphere(x, l.y, z, Math.max(1, l.r), null, greenVar);
    });
  }

  buildGreenTree(-40, 20, 1.1);
  buildGreenTree(40, -15, 1.0);
  buildGreenTree(-45, -25, 1.2);
  buildGreenTree(45, 25, 0.9);
  buildGreenTree(-20, 35, 1.0);
  buildGreenTree(30, 35, 1.1);

  function buildPineTree(x, z, scale = 1) {
    const trunkH = Math.round(4 * scale);
    for (let y = 0; y < trunkH; y += 1) {
      addVoxel(x, y + 2, z, C.trunkDark);
    }

    const pineVar = (dx, dy, dz) => {
      const n = noise2D(dx, dy + dz, 321);
      return n > 0.5 ? C.pine : C.pineDark;
    };

    const layers = [
      { y: trunkH + 1, r: Math.round(5 * scale) },
      { y: trunkH + 3, r: Math.round(4 * scale) },
      { y: trunkH + 5, r: Math.round(3 * scale) },
      { y: trunkH + 7, r: Math.round(2 * scale) },
      { y: trunkH + 8, r: Math.round(1 * scale) },
    ];
    layers.forEach((l) => {
      sphere(x, l.y, z, Math.max(1, l.r), null, pineVar);
    });
  }

  buildPineTree(-42, -5, 1.0);
  buildPineTree(42, 5, 1.1);
  buildPineTree(-38, 30, 0.9);
  buildPineTree(38, -30, 1.0);

  function buildMapleTree(x, z, scale = 1) {
    const trunkH = Math.round(7 * scale);
    for (let y = 0; y < trunkH; y += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          addVoxel(x + dx, y + 2, z + dz, C.trunk);
        }
      }
    }

    const mapleVar = (dx, dy, dz) => {
      const n = noise2D(dx, dy + dz, 654);
      if (n < 0.2) return C.mapleDark;
      if (n < 0.4) return C.maple;
      if (n < 0.6) return C.mapleLight;
      if (n < 0.8) return C.mapleYellow;
      return C.maple;
    };

    const blobs = [
      { x: 0, y: 4, z: 0, r: 5 },
      { x: 3, y: 3, z: 1, r: 3 },
      { x: -3, y: 3, z: -1, r: 3.5 },
      { x: 1, y: 5, z: 3, r: 3 },
      { x: -2, y: 2, z: -3, r: 3 },
    ];
    blobs.forEach((b) => {
      sphere(x + b.x, trunkH + b.y, z + b.z, Math.round(b.r * scale), null, mapleVar);
    });
  }

  buildMapleTree(30, -20, 1.0);
  buildMapleTree(-35, 25, 0.9);

  function buildTorii(x, z, rot = 0) {
    const isX = rot % 2 === 0;
    void isX;

    for (let y = 0; y < 10; y += 1) {
      addVoxel(x - 4, y + 2, z, C.torii);
      addVoxel(x - 3, y + 2, z, C.torii);
      addVoxel(x + 4, y + 2, z, C.torii);
      addVoxel(x + 3, y + 2, z, C.torii);
    }

    for (let bx = -5; bx <= 5; bx += 1) {
      addVoxel(x + bx, 12, z, C.torii);
      addVoxel(x + bx, 13, z, C.toriiDark);
    }

    for (let bx = -4; bx <= 4; bx += 1) {
      addVoxel(x + bx, 10, z, C.torii);
    }

    addVoxel(x, 11, z, C.torii);
    addVoxel(x, 10, z, C.torii);
  }

  buildTorii(0, 40, 0);
  buildTorii(-40, 0, 1);

  function buildLantern(x, z) {
    box(x - 1, 2, z - 1, 3, 1, 3, C.stoneDark);
    box(x, 3, z, 1, 4, 1, C.stone);
    box(x - 1, 7, z - 1, 3, 3, 3, C.stoneLight);
    addVoxel(x, 7, z, C.lanternGlow);
    addVoxel(x, 8, z, C.lanternBright);
    addVoxel(x, 7, z + 1, C.lanternGlow);
    addVoxel(x, 7, z - 1, C.lanternGlow);
    addVoxel(x + 1, 7, z, C.lanternGlow);
    addVoxel(x - 1, 7, z, C.lanternGlow);
    box(x - 2, 10, z - 2, 5, 1, 5, C.stone);
    box(x - 1, 11, z - 1, 3, 1, 3, C.stoneDark);
    addVoxel(x, 12, z, C.stoneDark);
  }

  buildLantern(8, 18);
  buildLantern(-8, 18);
  buildLantern(8, -18);
  buildLantern(-8, -18);
  buildLantern(15, 0);
  buildLantern(-15, 0);
  buildLantern(-18, -15);
  buildLantern(22, -15);

  function buildBridge(x, z) {
    const archPoints = [];
    for (let i = -6; i <= 6; i += 1) {
      const height = Math.round(3 - Math.abs(i) * 0.3);
      archPoints.push({ x: x + i, y: 2 + height, z });
    }

    archPoints.forEach((p) => {
      addVoxel(p.x, p.y, p.z, C.bridgeWood);
      addVoxel(p.x, p.y, p.z - 1, C.bridgeWood);
      addVoxel(p.x, p.y, p.z + 1, C.bridgeWood);
      addVoxel(p.x, p.y + 1, p.z - 1, C.bridgeRail);
      addVoxel(p.x, p.y + 1, p.z + 1, C.bridgeRail);
      addVoxel(p.x, p.y + 2, p.z - 1, C.bridgeRail);
      addVoxel(p.x, p.y + 2, p.z + 1, C.bridgeRail);
    });

    addVoxel(x - 6, 2, z - 1, C.stone);
    addVoxel(x - 6, 2, z + 1, C.stone);
    addVoxel(x + 6, 2, z - 1, C.stone);
    addVoxel(x + 6, 2, z + 1, C.stone);
  }

  buildBridge(-25, -10);

  function buildBamboo(x, z, height = 12) {
    for (let y = 0; y < height; y += 1) {
      const n = noise2D(x, y, 111);
      const c = n > 0.6 ? C.bambooLight : n > 0.3 ? C.bamboo : C.bambooDark;
      addVoxel(x, y + 2, z, c);
      if (y % 4 === 0) {
        addVoxel(x + 1, y + 2, z, c);
        addVoxel(x - 1, y + 2, z, c);
        addVoxel(x, y + 2, z + 1, c);
        addVoxel(x, y + 2, z - 1, c);
      }
    }
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dz = -2; dz <= 2; dz += 1) {
        if (Math.abs(dx) + Math.abs(dz) <= 3) {
          addVoxel(x + dx, height + 2, z + dz, C.bambooLight);
        }
      }
    }
  }

  for (let i = 0; i < 8; i += 1) {
    const bx = 35 + Math.round(noise2D(i, 0, 222) * 6 - 3);
    const bz = 20 + Math.round(noise2D(0, i, 333) * 6 - 3);
    buildBamboo(bx, bz, 10 + Math.round(noise2D(i, i, 444) * 5));
  }

  function buildFlowerPatch(cx, cz, radius, colors) {
    for (let x = -radius; x <= radius; x += 1) {
      for (let z = -radius; z <= radius; z += 1) {
        if (x * x + z * z <= radius * radius) {
          const n = noise2D(x + cx, z + cz, 555);
          if (n > 0.4) {
            const c = colors[Math.floor((n * colors.length) % colors.length)];
            addVoxel(cx + x, 2, cz + z, c);
            if (n > 0.6) addVoxel(cx + x, 3, cz + z, c);
          }
        }
      }
    }
  }

  buildFlowerPatch(12, 25, 3, [C.red, C.yellow, C.purple, C.white, C.orange]);
  buildFlowerPatch(-12, 25, 3, [C.blue, C.purple, C.white, C.cherryPink]);
  buildFlowerPatch(25, 25, 2, [C.red, C.orange, C.yellow]);
  buildFlowerPatch(-30, -30, 3, [C.purple, C.cherryPink, C.white]);
  buildFlowerPatch(40, 0, 2, [C.yellow, C.orange, C.red]);

  function buildRock(x, z, size) {
    const rockVar = (dx, dy, dz) => {
      const n = noise2D(dx, dy + dz, 666);
      if (dy < 0 && n > 0.6) return C.moss;
      if (n > 0.7) return C.rockLight;
      if (n < 0.3) return C.rockDark;
      return C.rock;
    };
    sphere(x, size, z, size, null, rockVar);
  }

  buildRock(15, -10, 3);
  buildRock(-15, -8, 2);
  buildRock(20, 5, 2);
  buildRock(-10, -35, 3);
  buildRock(35, -10, 2);
  buildRock(-45, 10, 4);
  buildRock(45, -5, 3);

  for (let i = 0; i < 15; i += 1) {
    const angle = (i / 15) * Math.PI * 2;
    const rx = pondCx + Math.round(Math.cos(angle) * 13);
    const rz = pondCz + Math.round(Math.sin(angle) * 10);
    const n = noise2D(rx, rz, 777);
    if (n > 0.5) buildRock(rx, rz, 1);
  }

  function buildFence(startX, startZ, endX, endZ) {
    const dx = Math.sign(endX - startX);
    const dz = Math.sign(endZ - startZ);
    const len = Math.max(Math.abs(endX - startX), Math.abs(endZ - startZ));

    for (let i = 0; i <= len; i += 1) {
      const fx = startX + dx * i;
      const fz = startZ + dz * i;
      addVoxel(fx, 2, fz, C.fence);
      addVoxel(fx, 3, fz, C.fence);
      addVoxel(fx, 4, fz, C.fenceDark);
      if (i < len) {
        addVoxel(fx + dx / 2, 3, fz + dz / 2, C.fenceDark);
      }
    }
  }

  buildFence(-20, 30, 20, 30);
  buildFence(-20, -35, 20, -35);

  function buildWell(x, z) {
    cylinder(x, 2, z, 3, 4, C.stone, true);
    addVoxel(x, 2, z, C.water);
    addVoxel(x + 1, 2, z, C.water);
    addVoxel(x - 1, 2, z, C.water);
    addVoxel(x, 2, z + 1, C.water);
    addVoxel(x, 2, z - 1, C.water);
    addVoxel(x - 2, 6, z, C.wood);
    addVoxel(x + 2, 6, z, C.wood);
    addVoxel(x - 2, 7, z, C.wood);
    addVoxel(x + 2, 7, z, C.wood);
    for (let rx = -3; rx <= 3; rx += 1) {
      addVoxel(x + rx, 8, z, C.roof);
    }
    for (let rx = -2; rx <= 2; rx += 1) {
      addVoxel(x + rx, 9, z, C.roofAccent);
    }
    addVoxel(x, 10, z, C.roofAccent);
  }

  buildWell(25, 15);

  function buildCloud(x, y, z, size) {
    const cloudVar = (dx, dy, dz) => {
      const n = noise2D(dx, dy + dz, 888);
      return n > 0.5 ? C.cloud : C.cloudShadow;
    };
    const blobs = [
      { x: 0, y: 0, z: 0, r: size },
      { x: size, y: -1, z: 0, r: size * 0.7 },
      { x: -size * 0.8, y: 0, z: 1, r: size * 0.6 },
      { x: size * 0.5, y: 1, z: -1, r: size * 0.5 },
    ];
    blobs.forEach((b) => {
      sphere(x + b.x, y + b.y, z + b.z, Math.max(1, Math.round(b.r)), null, cloudVar);
    });
  }

  buildCloud(20, 60, -30, 4);
  buildCloud(-30, 65, 20, 3);
  buildCloud(40, 58, 10, 3.5);
  buildCloud(-15, 62, -40, 4);
  buildCloud(10, 63, 40, 3);
  buildCloud(-40, 60, -20, 3.5);

  box(-2, 5, -1, 5, 1, 3, C.woodDark);
  addVoxel(0, 6, 0, C.gold);
  addVoxel(0, 7, 0, C.gold);
  addVoxel(-1, 6, 0, C.goldDark);
  addVoxel(1, 6, 0, C.goldDark);

  const lanternPositions = [
    [8, 9, 18],
    [-8, 9, 18],
    [8, 9, -18],
    [-8, 9, -18],
    [15, 9, 0],
    [-15, 9, 0],
    [-18, 9, -15],
    [22, 9, -15],
  ];
  lanternPositions.forEach((pos) => {
    const light = new THREE.PointLight(0xffa500, 0.5, 15);
    light.position.set(pos[0], pos[1], pos[2]);
    scene.add(light);
  });

  const voxelArray = Array.from(voxels.values());
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1 });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, voxelArray.length);
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  voxelArray.forEach((v, i) => {
    dummy.position.set(v.x, v.y, v.z);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
    color.setHex(v.color);
    instancedMesh.setColorAt(i, color);
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.instanceColor.needsUpdate = true;
  scene.add(instancedMesh);

  const petalCount = 200;
  const petalGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4);
  const petalMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
  const petalData = [];

  for (let i = 0; i < petalCount; i += 1) {
    petalData.push({
      x: (Math.random() - 0.5) * 100,
      y: 30 + Math.random() * 30,
      z: (Math.random() - 0.5) * 100,
      speed: 0.02 + Math.random() * 0.04,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      rotSpeed: 0.02 + Math.random() * 0.05,
    });
    const c = new THREE.Color(
      [C.cherryPink, C.cherryLight, C.cherryWhite, C.cherryHot][Math.floor(Math.random() * 4)],
    );
    petals.setColorAt(i, c);
  }
  petals.instanceColor.needsUpdate = true;
  scene.add(petals);

  const clock = new THREE.Clock();
  const screenAnchor = new THREE.Vector3(0, 41, 7);
  const projected = new THREE.Vector3();
  let frameId = 0;

  function updateScreenAnchor() {
    if (!screenEl) return;

    projected.copy(screenAnchor).project(camera);
    const x = (projected.x * 0.5 + 0.5) * container.clientWidth;
    const y = (-projected.y * 0.5 + 0.5) * container.clientHeight;
    const distance = camera.position.distanceTo(screenAnchor);
    const scale = clamp(1.35 - distance / 135, 0.62, 1.02);
    const visible =
      projected.z > -1 &&
      projected.z < 1 &&
      x > -220 &&
      x < container.clientWidth + 220 &&
      y > -160 &&
      y < container.clientHeight + 160;

    screenEl.style.opacity = visible ? '1' : '0';
    screenEl.style.transform =
      `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
  }

  function animate() {
    frameId = window.requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    controls.update();

    const pd = new THREE.Object3D();
    petalData.forEach((p, i) => {
      p.y -= p.speed;
      p.x += Math.sin(t * p.swaySpeed + p.sway) * 0.02;
      p.z += Math.cos(t * p.swaySpeed + p.sway) * 0.015;
      if (p.y < 0) {
        p.y = 30 + Math.random() * 30;
        p.x = (Math.random() - 0.5) * 100;
        p.z = (Math.random() - 0.5) * 100;
      }
      pd.position.set(p.x, p.y, p.z);
      pd.rotation.set(t * p.rotSpeed, t * p.rotSpeed * 1.3, t * p.rotSpeed * 0.7);
      pd.scale.setScalar(0.8 + Math.sin(t + i) * 0.2);
      pd.updateMatrix();
      petals.setMatrixAt(i, pd.matrix);
    });
    petals.instanceMatrix.needsUpdate = true;

    voxelArray.forEach((v, i) => {
      if (v.color === C.water || v.color === C.waterLight || v.color === C.waterDark) {
        const shimmer = Math.sin(t * 2 + v.x * 0.5 + v.z * 0.3) * 0.05;
        const baseColor = new THREE.Color(v.color);
        baseColor.offsetHSL(0, 0, shimmer);
        instancedMesh.setColorAt(i, baseColor);
      }
    });
    instancedMesh.instanceColor.needsUpdate = true;

    updateScreenAnchor();
    renderer.render(scene, camera);
  }

  function handleResize() {
    camera.aspect = Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2));
    updateScreenAnchor();
  }

  window.addEventListener('resize', handleResize);
  updateScreenAnchor();
  animate();

  return () => {
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', handleResize);
    controls.dispose();
    geometry.dispose();
    material.dispose();
    petalGeo.dispose();
    petalMat.dispose();
    renderer.dispose();
    scene.clear();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  };
}

export default function VoxelPagodaScene({ statusBoard }) {
  const containerRef = useRef(null);
  const screenRef = useRef(null);

  useEffect(() => {
    let disposeScene = null;
    let cancelled = false;

    async function mountScene() {
      if (!containerRef.current) return;
      disposeScene = await createScene(containerRef.current, screenRef.current);
      if (cancelled && disposeScene) {
        disposeScene();
      }
    }

    mountScene();

    return () => {
      cancelled = true;
      if (disposeScene) disposeScene();
    };
  }, []);

  return (
    <div className="pagoda-stage" aria-hidden="true">
      <div ref={containerRef} className="pagoda-stage__canvas" />
      <div ref={screenRef} className="pagoda-stage__screen-anchor">
        {statusBoard}
      </div>
      <div className="pagoda-stage__vignette" />
    </div>
  );
}
