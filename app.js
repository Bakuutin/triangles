import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { MeshBVH, MeshBVHVisualizer, computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

const PRISM_CENTER = new THREE.Vector3(0, 0.5, 0);
const FAR_POINT = new THREE.Vector3(-0.5, 0, 0.5);
const EPSILON = 0.001;

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Add raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle mouse click
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get all meshes from the prism chain
    const meshes = window.prismChain.prisms.map(prism => prism.mesh);
    
    // Perform intersection test
    const intersects = raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const prismIndex = window.prismChain.prisms.findIndex(prism => prism.mesh === clickedMesh);
        console.log('Clicked on prism index:', prismIndex);
    }
}

// Add click event listener
window.addEventListener('click', onMouseClick);

const gui = new dat.GUI();

const counter = {
    collided: 0,
    total: 0,
};

window.counter = counter;

const lenController = gui.add({chainLength: 10}, 'chainLength', 1, 50, 1);
lenController.onChange((v) => spawnChain(v));
lenController.name('Chain Length');

gui.add({'info': ()=>null}, 'info').name('Press Space to randomize rotations')

const status = gui.add({status: ()=>null}, 'status');

const setStatus = (newStatus) => {
    status.name('Status: ' + newStatus);
    gui.updateDisplay();
};


class Prism {
    constructor(color = 0x00ff00, index=0) {
        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array([
            // Front face (now at origin)
            -0.5, -0.5, 0,    // bottom left
            0.5, -0.5, 0,     // bottom right
            -0.5, 0.5, 0,     // top left

            // Back face (now at +1 on z-axis)
            -0.5, -0.5, 1,    // bottom left
            0.5, -0.5, 1,     // bottom right
            -0.5, 0.5, 1,     // top left

            // Bottom face
            -0.5, -0.5, 0,    // front left
            0.5, -0.5, 0,     // front right
            -0.5, -0.5, 1,    // back left
            0.5, -0.5, 1,     // back right

            // Left face
            -0.5, -0.5, 0,    // bottom front
            -0.5, 0.5, 0,     // top front
            -0.5, -0.5, 1,    // bottom back
            -0.5, 0.5, 1,     // top back

            // Diagonal face
            0.5, -0.5, 0,     // bottom front
            -0.5, 0.5, 0,     // top front
            0.5, -0.5, 1,     // bottom back
            -0.5, 0.5, 1      // top back
        ]);

        const indices = new Uint16Array([
            // Front triangle
            0, 1, 2,
            
            // Back triangle
            3, 4, 5,
            
            // Bottom face
            6, 8, 7,
            7, 8, 9,
            
            // Left face
            10, 12, 11,
            11, 12, 13,
            
            // Diagonal face
            14, 16, 15,
            15, 16, 17
        ]);

        const positionAttribute = new THREE.BufferAttribute(vertices, 3);
        geometry.setAttribute('position', positionAttribute);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        geometry.translate(0, 0.5, -0.5);

        // Add BVH to the geometry
        geometry.boundsTree = new MeshBVH(geometry);

        let material = new THREE.MeshPhongMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.geometry.boundsTree = geometry.boundsTree;

        const edges = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const edgesLines = new THREE.LineSegments(edges, edgesMaterial);
        this.mesh.add(edgesLines);

        this.index = index;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
        this.mesh.geometry
    }

    rotate(x, y, z) {
        this.mesh.rotation.x += x;
        this.mesh.rotation.y += y;
        this.mesh.rotation.z += z;
    }

    intersects(other) {
        const getDistance = (point) => {
            const thisWorldPosition = this.mesh.localToWorld(PRISM_CENTER.clone());
            const otherWorldPosition = other.mesh.localToWorld(point.clone());
            return thisWorldPosition.distanceTo(otherWorldPosition);
        }

        const otherToLocalCoordinates = (point) => {
            return this.mesh.worldToLocal(other.mesh.localToWorld(point.clone()));
        }

        return getDistance(PRISM_CENTER) < EPSILON && otherToLocalCoordinates(FAR_POINT).distanceTo(new THREE.Vector3(0.5, 1, 0.5)) > EPSILON;
    }
}


