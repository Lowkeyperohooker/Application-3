import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// Lightweight GUI for web development
import * as dat from "https://cdn.skypack.dev/lil-gui@0.16.0";
// GLTF Loader for loading 3D models
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";import { RoundedBoxGeometry } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/geometries/RoundedBoxGeometry.js";

// Parameters for the cacti
const parameters = {
    numCacti: 8, // Number of cacti
    spawnDelay: 500*3, // Delay in milliseconds between spawns
    behavior: 1, // 0 for chilling, 1 is for walking, and 2 is for running
    timeOfDay: "Day", // Options: "Day" or "Night"
    ambientLightIntensity: 0.8,
    directionalLightIntensity: 0.6,
    skyColorDay: 0x87ceeb, // Light blue for day
    skyColorNight: 0x000033, // Dark blue for night
};

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

/**
 * Texture
 */
const textureLoader = new THREE.TextureLoader()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const gltfLoader =  new GLTFLoader()

let mixer = null
let loadedGltf = null; // Global variable to store GLTF data

gltfLoader.load(
    './models/Fox/glTF-Binary/Fox.glb',
    (gltf) => {
        loadedGltf = gltf; // Store the loaded GLTF data
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
        const action = mixer.clipAction(gltf.animations[parameters.behavior])
        action.play()
    }
)

/**
 * Floor
 */
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

sandColorTexture.needsUpdate = true;


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

const updateDayNight = () => {
    if (parameters.timeOfDay === "Day") {
        // Day settings
        ambientLight.intensity = parameters.ambientLightIntensity;
        directionalLight.intensity = parameters.directionalLightIntensity;
        scene.background = new THREE.Color(parameters.skyColorDay);
    } else {
        // Night settings
        ambientLight.intensity = parameters.ambientLightIntensity * 0.3; // Dimmer ambient light
        directionalLight.intensity = parameters.directionalLightIntensity * 0.2; // Dimmer directional light
        scene.background = new THREE.Color(parameters.skyColorNight);
    }
};

updateDayNight()

const dayNightFolder = gui.addFolder("Day and Night");

// Dropdown to toggle time of day
dayNightFolder
    .add(parameters, "timeOfDay", ["Day", "Night"])
    .name("Time of Day")
    .onChange(updateDayNight);

// Open the folder by default
dayNightFolder.open();


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


/**
 * Cactus Placeholder
 */
// const cactusTexture = textureLoader.load('./textures/cactus_placeholder.jpg'); // Placeholder texture for cactus
const cactusMaterial = new THREE.MeshStandardMaterial(
    // { map: cactusTexture }
);

// const ghost1 = new THREE.PointLight(0xff00ff, 2, 3)
// ghost1.position.set(4, 0.5, 0)
// scene.add(ghost1)
// const pointLightHelper1 = new THREE.PointLightHelper(ghost1, 0.2);
// scene.add(pointLightHelper1)


// const cactusGeometry = new THREE.BoxGeometry(0.5, 1, 0.5); // Adjust size as needed
// const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
// cactus.castShadow = true;
// cactus.position.set(7, 0.6, 10); // Start position
// scene.add(cactus);
// Create a GUI folder for behavior controls
let cactusSpeed = 2; // Speed of cactus and floor movement (units per second)
const behaviorFolder = gui.addFolder("Behavior");

// Function to update cactus speed and fox animation
const updateBehavior = (behavior) => {
    parameters.behavior = behavior;

    // Adjust cactus speed based on behavior
    switch (behavior) {
        case 0: // Chilling
            cactusSpeed = 0; // No movement
            break;
        case 1: // Walking
            cactusSpeed = 2; // Moderate speed
            break;
        case 2: // Running
            cactusSpeed = 4; // Fast speed
            break;
    }

    // Update fox animation
    if (mixer && loadedGltf) {
        mixer.stopAllAction(); // Stop all current actions
        const animationClip = loadedGltf.animations[parameters.behavior]; // Get the animation for the current behavior

        if (animationClip) {
            const action = mixer.clipAction(animationClip); // Create a new action
            action.reset(); // Reset the animation to start
            action.play(); // Play the new action
            action.setEffectiveWeight(1); // Ensure it's fully applied
        } else {
            console.error(`No animation found for behavior index: ${parameters.behavior}`);
        }
    }

    console.log(
        `Behavior set to: ${behavior === 0 ? 'Chilling' : behavior === 1 ? 'Walking' : 'Running'}`
    );
};


// Default behavior: Walking
updateBehavior(1);

// Add GUI buttons for behaviors
behaviorFolder.add({ chilling: () => updateBehavior(0) }, "chilling").name("Chilling");
behaviorFolder.add({ walking: () => updateBehavior(1) }, "walking").name("Walking");
behaviorFolder.add({ running: () => updateBehavior(2) }, "running").name("Running");
behaviorFolder.open(); // Open the folder by default
// Number of cacti
const numCacti = 8; // Adjust this to control how many cacti travel

// Array to hold cacti
const cacti = [];

// // Function to reset a cactus position
// const resetCactusPosition = (cactus) => {
//     cactus.position.z = 10 + Math.random() * 5; // Reset z position further ahead
//     let cactusX = null;

//     // Ensure cactus is far enough from the center
//     do {
//         cactusX = (Math.random() - 0.5) * 10;
//     } while (Math.abs(cactusX) < 4);

