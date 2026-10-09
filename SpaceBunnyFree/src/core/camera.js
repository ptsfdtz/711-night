import * as THREE from 'three';
import { clamp, damp, lerp } from './utils.js';

/* ------------------------------------------------------------------ *
 *  A small, dependency-free orbit rig tuned for "hold it in your hand
 *  and look around a miniature": drag to spin, wheel/pinch to zoom,
 *  right-drag or two-finger drag to pan, with inertia + soft limits.
 * ------------------------------------------------------------------ */

export class MiniatureControls {
  constructor(camera, domElement, opts = {}) {
    this.camera = camera;
    this.dom = domElement;

    this.target = opts.target ? opts.target.clone() : new THREE.Vector3();
    this._targetGoal = this.target.clone();

    this.minDistance = opts.minDistance ?? 8;
    this.maxDistance = opts.maxDistance ?? 60;
    this.minPolar = opts.minPolar ?? 0.18;
    this.maxPolar = opts.maxPolar ?? 1.44; // stay just above the ground
    this.panLimit = opts.panLimit ?? 9;
    this.enabled = true;

    // Spherical state
    this._spherical = new THREE.Spherical();
    this._sphericalGoal = new THREE.Spherical();
    this._panGoal = new THREE.Vector3();

    this.rotateSpeed = 0.0052;
    this.zoomSpeed = 0.0011;
    this.panSpeed = 0.0022;
    this.damping = 0.12;

    this.idleSpin = opts.idleSpin ?? 0.0;
    this._idleTime = 0;
    this._userTouched = false;

    this._pointers = new Map();
    this._prevPinch = 0;
    this._mode = null;
    this._offset = new THREE.Vector3();

    this._bind();
    this._syncFromCamera();
  }