class PrismChain {
    constructor(numPrisms = 5) {
        this.prisms = [];
        this.relativeRotations = [];
        this.group = new THREE.Group();
        this.possibleRotations = [0, Math.PI, -Math.PI/2, Math.PI/2];

        this.handleKeyDown = (event) => {
            if (event.code === 'Space') {
                this.randomizeRotations();
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);

        const colors = Array(numPrisms).fill().map((_, i) => {
            const hue = (i / numPrisms) * 360;
            return new THREE.Color(`hsl(${hue}, 100%, 50%)`);
        });

        const firstPrism = new Prism(colors[0]);
        
        this.prisms.push(firstPrism);
        this.group.add(firstPrism.mesh);
        this.relativeRotations.push(new THREE.Euler(0, 0, 0));
        this.rotationShifts = new Array(numPrisms).fill(0);

        let previousPrism = firstPrism;
        for (let i = 1; i < numPrisms; i++) {
            const prism = new Prism(colors[i % colors.length], i);
            previousPrism.mesh.add(prism.mesh);
            prism.mesh.position.set(-0.5,0.5,0);
            this.relativeRotations.push(new THREE.Euler(Math.PI, 0, Math.PI/2));
            this.prisms.push(prism);
            previousPrism = prism;
        }
    }

    animate() {
        this.prisms.forEach((prism, index) => {
            prism.setRotation(this.relativeRotations[index].x+this.rotationShifts[index], this.relativeRotations[index].y, this.relativeRotations[index].z);
        });
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }

    rotate(x, y, z) {
        this.group.rotation.x += x;
        this.group.rotation.y += y;
        this.group.rotation.z += z;
    }

    getRelativeRotation(index) {
        if (index < 1 || index >= this.prisms.length) return null;
        return this.relativeRotations[index];
    }

    reset() {
        this.prisms.forEach((prism, index) => {
            if (index === 0) {
                prism.setRotation(0, 0, 0);
            } else {
                const prevPrism = this.prisms[index - 1];
                const endPos = prevPrism.getEndPosition();
                const endRot = prevPrism.getEndRotation();
                prism.mesh.position.copy(endPos);
                prism.setRotation(endRot.x, endRot.y, endRot.z);
            }
        });
        this.relativeRotations = this.relativeRotations.map(() => new THREE.Euler(0, 0, 0));
        this.group.rotation.set(0, 0, 0);
    }

    checkSelfIntersection() {
        const intersections = [];

        for (let i = 0; i < this.prisms.length; i++) {
            for (let j = i + 2; j < this.prisms.length; j++) {
                if (this.prisms[i].intersects(this.prisms[j])) {
                    intersections.push([i, j]);
                }
            }
        }

        this.updateIntersectionDisplay(intersections);
    }

    updateIntersectionDisplay(intersections) {
        if (intersections.length === 0) {
            setStatus('No intersections');
            counter.total += 1.0;
        } else {
            setStatus(`${intersections.length} intersection${intersections.length > 1 ? 's' : ''}`);
            counter.collided += 1.0;
            counter.total += 1.0;
        }
    }

    randomizeRotations() {
        this.relativeRotations.forEach((_, index) => {
            if (index > 0) {
                this.rotationShifts[index] = this.possibleRotations[Math.floor(Math.random() * this.possibleRotations.length)];
            }
        });

        console.log(this.rotationShifts);   

        setStatus('...');
        this.animate();
        setTimeout(() => {
            this.checkSelfIntersection();
        }, 500);
        // - Do we sleep for 500 milliseconds?
        // - Yes
        // - Why do we sleep for 500 milliseconds?
        // - It doesn't work otherwise (geometry is off) and debugging this is no fun
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        window.scene.remove(this.group);
        
        this.prisms = [];
        this.relativeRotations = [];
        this.rotationShifts = [];
        this.group = null;
    }
}


const scene = new THREE.Scene();
window.scene = scene;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.z = 8;

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.y = 0.5;

const spawnChain = (size) => {
    if (window.prismChain) {
        window.prismChain.cleanup();
    }

    const newChain = new PrismChain(size);
    newChain.animate()
    window.scene.add(newChain.group);
    window.prismChain = newChain;
    setStatus('line');
};

spawnChain(36);


const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

lenController.setValue(10);

animate(); 