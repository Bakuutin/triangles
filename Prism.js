import * as THREE from 'three';

import {
	computeBoundsTree, disposeBoundsTree, acceleratedRaycast
} from 'three-mesh-bvh';

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;


export class Prism {
    constructor(color = 0x00ff00) {
        // Create triangular prism geometry
        const geometry = new THREE.BufferGeometry();

        // Define the vertices for half a cube cut diagonally
        // Shifted so that the origin is at the center of one square face
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

        // Define indices to create the triangles
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

        // Calculate normals for proper lighting
        const positionAttribute = new THREE.BufferAttribute(vertices, 3);
        geometry.setAttribute('position', positionAttribute);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        geometry.translate(0, 0.5, -0.5)

        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });

        // Create the main mesh
        this.mesh = new THREE.Mesh(geometry, material);

        // Add black edges
        const edges = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const edgesLines = new THREE.LineSegments(edges, edgesMaterial);
        this.mesh.add(edgesLines);
    }

    // Method to get the mesh
    getMesh() {
        return this.mesh;
    }

    // Method to set position
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
        this.mesh.geometry.computeBoundsTree();
    }

    // Method to set rotation
    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
        this.mesh.geometry.computeBoundsTree();
    }

    // Method to rotate
    rotate(x, y, z) {
        this.mesh.rotation.x += x;
        this.mesh.rotation.y += y;
        this.mesh.rotation.z += z;
    }

    intersects(otherPrism) {
        console.log(this, otherPrism)
        window.a = this 
        window.b = otherPrism
        // const intersection = self.intersect(other).toMesh()
        return false

        return intersection.bounding_box().diagonal().length() > 0.01
    }
} 