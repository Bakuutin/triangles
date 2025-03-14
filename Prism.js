import * as THREE from 'three';

export class Prism {
    constructor(color = 0x00ff00) {
        // Create triangular prism geometry
        const geometry = new THREE.BufferGeometry();

        // Define the vertices for half a cube cut diagonally
        const vertices = new Float32Array([
            // Front triangle
            -0.5, -0.5, 0.5,   // bottom left
            0.5, -0.5, 0.5,    // bottom right
            -0.5, 0.5, 0.5,    // top left

            // Back triangle
            -0.5, -0.5, -0.5,  // bottom left
            0.5, -0.5, -0.5,   // bottom right
            -0.5, 0.5, -0.5,   // top left

            // Bottom face
            -0.5, -0.5, 0.5,   // front left
            0.5, -0.5, 0.5,    // front right
            -0.5, -0.5, -0.5,  // back left
            0.5, -0.5, -0.5,   // back right

            // Left face
            -0.5, -0.5, 0.5,   // bottom front
            -0.5, 0.5, 0.5,    // top front
            -0.5, -0.5, -0.5,  // bottom back
            -0.5, 0.5, -0.5,   // top back

            // Diagonal face
            0.5, -0.5, 0.5,    // bottom front
            -0.5, 0.5, 0.5,    // top front
            0.5, -0.5, -0.5,   // bottom back
            -0.5, 0.5, -0.5    // top back
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
    }

    // Method to set rotation
    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
    }

    // Method to update rotation
    rotate(x, y, z) {
        this.mesh.rotation.x += x;
        this.mesh.rotation.y += y;
        this.mesh.rotation.z += z;
    }
} 