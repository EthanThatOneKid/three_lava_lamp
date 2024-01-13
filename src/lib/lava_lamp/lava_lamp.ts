import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

let container: HTMLElement | null;
let stats: Stats;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let light: THREE.DirectionalLight;
let pointLight: THREE.PointLight;
let ambientLight: THREE.AmbientLight;
let marchingCubes: MarchingCubes;
let resolution: number;
let effectController: {
	speed: number;
	amount: number;
	resolution: number;
	isolation: number;
};

let time = 0;

const clock = new THREE.Clock();

export function init() {
	container = document.getElementById('container');
	if (!container) {
		console.error('container not found');
		return;
	}

	// CAMERA

	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.set(-6000, 500, 2800);

	// SCENE

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x050505);

	// SKYBOX

	const loader = new THREE.CubeTextureLoader();
	loader.setPath('skybox/');

	const textureCube = loader.load([
		'violence_ft.jpg',
		'violence_bk.jpg',
		'violence_up.jpg',
		'violence_dn.jpg',
		'violence_rt.jpg',
		'violence_lf.jpg'
	]);

	scene.background = textureCube;

	// LIGHTS

	light = new THREE.DirectionalLight(0xffffff, 3);
	light.position.set(0.5, 0.5, 1);
	scene.add(light);

	pointLight = new THREE.PointLight(0xffffff, 3, 0, 0);
	pointLight.position.set(0, 600, 0);
	scene.add(pointLight);

	ambientLight = new THREE.AmbientLight(0x323232, 3);
	scene.add(ambientLight);

	// MARCHING CUBES

	resolution = 28;

	const marchingCubesMaterial = new THREE.MeshPhongMaterial({
		specular: 0xc1c1c1,
		shininess: 250,
		color: 0x00ff00
	});
	marchingCubes = new MarchingCubes(resolution, marchingCubesMaterial, true, true, 100000);
	marchingCubes.position.set(0, 0, 0);
	marchingCubes.scale.set(600, 600, 600);

	marchingCubes.enableUvs = false;
	marchingCubes.enableColors = false;

	scene.add(marchingCubes);

	// GLASS
	// https://discourse.threejs.org/t/definitive-glass-material/22888/3

	const glassGeometry = new THREE.CylinderGeometry(400, 800, 1600, 32);
	const glassMaterial = new THREE.MeshPhysicalMaterial({
		metalness: 0.9,
		roughness: 0.05,
		envMapIntensity: 0.9,
		clearcoat: 1,
		transparent: true,
		opacity: 0.5,
		reflectivity: 0.2,
		ior: 0.9,
		side: THREE.BackSide
	});
	const glass = new THREE.Mesh(glassGeometry, glassMaterial);
	glass.position.set(0, 200, 0);
	scene.add(glass);

	// TODO: ACCENTS. Render container of lava lamp.

	const accentColor = 0x000000;
	const topGeometry = new THREE.CylinderGeometry(300, 420, 600, 32);
	const topMaterial = new THREE.MeshPhongMaterial({ color: accentColor, shininess: 200 });
	const top = new THREE.Mesh(topGeometry, topMaterial);
	top.position.set(0, 1200, 0);
	scene.add(top);

	const bottomTopHalfGeometry = new THREE.CylinderGeometry(800, 300, 600, 32);
	const bottomTopHalfMaterial = new THREE.MeshPhongMaterial({ color: accentColor, shininess: 200 });
	const bottomTopHalf = new THREE.Mesh(bottomTopHalfGeometry, bottomTopHalfMaterial);
	bottomTopHalf.position.set(0, -900, 0);
	scene.add(bottomTopHalf);

	const bottomBottomHalfGeometry = new THREE.CylinderGeometry(300, 800, 800, 32);
	const bottomBottomHalfMaterial = new THREE.MeshPhongMaterial({
		color: accentColor,
		shininess: 200
	});
	const bottomBottomHalf = new THREE.Mesh(bottomBottomHalfGeometry, bottomBottomHalfMaterial);
	bottomBottomHalf.position.set(0, -1499, 0);
	scene.add(bottomBottomHalf);

	// RENDERER

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	// CONTROLS

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 500;
	controls.maxDistance = 5000;

	// STATS

	stats = new Stats();
	container.appendChild(stats.dom);

	// GUI

	setupGUI();

	// EVENTS

	window.addEventListener('resize', onWindowResize);
}

//

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupGUI() {
	effectController = {
		speed: 1.0,
		amount: 12,
		resolution: 32,
		isolation: 25
	};

	const gui = new GUI();

	// simulation

	const folder = gui.addFolder('Simulation');
	folder.add(effectController, 'speed', 0.1, 100.0, 0.05);
	folder.add(effectController, 'amount', 1, 50, 1);
	folder.add(effectController, 'resolution', 14, 100, 1);
	folder.add(effectController, 'isolation', 10, 300, 1);
}

// this controls content of marching cubes voxel field

type GetCubePositionFn = (time: number, i: number, total: number) => THREE.Vector3Tuple;

const getCubePosition: GetCubePositionFn = (time, i) => [
	Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5,
	Math.abs(Math.cos(i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * 0.77, // dip into the floor
	Math.cos(i + 1.32 * time * 0.1 * Math.sin(0.92 + 0.53 * i)) * 0.27 + 0.5
];

function updateCubes(
	cubes: MarchingCubes,
	time: number,
	amount: number,
	subtract = 12,
	fn: GetCubePositionFn = getCubePosition
) {
	if (!cubes) {
		return;
	}

	cubes.reset();

	const strength = 1.2 / ((Math.sqrt(amount) - 1) / 4 + 1);
	for (let i = 0; i < amount; i++) {
		const [ballx, bally, ballz] = fn(time, i, amount);
		cubes.addBall(ballx, bally, ballz, strength, subtract);
	}

	cubes.update();
}

export function animate() {
	requestAnimationFrame(animate);

	render();
	stats.update();
}

function render() {
	const delta = clock.getDelta();

	time += delta * effectController.speed * 0.1;

	// point light

	// marching cubes

	if (effectController.resolution !== resolution) {
		resolution = effectController.resolution;
		marchingCubes.init(Math.floor(resolution));
	}

	if (effectController.isolation !== marchingCubes.isolation) {
		marchingCubes.isolation = effectController.isolation;
	}

	updateCubes(marchingCubes, time, effectController.amount);

	// render

	renderer.render(scene, camera);
}
