import * as THREE from 'three';
import {
    OrbitControls
  } from 'three/examples/jsm/controls/OrbitControls'
import { PrismChain } from './PrismChain.js';


// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8; // Moved camera back a bit to see the whole chain


// Create renderer
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.y = 0.5

// Create a prism chain with 7 prisms
// const prismChain = new PrismChain(18*2);
const prismChain = new PrismChain(10);
scene.add(prismChain.getGroup());

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Animate the chain
    prismChain.animate();
    
    // Slowly rotate the entire chain
    prismChain.rotate(0.001, 0.002, 0);

    renderer.render(scene, camera);
}

animate(); 