  _bind() {
    const dom = this.dom;
    const onDown = (e) => {
      if (!this.enabled) return;
      dom.setPointerCapture?.(e.pointerId);
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this._markUser();
      if (this._pointers.size === 1) {
        this._mode = e.button === 2 || e.shiftKey ? 'pan' : 'rotate';
      } else if (this._pointers.size === 2) {
        this._mode = 'pinch';
        this._prevPinch = this._pinchDistance();
      }
      dom.classList.add('dragging');
    };
    const onMove = (e) => {
      const p = this._pointers.get(e.pointerId);
      if (!p || !this.enabled) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;

      if (this._mode === 'rotate' && this._pointers.size === 1) {
        this._sphericalGoal.theta -= dx * this.rotateSpeed;
        this._sphericalGoal.phi = clamp(this._sphericalGoal.phi - dy * this.rotateSpeed, this.minPolar, this.maxPolar);
      } else if (this._mode === 'pan') {
        this._panBy(dx, dy);
      } else if (this._mode === 'pinch' && this._pointers.size === 2) {
        const d = this._pinchDistance();
        const delta = d - this._prevPinch;
        this._prevPinch = d;
        this._dolly(delta * 0.006);
        this._panBy(dx * 0.5, dy * 0.5);
      }
    };
    const onUp = (e) => {
      this._pointers.delete(e.pointerId);
      if (this._pointers.size === 0) this._mode = null;
      else if (this._pointers.size === 1) this._mode = 'rotate';
      dom.releasePointerCapture?.(e.pointerId);
      dom.classList.remove('dragging');
    };

    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this._markUser();
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
        this._dolly(e.deltaY * unit * this.zoomSpeed);
      },
      { passive: false }
    );

    // Touch: two-finger tap toggles nothing UI-wise, just prevent page zoom.
    dom.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    dom.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  _pinchDistance() {
    const it = [...this._pointers.values()];
    if (it.length < 2) return 0;
    return Math.hypot(it[0].x - it[1].x, it[0].y - it[1].y);
  }

  _markUser() {
    this._userTouched = true;
    this._idleTime = 0;
  }

  _dolly(amount) {
    this._sphericalGoal.radius = clamp(
      this._sphericalGoal.radius * (1 + amount),
      this.minDistance,
      this.maxDistance
    );
  }

  _panBy(dx, dy) {
    const cam = this.camera;
    this._offset.copy(this._targetGoal).sub(cam.position);
    const dist = this._offset.length() * this.panSpeed;
    // camera-right and camera-up on the ground-ish plane
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 1);
    const move = new THREE.Vector3()
      .addScaledVector(right, -dx * dist)
      .addScaledVector(up, dy * dist);
    // Keep panning on the horizontal plane so the model never flies away.
    move.y = 0;
    this._panGoal.add(move);
    const lim = this.panLimit;
    this._panGoal.x = clamp(this._panGoal.x, this.target.x - lim, this.target.x + lim);
    this._panGoal.z = clamp(this._panGoal.z, this.target.z - lim, this.target.z + lim);
    this._panGoal.y = this.target.y;
  }

  _syncFromCamera() {
    this._offset.copy(this.camera.position).sub(this.target);
    this._spherical.setFromVector3(this._offset);
    this._sphericalGoal.copy(this._spherical);
    this._panGoal.copy(this.target);
  }

  update(dt) {
    // Gentle idle drift until the viewer takes over for the first time.
    if (!this._userTouched && this.idleSpin > 0) {
      this._idleTime += dt;
      if (this._idleTime > 1.2) {
        this._sphericalGoal.theta += this.idleSpin * dt * Math.min(1, (this._idleTime - 1.2) * 0.7);
      }
    }

    const k = 1 - Math.exp(-(60 * this.damping) * Math.min(dt, 0.05));
    this._spherical.radius = lerp(this._spherical.radius, this._sphericalGoal.radius, k);
    this._spherical.theta = lerp(this._spherical.theta, this._sphericalGoal.theta, k);
    this._spherical.phi = lerp(this._spherical.phi, this._sphericalGoal.phi, k);
    this._spherical.makeSafe();

    this.target.lerp(this._panGoal, k);
    this._targetGoal.lerp(this._panGoal, k);

    this._offset.setFromSpherical(this._spherical);
    // add a subtle idle "breathing" so the frame is never truly static
    this.camera.position.copy(this.target).add(this._offset);
    this.camera.lookAt(this.target);
  }

  setLimits({ minDistance, maxDistance, minPolar, maxPolar }) {
    if (minDistance !== undefined) this.minDistance = minDistance;
    if (maxDistance !== undefined) this.maxDistance = maxDistance;
    if (minPolar !== undefined) this.minPolar = minPolar;
    if (maxPolar !== undefined) this.maxPolar = maxPolar;
  }

  get distance() {
    return this._spherical.radius;
  }

  get azimuth() {
    return this._spherical.theta;
  }

  get polar() {
    return this._spherical.phi;
  }

  spin(amount) {
    this._sphericalGoal.theta += amount;
  }

  /** Snap the camera to a new target (used on boot and for captures). */
  focus(target, radius, theta, phi) {
    this._targetGoal.copy(target);
    this._panGoal.copy(target);
    if (radius !== undefined) this._sphericalGoal.radius = clamp(radius, this.minDistance, this.maxDistance);
    if (theta !== undefined) this._sphericalGoal.theta = theta;
    if (phi !== undefined) this._sphericalGoal.phi = clamp(phi, this.minPolar, this.maxPolar);
  }

  /** Same as focus() but with no easing — takes effect immediately. */
  snapTo(target, radius, theta, phi) {
    this.focus(target, radius, theta, phi);
    this.target.copy(this._panGoal);
    this._targetGoal.copy(this._panGoal);
    this._spherical.copy(this._sphericalGoal);
    this._spherical.makeSafe();
    this._offset.setFromSpherical(this._spherical);
    this.camera.position.copy(this.target).add(this._offset);
    this.camera.lookAt(this.target);
  }
}

export { damp };