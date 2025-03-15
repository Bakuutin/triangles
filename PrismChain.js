import * as THREE from 'three';
import { Prism } from './Prism.js';

import {
	computeBoundsTree, disposeBoundsTree, acceleratedRaycast,
} from 'three-mesh-bvh';

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const counter = {
    collided: 0,
    total: 0,
}


export class PrismChain {
    constructor(numPrisms = 5, colors = null) {
        this.prisms = [];
        this.relativeRotations = []; // Store relative rotation between each pair of prisms
        this.group = new THREE.Group(); // Container for all prisms
        this.possibleRotations = [0, Math.PI, -Math.PI/2, Math.PI/2];

        // Create HTML overlay for intersection status
        this.intersectionDiv = document.createElement('div');
        this.intersectionDiv.style.position = 'fixed';
        this.intersectionDiv.style.top = '20px';
        this.intersectionDiv.style.right = '20px';
        this.intersectionDiv.style.padding = '10px';
        this.intersectionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.intersectionDiv.style.color = '#00ff00';
        this.intersectionDiv.style.fontFamily = 'Arial, sans-serif';
        this.intersectionDiv.style.fontSize = '16px';
        this.intersectionDiv.style.borderRadius = '5px';
        this.intersectionDiv.style.zIndex = '1000';
        this.intersectionDiv.textContent = 'No intersections';
        document.body.appendChild(this.intersectionDiv);

        // Add space key handler
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.randomizeRotations();
            }
        });

        // If no colors provided, generate rainbow colors
        if (!colors) {
            colors = Array(numPrisms).fill().map((_, i) => {
                const hue = (i / numPrisms) * 360;
                return new THREE.Color(`hsl(${hue}, 100%, 50%)`);
            });
        }


        // Create first prism at origin
        const firstPrism = new Prism(colors[0]);
        
        this.prisms.push(firstPrism);
        this.group.add(firstPrism.getMesh());
        this.relativeRotations.push(new THREE.Euler(0, 0, 0));
        this.rotationShifts = new Array(numPrisms).fill(0);

        // Create and position remaining prisms in a line
        let previousPrism = firstPrism;
        for (let i = 1; i < numPrisms; i++) {
            const prism = new Prism(colors[i % colors.length]);
            previousPrism.getMesh().add(prism.getMesh());
            prism.getMesh().position.set(-0.5,0.5,0);
            this.relativeRotations.push(new THREE.Euler(Math.PI, 0, Math.PI/2));
            this.prisms.push(prism);
            previousPrism = prism;
        }
    }

    // Get the group containing all prisms
    getGroup() {
        return this.group;
    }

    // Animate the chain
    animate() {
        this.prisms.forEach((prism, index) => {
            prism.setRotation(this.relativeRotations[index].x+this.rotationShifts[index], this.relativeRotations[index].y, this.relativeRotations[index].z);
        });
    }

    // Set position of the entire chain
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    // Set rotation of the entire chain
    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }

    // Rotate the entire chain
    rotate(x, y, z) {
        this.group.rotation.x += x;
        this.group.rotation.y += y;
        this.group.rotation.z += z;
    }

    // Get the relative rotation between two prisms
    getRelativeRotation(index) {
        if (index < 1 || index >= this.prisms.length) return null;
        return this.relativeRotations[index];
    }

    // Reset all prisms to their original aligned position
    reset() {
        this.prisms.forEach((prism, index) => {
            if (index === 0) {
                prism.setRotation(0, 0, 0);
            } else {
                const prevPrism = this.prisms[index - 1];
                const endPos = prevPrism.getEndPosition();
                const endRot = prevPrism.getEndRotation();
                prism.getMesh().position.copy(endPos);
                prism.setRotation(endRot.x, endRot.y, endRot.z);
            }
        });
        this.relativeRotations = this.relativeRotations.map(() => new THREE.Euler(0, 0, 0));
        this.group.rotation.set(0, 0, 0);
    }

    checkSelfIntersection() {
        const intersections = [];
        const EPSILON = 0.0001; // Small value for floating point comparison
        
        // Create BVH for each prism's mesh
        this.prisms.forEach(prism => {
            const mesh = prism.getMesh();
            if (!mesh.geometry.boundsTree) {
                mesh.geometry.computeBoundsTree();
            }
        });

        // Check each pair of prisms for intersections
        for (let i = 0; i < this.prisms.length; i++) {
            for (let j = i + 2; j < this.prisms.length; j++) {  // Skip adjacent prisms (i+2)
                const meshA = this.prisms[i].getMesh();
                const meshB = this.prisms[j].getMesh();

                // Get world matrices and positions
                meshA.updateWorldMatrix(true, false);
                meshB.updateWorldMatrix(true, false);

                // Get world positions of vertices
                const posA = meshA.geometry.attributes.position;
                const posB = meshB.geometry.attributes.position;
                const worldPosA = [];
                const worldPosB = [];
                const tempVec = new THREE.Vector3();

                // Convert vertices to world space for comparison
                for (let k = 0; k < posA.count; k++) {
                    tempVec.fromBufferAttribute(posA, k);
                    tempVec.applyMatrix4(meshA.matrixWorld);
                    worldPosA.push(tempVec.clone());
                }
                for (let k = 0; k < posB.count; k++) {
                    tempVec.fromBufferAttribute(posB, k);
                    tempVec.applyMatrix4(meshB.matrixWorld);
                    worldPosB.push(tempVec.clone());
                }

                // Check if any vertices are at the same position (up to epsilon)
                let hasMatchingVertices = true;
                for (const vA of worldPosA) {
                    for (const vB of worldPosB) {
                        if (Math.abs(vA.x - vB.x) < EPSILON && 
                            Math.abs(vA.y - vB.y) < EPSILON && 
                            Math.abs(vA.z - vB.z) < EPSILON) {
                            continue;
                        }
                        hasMatchingVertices = false;
                        break;
                    }
                    if (hasMatchingVertices) break;
                }

                // If vertices match or BVH detects intersection
                if (hasMatchingVertices || meshA.geometry.boundsTree.intersectsGeometry(
                    meshB.geometry,
                    meshB.matrixWorld,
                    meshA.matrixWorld
                )) {
                    intersections.push([i, j]);
                }
            }
        }

        this.updateIntersectionDisplay(intersections);
    }

    // Update the intersection display text
    updateIntersectionDisplay(intersections) {
        if (intersections.length === 0) {
            this.intersectionDiv.textContent = 'No intersections';
            this.intersectionDiv.style.color = '#00ff00';
            counter.total += 1.0;
        } else {
            this.intersectionDiv.textContent = `Intersections found`;
            this.intersectionDiv.style.color = '#ff0000';
            counter.collided += 1.0;
            counter.total += 1.0;
        }
        console.log(counter.collided, counter.total);
    }

    // Randomize rotations and check for intersections
    randomizeRotations() {
        this.relativeRotations.forEach((_, index) => {
            if (index > 0) { // Skip the first prism
                this.rotationShifts[index] = this.possibleRotations[Math.floor(Math.random() * this.possibleRotations.length)];
            }
        });
        
        // Update prism positions and check for intersections
        this.animate();
        this.checkSelfIntersection();
    }
} 