import * as THREE from 'three';
import { Prism } from './Prism.js';

export class PrismChain {
    constructor(numPrisms = 5, colors = null) {
        this.prisms = [];
        this.relativeRotations = []; // Store relative rotation between each pair of prisms
        this.group = new THREE.Group(); // Container for all prisms

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

        // Create and position remaining prisms in a line
        let previousPrism = firstPrism;
        for (let i = 1; i < numPrisms; i++) {
            const prism = new Prism(colors[i % colors.length]);
            previousPrism.getMesh().add(prism.getMesh());
            prism.getMesh().position.set(-0.5,0.5,0);
            // prism.getMesh().rotation.set(0, 0, 0);
            this.relativeRotations.push(new THREE.Euler(Math.PI, 0, Math.PI/2));
            this.prisms.push(prism);
            previousPrism = prism;
        }

        // Center the entire chain
        this.centerChain();
    }

    // Center the chain based on its current extent
    centerChain() {
        const box = new THREE.Box3().setFromObject(this.group);
        const center = box.getCenter(new THREE.Vector3());
        this.group.position.sub(center);
    }

    // Get the group containing all prisms
    getGroup() {
        return this.group;
    }

    // Animate the chain
    animate() {
        this.prisms.forEach((prism, index) => {
            prism.setRotation(this.relativeRotations[index].x, this.relativeRotations[index].y, this.relativeRotations[index].z);
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
} 