//     cactus.position.x = cactusX; // Assign new x position
//     cactus.position.y = 0.5
// };
// Function to reset a cactus position
const resetCactusPosition = (cactus) => {
    // Position the cactus at a random Z position further ahead
    cactus.position.z = 10 // + Math.random() * 10; // Reset z-position within a range
    
    // Ensure the cactus is placed away from the center (x-axis)
    let cactusX = null;
    do {
        cactusX = (Math.random() - 0.5) * 15; // Random x position in a wider range
    } while (Math.abs(cactusX) < 3); // Ensure cactus isn't too close to the center
    
    cactus.position.x = cactusX;

    // Adjust height randomly
    cactus.position.y = 0.5;

    // Randomly rotate the cactus around its Y-axis for variation
    cactus.rotation.y = Math.random() * Math.PI * 2; // 0 to 360 degrees in radians

    // Optionally adjust scale for random height (y-axis) and uniform width/depth
    const randomHeight = 0.8 + Math.random() * 0.6; // Scale height between 0.8 and 1.4
    cactus.scale.set(1, randomHeight, 1); // Uniform width (x, z) and random height (y)
};


// Function to create a cactus
const cactusColorTexture = textureLoader.load('./textures/cactus/basecolor.png')
const cactusNormalTexture = textureLoader.load('./textures/cactus/normal.png')
const cactusAmbientOcclusionTexture = textureLoader.load('./textures/cactus/ambientOcclusion.png')
const cactusHeightTexture = textureLoader.load('./textures/cactus/height.png')
const cactusRoughnessTexture = textureLoader.load('./textures/cactus/roughness.png')

cactusColorTexture.wrapS = THREE.RepeatWrapping;
cactusColorTexture.wrapT = THREE.RepeatWrapping;

cactusAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping;
cactusAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping;

cactusNormalTexture.wrapS = THREE.RepeatWrapping;
cactusNormalTexture.wrapT = THREE.RepeatWrapping;

cactusHeightTexture.wrapS = THREE.RepeatWrapping;
cactusHeightTexture.wrapT = THREE.RepeatWrapping;

cactusRoughnessTexture.wrapS = THREE.RepeatWrapping;
cactusRoughnessTexture.wrapT = THREE.RepeatWrapping;

// Repeat for other textures if needed

// Repeat for other textures if needed


const createCactus = () => {
    const cactusGeometry = new RoundedBoxGeometry(1, 2, 1, 8, 0.2);
    // Creates a rounded box:
    // - 1 unit wide (X-axis)
    // - 2 units tall (Y-axis)
    // - 1 unit deep (Z-axis)
    // - 8 segments for smooth corners
    // - Rounded corners with a radius of 0.2

    // const cactusGeometry = new RoundedBoxGeometry(0.5, 1, 0.5, 8, 0.08); // Smooth edges
    // const cactusGeometry = new THREE.BoxGeometry(0.5, 1, 0.5); // Adjust size as needed
    // Updated material with textures
    const cactusMaterial = new THREE.MeshStandardMaterial({
        map: cactusColorTexture,               // Base color texture for cactus
        transparent: true,
        normalMap: cactusNormalTexture,        // Adds surface detail
        aoMap: cactusAmbientOcclusionTexture, // Adds ambient occlusion (shadows)
        displacementMap: cactusHeightTexture, // Height map for extra detail
        displacementScale: 0.1,              // Intensity of displacement
        roughnessMap: cactusRoughnessTexture, // Controls surface roughness
        roughness: 1,                         // Rough appearance for a natural look
    });
    const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
    cactus.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(cactus.geometry.attributes.uv.array, 2));
    cactus.castShadow = true;

    // Randomize scale
    const randomScale = {
        x: 0.8 + Math.random() * 0.4, // Scale between 0.8 and 1.2
        y: 0.8 + Math.random() * 1.2, // Taller or shorter by varying degrees
        z: 0.8 + Math.random() * 0.4, // Scale between 0.8 and 1.2
    };
    cactus.scale.set(randomScale.x, randomScale.y, randomScale.z);

    // Random initial position
    resetCactusPosition(cactus)
    // cactus.position.set(
    //     (Math.random() - 0.5) * 10, // Random x position
    //     0.5, // Fixed y position
    //     10 + Math.random() * 5 // Random initial z position further ahead
    // );

    scene.add(cactus);
    return cactus;
};

// // Create and store multiple cacti
// for (let i = 0; i < parameters.numCacti; i++) {
//     // console.log(`Cactus ${i}`); // Log position for each cactus
//     const cactus = createCactus();
//     cacti.push(cactus);
// }
// Create and store multiple cacti with a delay
const createCactiWithDelay = (count, delay) => {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const cactus = createCactus(); // Create a single cactus
            cacti.push(cactus); // Store the cactus in the array
            console.log(`Cactus ${i} added at ${Date.now()}`); // Debug log
        }, i * delay); // Delay increases with each iteration
    }
};


// Call the function to create cacti with delay
createCactiWithDelay(parameters.numCacti, parameters.spawnDelay);

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const deltaTime = clock.getDelta();

    // Move each cactus
    cacti.forEach((cactus, index) => {
        // console.log(`Cactus ${index}: z = ${cactus.position.z}`); // Log position for each cactus
        cactus.position.z -= cactusSpeed * deltaTime;
    
        // Reset position if out of bounds
        if (cactus.position.z < -9) {
            resetCactusPosition(cactus);
        }
    });

    // Animate the floor texture to match the cactus speed
    // Match floor animation speed with cacti movement
    const textureScale = 2.5; // Matches the texture repeat scale
    const textureMovement = cactusSpeed * deltaTime / textureScale; // Adjust offset based on the tiling scale

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