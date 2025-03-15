import * as THREE from 'three';
import { Prism } from './Prism.js';

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
        this.group.add(firstPrism.mesh);
        this.relativeRotations.push(new THREE.Euler(0, 0, 0));
        this.rotationShifts = new Array(numPrisms).fill(0);

        // Create and position remaining prisms in a line
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

        // this.rotationShifts = [
        //     0,
        //     1.5707963267948966,
        //     1.5707963267948966,
        //     1.5707963267948966,
        //     -1.5707963267948966,
        //     3.141592653589793,
        //     3.141592653589793,
        //     -1.5707963267948966,
        //     0,
        //     -1.5707963267948966
        // ];

        // this.rotationShifts = this.rotationShifts.map((_, index) => {
        //     if (index === 4 || index === 5) {
        //         return Math.PI;
        //     }
        //     return 0;
        // });

        console.log(this.rotationShifts);
        
        this.animate();
        setTimeout(() => {
            this.checkSelfIntersection();
        }, 500);
    }
} 