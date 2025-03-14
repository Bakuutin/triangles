import * as THREE from 'three';
import { Prism } from './Prism.js';

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create renderer
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create multiple prisms with different colors and positions
const prisms = [
    new Prism(0x00ff00), // Green prism
    new Prism(0xff0000), // Red prism
    new Prism(0x0000ff)  // Blue prism
];

// Position the prisms
prisms[0].setPosition(-2, 0, 0);
prisms[1].setPosition(0, 0, 0);
prisms[2].setPosition(2, 0, 0);

// Add prisms to the scene
prisms.forEach(prism => scene.add(prism.getMesh()));

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

    // Rotate each prism
    prisms.forEach(prism => {
        prism.rotate(0.01, 0.01, 0);
    });

    renderer.render(scene, camera);
}

animate(); 