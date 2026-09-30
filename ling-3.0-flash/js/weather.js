import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.rain = null;
    this.drips = null;
    this.puddles = null;
    this.streaks = null;
  }

  init() {
    this._createRain();
    this._createDrips();
    this._createPuddles();
    this._createStreaks();
  }

  _createRain() {
    const count = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this._velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      this._velocities.push({
        x: (Math.random() - 0.5) * 0.5,
        y: -(Math.random() * 3 + 4),
        z: (Math.random() - 0.5) * 0.5
      });
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.05, 0.4, 0.5 + Math.random() * 0.2);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.rain = new THREE.Points(geometry, material);
    this.scene.add(this.rain);
  }

  _createDrips() {
    this._dripPoints = [
      { x: -1.5, y: 3.6, z: 3.2 },
      { x: -0.5, y: 3.6, z: 3.2 },
      { x: 0.5, y: 3.6, z: 3.2 },
      { x: 1.5, y: 3.6, z: 3.2 },
      { x: 2.0, y: 3.6, z: 3.2 }
    ];
    this._drips = [];
    this._dripPoints.forEach(pt => {
      const geo = new THREE.SphereGeometry(0.025, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0x88aacc });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(pt.x, pt.y, pt.z);
      sphere.visible = false;
      this.scene.add(sphere);
      this._drips.push({ mesh: sphere, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 0.6, height: pt.y });
    });
  }

  _createPuddles() {
    this._puddleData = [
      { x: -1, z: 3.5, r: 0.5 },
      { x: 2, z: 2.5, r: 0.3 },
      { x: -3, z: 1, r: 0.4 },
      { x: -5, z: 2, r: 0.35 },
      { x: 3, z: 3, r: 0.25 }
    ];
    this._puddles = [];
    this._puddleData.forEach(pd => {
      const geo = new THREE.CircleGeometry(pd.r, 24);
      const mat = new THREE.MeshToonMaterial({ color: 0x335577, transparent: true, opacity: 0.45 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pd.x, 0.01, pd.z);
      this.scene.add(mesh);
      this._puddles.push({ mesh, baseY: 0.01, phase: Math.random() * Math.PI * 2 });
    });
  }

  _createStreaks() {
    this._streaks = [];
    const positions = [];
    for (let i = 0; i < 20; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 3,
        y: 1 + Math.random() * 2,
        z: 3.45 + Math.random() * 0.1,
        len: 0.2 + Math.random() * 0.4
      });
    }
    positions.forEach(pos => {
      const geo = new THREE.PlaneGeometry(0.015, pos.len);
      const mat = new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = (Math.random() - 0.5) * 0.2;
      this.scene.add(mesh);
      this._streaks.push({ mesh, speed: 0.3 + Math.random() * 0.5 });
    });
  }

  update(time) {
    if (this.rain) {
      const pos = this.rain.geometry.attributes.position.array;
      for (let i = 0; i < this._velocities.length; i++) {
        const v = this._velocities[i];
        pos[i * 3] += v.x * 0.016;
        pos[i * 3 + 1] += v.y * 0.016;
        pos[i * 3 + 2] += v.z * 0.016;
        if (pos[i * 3 + 1] < -0.5) {
          pos[i * 3] = (Math.random() - 0.5) * 30;
          pos[i * 3 + 1] = 15 + Math.random() * 5;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    if (this._drips) {
      this._drips.forEach(d => {
        const t = (Math.sin(time * d.speed + d.phase) + 1) / 2;
        if (t > 0.85 && t < 0.9) {
          d.mesh.visible = true;
          d.mesh.position.y = d.height;
        } else if (t > 0.9 && t < 0.96) {
          d.mesh.position.y = d.height - (t - 0.9) * 25;
        } else {
          d.mesh.visible = false;
        }
      });
    }

    if (this._puddles) {
      this._puddles.forEach(p => {
        const wave = Math.sin(time * 1.5 + p.phase) * 0.01;
        p.mesh.position.y = p.baseY + wave;
        p.mesh.material.opacity = 0.35 + Math.sin(time * 2 + p.phase) * 0.08;
      });
    }

    if (this._streaks) {
      this._streaks.forEach(s => {
        let y = s.mesh.position.y - time * s.speed * 0.5;
        if (y < -1) y = 3;
        s.mesh.position.y = y;
        s.mesh.material.opacity = 0.08 + Math.sin(time * 2 + s.speed) * 0.04;
      });
    }
  }

  dispose() {
    [this.rain, ...(this._drips || []).map(d => d.mesh), ...(this._puddles || []).map(p => p.mesh), ...(this._streaks || []).map(s => s.mesh)]
      .filter(Boolean)
      .forEach(m => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
        this.scene.remove(m);
      });
  }
}
