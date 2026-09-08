import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * 360 Interactive 3D Human Anatomy Viewer Component
 * Adapted from human_anatomy library using Three.js & GLTF
 */
export class Anatomy3DViewer {
  constructor(containerElement, { onPartSelect, onAngleChange }) {
    this.container = containerElement;
    this.onPartSelect = onPartSelect;
    this.onAngleChange = onAngleChange;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.modelGroup = null;
    this.materialsMap = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedPart = null;
    this.hoveredPart = null;
    this.animFrameId = null;

    this.initThree();
  }

  initThree() {
    // 1. Create Scene
    this.scene = new THREE.Scene();

    // 2. Create Camera
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0.4, 3.2);

    // 3. Create Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7796d1, 0.6);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0xfdc003, 0.5);
    rimLight.position.set(0, 5, -8);
    this.scene.add(rimLight);

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.enableZoom = true;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 5.0;

    // Listen to angle changes
    this.controls.addEventListener('change', () => {
      if (this.onAngleChange) {
        // Calculate Y angle in degrees (0 - 359)
        const angle = (Math.atan2(this.camera.position.x, this.camera.position.z) * 180 / Math.PI + 360) % 360;
        this.onAngleChange(Math.round(angle));
      }
    });

    // 6. Load GLTF 3D Human Model
    this.loadModel();

    // 7. Event Listeners
    this.attachEvents();

    // 8. Start Render Loop
    this.animate();
  }

  loadModel() {
    const loader = new GLTFLoader();
    const modelPath = 'geometries/human_body.glb';

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        this.modelGroup = new THREE.Group();
        this.modelGroup.position.set(0, -0.6, 0);
        this.modelGroup.scale.set(3.2, 3.2, 3.2);

        this.materialsMap = [];

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#e8e0d5'),
              roughness: 0.35,
              metalness: 0.08,
            });
            child.material = material;
            this.materialsMap.push({ mesh: child, material });
          }
        });

        this.modelGroup.add(model);
        this.scene.add(this.modelGroup);
        console.log('[Anatomy3D] GLTF 3D Human Body loaded successfully');
      },
      undefined,
      (err) => {
        console.error('[Anatomy3D] Error loading GLTF model', err);
      }
    );
  }

  getBodyPartFromPosition(point) {
    const y = point.y;
    const z = point.z;

    if (y > 0.36) return 'head';
    if (y > 0.30) return 'neck';
    if (y > 0.22) return Math.abs(z) > 0.08 ? (z < 0 ? 'leftShoulder' : 'rightShoulder') : 'chest';
    if (y > 0.12) return Math.abs(z) > 0.10 ? (z < 0 ? 'leftArm' : 'rightArm') : 'chest';
    if (y > -0.04) return Math.abs(z) > 0.10 ? (z < 0 ? 'leftArm' : 'rightArm') : 'abdomen';
    if (y > -0.18) return 'hip';
    if (y > -0.42) return z < 0 ? 'leftLeg' : 'rightLeg';
    return z < 0 ? 'leftFoot' : 'rightFoot';
  }

  attachEvents() {
    const canvas = this.renderer.domElement;

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!this.modelGroup) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.modelGroup.children, true);

      if (intersects.length > 0) {
        canvas.style.cursor = 'pointer';
        const hitPoint = this.modelGroup.worldToLocal(intersects[0].point.clone());
        const partId = this.getBodyPartFromPosition(hitPoint);
        this.setHoveredPart(partId);
      } else {
        canvas.style.cursor = 'default';
        this.setHoveredPart(null);
      }
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!this.modelGroup) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.modelGroup.children, true);

      if (intersects.length > 0) {
        const hitPoint = this.modelGroup.worldToLocal(intersects[0].point.clone());
        const partId = this.getBodyPartFromPosition(hitPoint);
        this.setSelectedPart(partId);
        if (this.onPartSelect) {
          this.onPartSelect(partId);
        }
      }
    };

    window.addEventListener('resize', () => this.onResize());
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('click', onClick);
  }

  setHoveredPart(partId) {
    if (this.hoveredPart === partId) return;
    this.hoveredPart = partId;
    this.updateMaterials();
  }

  setSelectedPart(partId) {
    this.selectedPart = partId;
    this.updateMaterials();
  }

  updateMaterials() {
    const baseColor = new THREE.Color('#e8e0d5');
    const selectedColor = new THREE.Color('#fdc003');
    const hoverColor = new THREE.Color('#7796d1');

    this.materialsMap.forEach(({ material }) => {
      if (this.selectedPart) {
        material.color.copy(selectedColor);
        material.emissive.setHex(0x332200);
      } else if (this.hoveredPart) {
        material.color.copy(hoverColor);
        material.emissive.setHex(0x001122);
      } else {
        material.color.copy(baseColor);
        material.emissive.setHex(0x000000);
      }
    });
  }

  setAngle(angleDeg) {
    if (!this.camera) return;
    const rad = (angleDeg * Math.PI) / 180;
    const dist = 3.2;
    this.camera.position.x = dist * Math.sin(rad);
    this.camera.position.z = dist * Math.cos(rad);
    this.camera.lookAt(0, 0.4, 0);
    this.controls.update();
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
