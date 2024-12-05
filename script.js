import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// Lightweight GUI for web development
import * as dat from "https://cdn.skypack.dev/lil-gui@0.16.0";
// GLTF Loader for loading 3D models
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

/**
 * Texture
 */
const textureLoader = new THREE.TextureLoader()

const sandColorTexture = textureLoader.load('./textures/sand/COLOR.jpg')
const sandNormalTexture = textureLoader.load('./textures/sand/NRM.jpg')
const sandAmbientOcclusionTexture = textureLoader.load('./textures/sand/OCC.jpg')
const sandDisplacementTexture = textureLoader.load('./textures/sand/DISP.tiff')
// const sandSpecularTexture = textureLoader.load('./textures/sand/SPEC.jpg')

sandColorTexture.repeat.set(7, 7)
sandAmbientOcclusionTexture.repeat.set(7, 7)
sandNormalTexture.repeat.set(7, 7)

sandColorTexture.wrapS = THREE.RepeatWrapping
sandAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping
sandNormalTexture.wrapS = THREE.RepeatWrapping
sandDisplacementTexture.wrapS = THREE.RepeatWrapping

sandColorTexture.wrapT = THREE.RepeatWrapping
sandAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping
sandNormalTexture.wrapT = THREE.RepeatWrapping
sandDisplacementTexture.wrapT = THREE.RepeatWrapping

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const gltfLoader =  new GLTFLoader()

let mixer = null

gltfLoader.load(
    './models/Fox/glTF-Binary/Fox.glb',
    (gltf) => {
        gltf.scene.scale.set(0.025, 0.025, 0.025)
        // while(gltf.scene.children.length) {
        //     scene.add(gltf.scene.children[0])
        // }
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; // Model casts shadows
                child.receiveShadow = true; // Model can receive shadows
            }
        });
        scene.add(gltf.scene)
        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[1])
        action.play()
    }
)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    // new THREE.MeshStandardMaterial({
    //     color: '#444444',
    //     metalness: 0,
    //     roughness: 0.5
    // })
    
    new THREE.MeshStandardMaterial({
        map: sandColorTexture, // Base color texture
        normalMap: sandNormalTexture, // Surface detail texture
        aoMap: sandAmbientOcclusionTexture, // Ambient occlusion for shadowed areas
        displacementMap: sandDisplacementTexture, // Displacement for height variation
        displacementScale: 0.1, // Intensity of displacement
        displacementBias: -0.05, // Offset for displacement
        roughness: 0.8, // Adjust for rough appearance
        metalness: 0.1, // Minimal metalness for sand
    })
)
floor.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2))
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
floor.position.y = 0.1
scene.add(floor)

/**
 * Cactus Placeholder
 */
// const cactusTexture = textureLoader.load('./textures/cactus_placeholder.jpg'); // Placeholder texture for cactus
const cactusMaterial = new THREE.MeshStandardMaterial(
    // { map: cactusTexture }
);

const ghost1 = new THREE.PointLight(0xff00ff, 2, 3)
ghost1.position.set(4, 0.5, 0)
scene.add(ghost1)
const pointLightHelper1 = new THREE.PointLightHelper(ghost1, 0.2);
scene.add(pointLightHelper1)


const cactusGeometry = new THREE.BoxGeometry(0.5, 1, 0.5); // Adjust size as needed
const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
cactus.castShadow = true;
cactus.position.set(7, 0.6, 10); // Start position
scene.add(cactus);


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(2048, 2048)
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 50
directionalLight.shadow.camera.left = - 10
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.bottom = - 10
directionalLight.position.set(10, 10, 10)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(5, 3, 5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// Number of cacti
const numCacti = 6; // Adjust this to control how many cacti travel

// Array to hold cacti
const cacti = [];

// Function to create a cactus
const createCactus = () => {
    const cactusGeometry = new THREE.BoxGeometry(0.5, 1, 0.5); // Adjust size as needed
    const cactusMaterial = new THREE.MeshStandardMaterial(); // Basic material
    const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
    cactus.castShadow = true;

    // Random initial position
    cactus.position.set(
        (Math.random() - 0.5) * 10, // Random x position
        0.6, // Fixed y position
        10 + Math.random() * 5 // Random initial z position further ahead
    );

    scene.add(cactus);
    return cactus;
};

// Create and store multiple cacti
for (let i = 0; i < numCacti; i++) {
    const cactus = createCactus();
    cacti.push(cactus);
}

// Function to reset a cactus position
const resetCactusPosition = (cactus) => {
    cactus.position.z = 10 + Math.random() * 5; // Reset z position further ahead
    let cactusX = null;

    // Ensure cactus is far enough from the center
    do {
        cactusX = (Math.random() - 0.5) * 10;
    } while (Math.abs(cactusX) < 4);

    cactus.position.x = cactusX; // Assign new x position
};

const floorLevel = 0; // Define the floor level for future use

/**
 * Animate
 */
const clock = new THREE.Clock()
const cactusSpeed = 2; // Speed of cactus and floor movement (units per second)

const tick = () => {
    const deltaTime = clock.getDelta();

    // Move each cactus
    cacti.forEach((cactus) => {
        cactus.position.z -= cactusSpeed * deltaTime; // Move cactus

        // If cactus moves out of bounds, reset position
        if (cactus.position.z < -9) {
            resetCactusPosition(cactus);
        }
    });

    // Animate the floor texture to match the cactus speed
    const textureMovement = (cactusSpeed * deltaTime) / 20; // Offset scaled by floor size
    sandColorTexture.offset.y += textureMovement;
    sandNormalTexture.offset.y += textureMovement;
    sandAmbientOcclusionTexture.offset.y += textureMovement;

    // Update Fox animation
    if (mixer) {
        mixer.update(deltaTime);
    }

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();