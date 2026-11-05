import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Sky } from "three/addons/objects/Sky.js";
import { Play, Pause, RotateCcw, FastForward, Camera, ChevronDown, ChevronUp, Sun, Sparkles, } from "lucide-react";
import { createIndustrialGroundTexture, createServerRackTexture, createArchitecturalCladdingTexture, createWaterNormalAndCausticsTextures, createSoftSmokePlumeTexture, createSolarCoronaTexture, createSolarPanelTexture, } from "./proceduralTextures";
const CAMERA_PRESETS = {
    overview: {
        label: "Ikhtisar 3D",
        pos: [0, 10.6, 22.4],
        target: [0, 2.0, -1.2],
    },
    power: {
        label: "01. Pembangkit",
        pos: [-11.5, 6.8, 12.2],
        target: [-11.2, 2.5, -0.8],
    },
    hall: {
        label: "02. Hall Server",
        pos: [-1.4, 5.4, 9.8],
        target: [-1.4, 2.0, 0],
    },
    cooling: {
        label: "03. Pendingin & IPAL",
        pos: [5.4, 6.2, 10.6],
        target: [5.2, 1.6, 0],
    },
    eco: {
        label: "04. Ekosistem",
        pos: [12.4, 6.0, 12.2],
        target: [11.8, 0.8, 0],
    },
};
/**
 * Balanced, low-glare PBR lighting presets so colors, shadows, and textures remain crisp
 * without overexposure or washed-out white sky.
 */
const LIGHTING_MODES = {
    morning: {
        label: "Pagi",
        elevation: 18,
        azimuth: 52,
        turbidity: 3.6,
        rayleigh: 1.9,
        sunColor: 0xfdba74,
        sunIntensity: 1.75,
        hemiSky: 0x93c5fd,
        hemiGround: 0x0f172a,
        hemiIntensity: 0.58,
        exposure: 0.78,
        fogColor: 0x1e293b,
        sunBadgePos: [-11.5, 7.6, -22],
    },
    day: {
        label: "Siang",
        elevation: 34,
        azimuth: 38,
        turbidity: 2.2,
        rayleigh: 1.4,
        sunColor: 0xfff7ed,
        sunIntensity: 2.05,
        hemiSky: 0x7dd3fc,
        hemiGround: 0x0f172a,
        hemiIntensity: 0.68,
        exposure: 0.82,
        fogColor: 0x1e293b,
        sunBadgePos: [-4.5, 8.4, -22],
    },
    sunset: {
        label: "Senja",
        elevation: 11,
        azimuth: -48,
        turbidity: 5.2,
        rayleigh: 2.5,
        sunColor: 0xfb923c,
        sunIntensity: 1.65,
        hemiSky: 0xfdba74,
        hemiGround: 0x090d16,
        hemiIntensity: 0.52,
        exposure: 0.75,
        fogColor: 0x1e1b2e,
        sunBadgePos: [10.5, 6.8, -22],
    },
    night: {
        label: "Malam",
        elevation: -6,
        azimuth: 0,
        turbidity: 1.2,
        rayleigh: 0.35,
        sunColor: 0x38bdf8,
        sunIntensity: 0.85,
        hemiSky: 0x1e293b,
        hemiGround: 0x020617,
        hemiIntensity: 0.42,
        exposure: 0.72,
        fogColor: 0x050b16,
        sunBadgePos: [0, -10, -22],
    },
    solarCycle: {
        label: "Siklus Surya",
        elevation: 24,
        azimuth: 42,
        turbidity: 2.8,
        rayleigh: 1.65,
        sunColor: 0xfde68a,
        sunIntensity: 1.9,
        hemiSky: 0x7dd3fc,
        hemiGround: 0x0f172a,
        hemiIntensity: 0.62,
        exposure: 0.8,
        fogColor: 0x1e293b,
        sunBadgePos: [0, 8.0, -22],
    },
};
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _sunSpherical = new THREE.Vector3();
/**
 * Creates a hyperboloid cooling tower mesh using LatheGeometry with structural concrete ribs
 * and diagonal base support struts.
 */
function createHyperbolicCoolingTower(claddingTex, bumpTex, scaleFactor = 1) {
    const group = new THREE.Group();
    // 1. Bottom water collection basin
    const basinMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        bumpMap: bumpTex,
        bumpScale: 0.03,
        roughness: 0.8,
        metalness: 0.15,
    });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.52 * scaleFactor, 1.62 * scaleFactor, 0.35, 32), basinMat);
    basin.position.y = 0.18;
    basin.castShadow = true;
    basin.receiveShadow = true;
    group.add(basin);
    // Condenser water pool inside base
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.42 * scaleFactor, 1.42 * scaleFactor, 0.08, 28), new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        roughness: 0.15,
        clearcoat: 0.8,
    }));
    pool.position.y = 0.36;
    group.add(pool);
    // 2. Diagonal V-shaped support columns under the hyperboloid shell
    const strutMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
        metalness: 0.3,
    });
    const strutCount = 12;
    for (let i = 0; i < strutCount; i++) {
        const angle = (i / strutCount) * Math.PI * 2;
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * scaleFactor, 0.055 * scaleFactor, 0.65, 8), strutMat);
        const r = 1.36 * scaleFactor;
        strut.position.set(Math.cos(angle) * r, 0.52, Math.sin(angle) * r);
        strut.rotation.z = Math.sin(angle) * 0.22;
        strut.rotation.x = -Math.cos(angle) * 0.22;
        group.add(strut);
    }
    // 3. Hyperboloid revolution profile via LatheGeometry
    const points = [];
    const height = 3.8 * scaleFactor;
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = 0.72 + t * height;
        const u = (t - 0.66) * 2.15;
        const r = 0.82 * scaleFactor * Math.sqrt(1 + u * u * 1.18);
        points.push(new THREE.Vector2(r, y));
    }
    const latheGeo = new THREE.LatheGeometry(points, 36);
    const shellMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        map: claddingTex,
        bumpMap: bumpTex,
        bumpScale: 0.025,
        roughness: 0.68,
        metalness: 0.15,
        side: THREE.DoubleSide,
    });
    const shell = new THREE.Mesh(latheGeo, shellMat);
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);
    // 4. Top aviation warning ring
    const topY = 0.72 + height;
    const topR = points[points.length - 1].x;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(topR, 0.065 * scaleFactor, 12, 36), new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.35,
        metalness: 0.65,
    }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = topY;
    group.add(rim);
    return group;
}
/**
 * Creates a 3D Steel Lattice High-Voltage Transmission Pylon with ceramic insulators.
 */
function createTransmissionPylon() {
    const pylon = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.38,
        metalness: 0.82,
    });
    const legOffsets = [
        [-0.45, -0.45],
        [0.45, -0.45],
        [-0.45, 0.45],
        [0.45, 0.45],
    ];
    legOffsets.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 4.7, 8), steelMat);
        leg.position.set(lx * 0.65, 2.3, lz * 0.65);
        leg.rotation.z = lx * 0.12;
        leg.rotation.x = -lz * 0.12;
        leg.castShadow = true;
        pylon.add(leg);
    });
    [1.4, 2.6, 3.8].forEach((hy, idx) => {
        const w = 1.45 - idx * 0.22;
        const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, w * 1.9), steelMat);
        crossArm.position.set(0, hy, 0);
        crossArm.castShadow = true;
        pylon.add(crossArm);
        [-w * 0.85, w * 0.85].forEach((iz) => {
            const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 12), new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                roughness: 0.25,
                metalness: 0.5,
            }));
            insulator.position.set(0, hy - 0.18, iz);
            pylon.add(insulator);
        });
    });
    return pylon;
}
/**
 * Creates a multi-lobe organic tree with trunk, branches, and wind-swaying canopy group.
 */
function createRealisticTree(foliageHex, scale = 1) {
    const root = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x5c4033,
        roughness: 0.9,
        metalness: 0.05,
    });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 1.25, 10), trunkMat);
    trunk.position.y = 0.62;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    root.add(trunk);
    const canopy = new THREE.Group();
    canopy.position.set(0, 1.15, 0);
    const leafMat = new THREE.MeshStandardMaterial({
        color: foliageHex,
        roughness: 0.78,
        metalness: 0.04,
    });
    const lobes = [
        [0, 0.35, 0, 0.72],
        [-0.36, 0.15, 0.22, 0.52],
        [0.38, 0.2, -0.18, 0.54],
        [0.14, 0.68, 0.16, 0.48],
        [-0.2, 0.55, -0.25, 0.46],
    ];
    lobes.forEach(([lx, ly, lz, r]) => {
        const lobe = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), leafMat);
        lobe.position.set(lx, ly, lz);
        lobe.castShadow = true;
        lobe.receiveShadow = true;
        canopy.add(lobe);
    });
    root.add(canopy);
    root.scale.setScalar(scale);
    return { root, canopy };
}
/**
 * Creates a multi-jointed 3D fish with an S-curve undulating spine and pectoral fins.
 */
function createMultiJointFish(colorHex) {
    const root = new THREE.Group();
    const bodyMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.22,
        roughness: 0.22,
        metalness: 0.3,
        clearcoat: 0.9,
    });
    // 1. Anterior head/thorax segment
    const headGeo = new THREE.SphereGeometry(0.15, 14, 12);
    headGeo.scale(1.5, 0.85, 0.65);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    root.add(headMesh);
    // Pectoral fins
    const finGeo = new THREE.BoxGeometry(0.12, 0.02, 0.18);
    const leftFin = new THREE.Mesh(finGeo, bodyMat);
    leftFin.position.set(0.02, -0.03, 0.12);
    leftFin.rotation.y = -0.35;
    root.add(leftFin);
    const rightFin = new THREE.Mesh(finGeo, bodyMat);
    rightFin.position.set(0.02, -0.03, -0.12);
    rightFin.rotation.y = 0.35;
    root.add(rightFin);
    // 2. Mid-body articulated pivot
    const midPivot = new THREE.Group();
    midPivot.position.set(-0.16, 0, 0);
    const midGeo = new THREE.SphereGeometry(0.12, 12, 10);
    midGeo.scale(1.35, 0.78, 0.55);
    const midMesh = new THREE.Mesh(midGeo, bodyMat);
    midMesh.position.set(-0.08, 0, 0);
    midPivot.add(midMesh);
    root.add(midPivot);
    // 3. Caudal peduncle & tail fin pivot
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-0.18, 0, 0);
    const tailFinGeo = new THREE.ConeGeometry(0.14, 0.24, 4);
    tailFinGeo.rotateZ(-Math.PI / 2);
    tailFinGeo.scale(1, 1.15, 0.28);
    const tailFinMesh = new THREE.Mesh(tailFinGeo, bodyMat);
    tailFinMesh.position.set(-0.1, 0, 0);
    tailPivot.add(tailFinMesh);
    midPivot.add(tailPivot);
    return { root, midPivot, tailPivot, leftFin, rightFin };
}
export default function DataCenter3DScene({ scale, electricity, cooler, airCooler, hydro, waterCoolerSys, pollutedStatus, pollutionScore, pue, thermalDelta, elapsedLabel, progress, isPlaying, simSpeed, onTogglePlay, onCycleSpeed, onResetProgress, onChangeProgress, }) {
    const canvasMountRef = useRef(null);
    const [cameraPreset, setCameraPreset] = useState("overview");
    const [lightingMode, setLightingMode] = useState("day");
    const [cinematicMotion, setCinematicMotion] = useState(true);
    const [dockCollapsed, setDockCollapsed] = useState(false);
    const stateRef = useRef({
        scale,
        electricity,
        cooler,
        airCooler,
        hydro,
        waterCoolerSys,
        pollutedStatus,
        pollutionScore,
        progress,
        isPlaying,
        simSpeed,
        cameraPreset: "overview",
        lightingMode: "day",
        cinematicMotion: true,
        transitionActive: false,
    });
    stateRef.current.scale = scale;
    stateRef.current.electricity = electricity;
    stateRef.current.cooler = cooler;
    stateRef.current.airCooler = airCooler;
    stateRef.current.hydro = hydro;
    stateRef.current.waterCoolerSys = waterCoolerSys;
    stateRef.current.pollutedStatus = pollutedStatus;
    stateRef.current.pollutionScore = pollutionScore;
    stateRef.current.progress = progress;
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.simSpeed = simSpeed;
    stateRef.current.lightingMode = lightingMode;
    stateRef.current.cinematicMotion = cinematicMotion;
    const rebuildWorldRef = useRef(null);
    const updateLightingRef = useRef(null);
    useEffect(() => {
        if (rebuildWorldRef.current) {
            rebuildWorldRef.current();
        }
    }, [scale, electricity, cooler, airCooler, hydro, waterCoolerSys, pollutedStatus]);
    useEffect(() => {
        if (updateLightingRef.current) {
            updateLightingRef.current();
        }
    }, [lightingMode, pollutedStatus]);
    const handleSelectCamera = (presetId) => {
        setCameraPreset(presetId);
        stateRef.current.cameraPreset = presetId;
        stateRef.current.transitionActive = true;
    };
    useEffect(() => {
        const container = canvasMountRef.current;
        if (!container)
            return;
        const width = container.clientWidth || 920;
        const height = container.clientHeight || 520;
        // 1. WebGLRenderer Setup with Low-Glare Balanced ACESFilmicToneMapping
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        });
        const glCtx = renderer.getContext();
        const dbg = glCtx.getExtension("WEBGL_debug_renderer_info");
        const glRendererName = dbg ? glCtx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "";
        const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software/i.test(glRendererName);
        renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.82;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        const maxAnisotropy = isSoftwareGl
            ? 1
            : Math.min(8, renderer.capabilities.getMaxAnisotropy());
        container.innerHTML = "";
        container.appendChild(renderer.domElement);
        // 2. Scene & Subtle RoomEnvironment PBR Reflections (reduced intensity so surfaces never wash out)
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c192c);
        scene.fog = new THREE.FogExp2(0x1e293b, 0.008);
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTexture;
        scene.environmentIntensity = 0.42;
        pmremGenerator.dispose();
        // 3. Perspective Camera & Smooth OrbitControls
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
        camera.position.set(...CAMERA_PRESETS.overview.pos);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(...CAMERA_PRESETS.overview.target);
        controls.enableDamping = !isSoftwareGl;
        controls.dampingFactor = 0.055;
        controls.maxPolarAngle = Math.PI / 2 - 0.03;
        controls.minDistance = 5.5;
        controls.maxDistance = 42;
        controls.update();
        const onControlStart = () => {
            stateRef.current.transitionActive = false;
        };
        controls.addEventListener("start", onControlStart);
        // 4. Physical Atmospheric Sky Shader + Soft Subtle Sun Disc in the Horizon
        const sky = new Sky();
        sky.scale.setScalar(220);
        scene.add(sky);
        const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.68);
        hemiLight.position.set(0, 30, 0);
        scene.add(hemiLight);
        const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.05);
        sunLight.position.set(16, 22, 18);
        sunLight.castShadow = true;
        const shadowRes = isSoftwareGl ? 1024 : 2048;
        sunLight.shadow.mapSize.set(shadowRes, shadowRes);
        sunLight.shadow.camera.near = 2;
        sunLight.shadow.camera.far = 95;
        const d = 22;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        sunLight.shadow.bias = -0.0004;
        sunLight.shadow.normalBias = 0.02;
        scene.add(sunLight);
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.48);
        rimLight.position.set(-14, 10, -14);
        scene.add(rimLight);
        const dcInteriorLight = new THREE.PointLight(0x38bdf8, 1.15, 14);
        dcInteriorLight.position.set(-1.4, 2.4, 0);
        scene.add(dcInteriorLight);
        // Subtle, non-glaring Solar Disc above the Mountain Horizon
        const solarCoronaTex = createSolarCoronaTexture();
        const sunAssemblyGroup = new THREE.Group();
        scene.add(sunAssemblyGroup);
        const sunCoreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 24), new THREE.MeshBasicMaterial({ color: 0xfef3c7, fog: false }));
        sunAssemblyGroup.add(sunCoreMesh);
        const sunInnerCorona = new THREE.Sprite(new THREE.SpriteMaterial({
            map: solarCoronaTex,
            color: 0xfde68a,
            transparent: true,
            opacity: 0.48,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
        }));
        sunInnerCorona.scale.set(5.2, 5.2, 1);
        sunAssemblyGroup.add(sunInnerCorona);
        // Function to update Sky Shader, Subtle Sun Disc, and Balanced Shadows dynamically
        const applyAtmosphere = (dynamicAngleOffset = 0) => {
            const modeId = stateRef.current.lightingMode;
            const basePreset = LIGHTING_MODES[modeId];
            const isHighPoll = stateRef.current.pollutedStatus === "Tinggi";
            let elevation = basePreset.elevation;
            let azimuth = basePreset.azimuth;
            let badgeX = basePreset.sunBadgePos[0];
            let badgeY = basePreset.sunBadgePos[1];
            if (modeId === "solarCycle") {
                const cycle = (Math.sin(dynamicAngleOffset) + 1) * 0.5; // 0..1
                azimuth = -50 + cycle * 100;
                elevation = 10 + Math.sin(cycle * Math.PI) * 26;
                badgeX = -12 + cycle * 24;
                badgeY = 6.2 + Math.sin(cycle * Math.PI) * 2.8;
            }
            const skyUniforms = sky.material.uniforms;
            skyUniforms["turbidity"].value = isHighPoll
                ? basePreset.turbidity + 3.0
                : basePreset.turbidity;
            skyUniforms["rayleigh"].value = basePreset.rayleigh;
            skyUniforms["mieCoefficient"].value = isHighPoll ? 0.008 : 0.0025;
            skyUniforms["mieDirectionalG"].value = 0.72;
            const phi = THREE.MathUtils.degToRad(90 - elevation);
            const theta = THREE.MathUtils.degToRad(azimuth);
            _sunSpherical.setFromSphericalCoords(1, phi, theta);
            skyUniforms["sunPosition"].value.copy(_sunSpherical);
            // Position DirectionalLight for crisp architectural 3/4 shadows
            sunLight.position.copy(_sunSpherical).multiplyScalar(38);
            // Place subtle visual sun orb above the mountain horizon
            sunAssemblyGroup.position.set(badgeX, badgeY, basePreset.sunBadgePos[2]);
            sunAssemblyGroup.visible = elevation > 0;
            const sunNorm = Math.max(0, Math.min(1, (elevation - 8) / 26));
            const dynamicSunColor = new THREE.Color(basePreset.sunColor);
            if (modeId === "solarCycle") {
                dynamicSunColor.lerpColors(new THREE.Color(0xfb923c), new THREE.Color(0xfff7ed), sunNorm);
            }
            sunLight.color.copy(dynamicSunColor);
            sunLight.intensity = basePreset.sunIntensity;
            sunInnerCorona.material.color.copy(dynamicSunColor);
            hemiLight.color.setHex(basePreset.hemiSky);
            hemiLight.groundColor.setHex(basePreset.hemiGround);
            hemiLight.intensity = basePreset.hemiIntensity;
            renderer.toneMappingExposure = basePreset.exposure;
            const fogHex = isHighPoll ? 0x2b2323 : basePreset.fogColor;
            scene.fog = new THREE.FogExp2(fogHex, isHighPoll ? 0.011 : 0.0075);
        };
        updateLightingRef.current = applyAtmosphere;
        applyAtmosphere(0);
        // 5. Generate High-Resolution Procedural Textures
        const groundTextures = createIndustrialGroundTexture(maxAnisotropy);
        const rackTextures = createServerRackTexture(maxAnisotropy);
        const claddingTexture = createArchitecturalCladdingTexture(maxAnisotropy);
        const waterTextures = createWaterNormalAndCausticsTextures(maxAnisotropy);
        const smokeSpriteTexture = createSoftSmokePlumeTexture();
        const solarPanelTexture = createSolarPanelTexture(maxAnisotropy);
        // 6. Static World Infrastructure Foundation
        const staticWorldGroup = new THREE.Group();
        scene.add(staticWorldGroup);
        // Distant Mountain Range Horizon Silhouette (Z = -26)
        const mountainMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.92,
            metalness: 0.05,
        });
        const mountainPeaks = [
            [-26, 4.8, -26, 9.5],
            [-14, 6.2, -28, 11.2],
            [-2, 5.0, -27, 10.0],
            [11, 6.6, -28, 12.0],
            [24, 5.2, -26, 9.6],
        ];
        mountainPeaks.forEach(([mx, mh, mz, mr]) => {
            const peak = new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 7), mountainMat);
            peak.position.set(mx, mh / 2 - 1.2, mz);
            peak.rotation.y = mx * 0.2;
            peak.receiveShadow = true;
            staticWorldGroup.add(peak);
        });
        // Main Industrial Concrete Campus Slab
        const mainGroundMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            map: groundTextures.map,
            bumpMap: groundTextures.bumpMap,
            bumpScale: 0.045,
            roughnessMap: groundTextures.roughnessMap,
            roughness: 0.72,
            metalness: 0.15,
        });
        const mainGround = new THREE.Mesh(new THREE.BoxGeometry(24.5, 1.4, 16.5), mainGroundMat);
        mainGround.position.set(-4.5, -0.7, 0);
        mainGround.receiveShadow = true;
        staticWorldGroup.add(mainGround);
        // Shoreline Concrete Quay Wall & Basin Bed (Zone 4)
        const basinFloor = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.5, 16.5), new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 }));
        basinFloor.position.set(12.2, -1.5, 0);
        basinFloor.receiveShadow = true;
        staticWorldGroup.add(basinFloor);
        const basinBackBank = new THREE.Mesh(new THREE.BoxGeometry(10.2, 1.4, 1.0), mainGroundMat);
        basinBackBank.position.set(12.2, -0.7, -7.75);
        staticWorldGroup.add(basinBackBank);
        const basinRightBank = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 16.5), mainGroundMat);
        basinRightBank.position.set(16.8, -0.7, 0);
        staticWorldGroup.add(basinRightBank);
        // Shoreline Boulders along the Water Quay (X = 7.6)
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            bumpMap: groundTextures.bumpMap,
            bumpScale: 0.05,
            roughness: 0.85,
            metalness: 0.1,
        });
        [-5.8, -3.4, -1.6, 1.8, 3.9, 5.9].forEach((rz, idx) => {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (idx % 3) * 0.16, 1), rockMat);
            rock.position.set(7.65, -0.25, rz);
            rock.rotation.set(idx * 0.7, idx * 1.1, 0);
            rock.castShadow = true;
            rock.receiveShadow = true;
            staticWorldGroup.add(rock);
        });
        // 7. Dynamic World Group & Fluid Animation Collections
        const dynamicWorldGroup = new THREE.Group();
        scene.add(dynamicWorldGroup);
        const spinningActors = [];
        const curveParticles = [];
        const softPlumes = [];
        const windSwayActors = [];
        const swimmingFish = [];
        const rackTrafficBars = [];
        let waterSurfaceMesh = null;
        let causticsMesh = null;
        const clearDynamicWorld = () => {
            spinningActors.length = 0;
            curveParticles.length = 0;
            softPlumes.length = 0;
            windSwayActors.length = 0;
            swimmingFish.length = 0;
            rackTrafficBars.length = 0;
            waterSurfaceMesh = null;
            causticsMesh = null;
            while (dynamicWorldGroup.children.length > 0) {
                const child = dynamicWorldGroup.children[0];
                dynamicWorldGroup.remove(child);
            }
        };
        const buildDynamicWorld = () => {
            clearDynamicWorld();
            const st = stateRef.current;
            const isGeo = st.electricity.toLowerCase().includes("geothermal");
            const isWater = st.cooler === "Air";
            const hasIpal = st.waterCoolerSys.includes("-IPAL");
            const isClosed = st.waterCoolerSys.includes("Tertutup");
            // =====================================================================
            // ZONE 1: 3D POWER PLANT & TRANSMISSION PYLON (X = -11.4)
            // =====================================================================
            const powerGroup = new THREE.Group();
            powerGroup.position.set(-11.4, 0, 0);
            dynamicWorldGroup.add(powerGroup);
            const padMesh = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 7.8), new THREE.MeshStandardMaterial({
                color: 0x334155,
                bumpMap: groundTextures.bumpMap,
                bumpScale: 0.03,
                roughness: 0.72,
                metalness: 0.25,
            }));
            padMesh.position.y = 0.14;
            padMesh.receiveShadow = true;
            powerGroup.add(padMesh);
            if (isGeo) {
                // ===================================================================
                // AUTHENTIC 3D GEOTHERMAL POWER PLANT (PLTP - PANAS BUMI)
                // 1. Production & Reinjection Wellhead Pad (Kepala Sumur Panas Bumi)
                // 2. Cyclonic Steam Separator Vessel & Insulated Steam Pipelines
                // 3. Cutaway Glass Turbine Hall with Indoor Multi-Stage Steam Turbine
                // 4. 3-Cell Mechanical-Draft Geothermal Cooling Tower Bank + Soft Steam
                // ===================================================================
                const steelPipeMat = new THREE.MeshStandardMaterial({
                    color: 0xcbd5e1,
                    roughness: 0.25,
                    metalness: 0.85,
                });
                const tealAccentMat = new THREE.MeshStandardMaterial({
                    color: 0x0d9488,
                    roughness: 0.32,
                    metalness: 0.65,
                });
                const valveRedMat = new THREE.MeshStandardMaterial({
                    color: 0xe11d48,
                    roughness: 0.35,
                    metalness: 0.5,
                });
                // 1. Geothermal Wellhead Pad & Subterranean Reservoir Glow (Front-Left: x = -2.1, z = 1.9)
                const wellPad = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 2.6), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.2 }));
                wellPad.position.set(-2.1, 0.32, 1.85);
                wellPad.receiveShadow = true;
                powerGroup.add(wellPad);
                [1.15, 2.45].forEach((wz) => {
                    // Glowing subterranean geothermal bore ring
                    const boreGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 20), new THREE.MeshStandardMaterial({
                        color: 0x10b981,
                        emissive: 0x059669,
                        emissiveIntensity: 0.9,
                        roughness: 0.2,
                    }));
                    boreGlow.position.set(-2.1, 0.42, wz);
                    powerGroup.add(boreGlow);
                    // Vertical Wellhead Christmas-Tree Casing & Master Valves
                    const wellStem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.15, 16), steelPipeMat);
                    wellStem.position.set(-2.1, 0.98, wz);
                    wellStem.castShadow = true;
                    powerGroup.add(wellStem);
                    // Flanges & Cross-Manifold
                    [0.72, 1.12, 1.45].forEach((fy) => {
                        const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), tealAccentMat);
                        flange.position.set(-2.1, fy, wz);
                        powerGroup.add(flange);
                    });
                    const crossTee = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 12), steelPipeMat);
                    crossTee.rotation.z = Math.PI / 2;
                    crossTee.position.set(-2.1, 1.12, wz);
                    powerGroup.add(crossTee);
                    // Red Valve Handwheel
                    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 16), valveRedMat);
                    wheel.rotation.y = Math.PI / 2;
                    wheel.position.set(-2.45, 1.12, wz);
                    powerGroup.add(wheel);
                });
                // 2. Vertical Cyclonic Steam-Brine Flash Separator Vessel (x = -2.1, z = -0.15)
                const separatorVessel = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 2.25, 24), steelPipeMat);
                separatorVessel.position.set(-2.1, 1.45, -0.15);
                separatorVessel.castShadow = true;
                separatorVessel.receiveShadow = true;
                powerGroup.add(separatorVessel);
                const sepDome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), tealAccentMat);
                sepDome.position.set(-2.1, 2.57, -0.15);
                powerGroup.add(sepDome);
                // Separator structural bands
                [0.95, 1.95].forEach((by) => {
                    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.59, 0.59, 0.08, 24), tealAccentMat);
                    ring.position.set(-2.1, by, -0.15);
                    powerGroup.add(ring);
                });
                // Insulated 3D Steam Pipelines: Wellheads -> Cyclonic Separator -> Turbine Hall
                const wellToSepCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-11.4 - 2.1, 1.35, 2.45),
                    new THREE.Vector3(-11.4 - 2.1, 1.55, 1.15),
                    new THREE.Vector3(-11.4 - 2.1, 1.75, -0.15),
                ]);
                const sepToTurbineCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-11.4 - 2.1, 2.35, -0.15),
                    new THREE.Vector3(-11.4 - 1.1, 2.35, 0.65),
                    new THREE.Vector3(-11.4 - 0.1, 1.55, 1.55),
                ]);
                [wellToSepCurve, sepToTurbineCurve].forEach((curve) => {
                    const steamPipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.11, 12, false), steelPipeMat);
                    steamPipe.castShadow = true;
                    dynamicWorldGroup.add(steamPipe);
                });
                const steamOrbMat = new THREE.MeshStandardMaterial({
                    color: 0x6ee7b7,
                    emissive: 0x10b981,
                    emissiveIntensity: 1.1,
                });
                for (let s = 0; s < 4; s++) {
                    const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), steamOrbMat);
                    dynamicWorldGroup.add(orb1);
                    curveParticles.push({
                        mesh: orb1,
                        curve: wellToSepCurve,
                        phase: s / 4,
                        speed: 0.9,
                    });
                    const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), steamOrbMat);
                    dynamicWorldGroup.add(orb2);
                    curveParticles.push({
                        mesh: orb2,
                        curve: sepToTurbineCurve,
                        phase: s / 4,
                        speed: 0.95,
                    });
                }
                // 3. Cutaway Geothermal Steam Turbine-Generator Hall (Front-Right: x = 0.85, z = 1.65)
                const hallW = 3.9;
                const hallH = 2.15;
                const hallD = 2.45;
                const hallX = 0.85;
                const hallZ = 1.65;
                // Concrete Turbine Pedestal Base inside the Hall
                const hallPedestal = new THREE.Mesh(new THREE.BoxGeometry(hallW, 0.36, hallD), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 }));
                hallPedestal.position.set(hallX, 0.44, hallZ);
                hallPedestal.receiveShadow = true;
                powerGroup.add(hallPedestal);
                // Back Cladding Wall & Roof Deck of Geothermal Turbine Hall
                const hallBackWall = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, 0.2), new THREE.MeshStandardMaterial({
                    color: 0x0f766e,
                    map: claddingTexture,
                    roughness: 0.38,
                    metalness: 0.55,
                }));
                hallBackWall.position.set(hallX, 0.32 + hallH / 2, hallZ - hallD / 2);
                hallBackWall.castShadow = true;
                powerGroup.add(hallBackWall);
                const hallRoof = new THREE.Mesh(new THREE.BoxGeometry(hallW + 0.2, 0.18, hallD + 0.2), tealAccentMat);
                hallRoof.position.set(hallX, 0.32 + hallH + 0.08, hallZ);
                hallRoof.castShadow = true;
                powerGroup.add(hallRoof);
                // Corner Steel Columns for Cutaway Glass View
                [
                    [-hallW / 2, -hallD / 2],
                    [hallW / 2, -hallD / 2],
                    [-hallW / 2, hallD / 2],
                    [hallW / 2, hallD / 2],
                ].forEach(([cx, cz]) => {
                    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, hallH, 0.18), tealAccentMat);
                    col.position.set(hallX + cx, 0.32 + hallH / 2, hallZ + cz);
                    powerGroup.add(col);
                });
                // Cutaway Glass Front Enclosure
                const hallGlass = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, hallD), new THREE.MeshPhysicalMaterial({
                    color: 0x5eead4,
                    transparent: true,
                    opacity: 0.12,
                    roughness: 0.08,
                    clearcoat: 0.85,
                    depthWrite: false,
                }));
                hallGlass.position.set(hallX, 0.32 + hallH / 2, hallZ);
                hallGlass.renderOrder = 5;
                powerGroup.add(hallGlass);
                // INDOOR Multi-Stage Axial Steam Turbine Rotor + Generator Stator (Mounted on Pedestal!)
                const generatorStator = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.05, 20), tealAccentMat);
                generatorStator.rotation.z = Math.PI / 2;
                generatorStator.position.set(hallX + 0.95, 1.15, hallZ);
                generatorStator.castShadow = true;
                powerGroup.add(generatorStator);
                const rotorGroup = new THREE.Group();
                rotorGroup.position.set(hallX - 0.55, 1.15, hallZ);
                const rotorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.85, 16), steelPipeMat);
                rotorShaft.rotation.z = Math.PI / 2;
                rotorGroup.add(rotorShaft);
                // 3 Axial Turbine Discs with Radial Blades (fits cleanly inside the hall!)
                [-0.55, 0, 0.55].forEach((dx, stageIdx) => {
                    const discR = 0.42 + stageIdx * 0.08;
                    const disc = new THREE.Mesh(new THREE.CylinderGeometry(discR, discR, 0.1, 20), steelPipeMat);
                    disc.rotation.z = Math.PI / 2;
                    disc.position.x = dx;
                    rotorGroup.add(disc);
                    for (let b = 0; b < 8; b++) {
                        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, discR * 2.25, 0.14), new THREE.MeshStandardMaterial({
                            color: 0x10b981,
                            emissive: 0x059669,
                            emissiveIntensity: 0.35,
                            metalness: 0.8,
                            roughness: 0.22,
                        }));
                        blade.position.x = dx;
                        blade.rotation.x = (b * Math.PI) / 4;
                        rotorGroup.add(blade);
                    }
                });
                powerGroup.add(rotorGroup);
                spinningActors.push({ mesh: rotorGroup, axis: "x", speed: 6.5 });
                // 4. 3-Cell Mechanical-Draft Geothermal Cooling Tower Bank (Back: x = 0.45, z = -1.75)
                // Height is 2.35 units so it sits cleanly below the top-left HUD badge!
                const ctGroup = new THREE.Group();
                ctGroup.position.set(0.45, 0.28, -1.75);
                powerGroup.add(ctGroup);
                // Cold-water collection basin
                const ctBasin = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.32, 2.35), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 }));
                ctBasin.position.y = 0.16;
                ctBasin.receiveShadow = true;
                ctGroup.add(ctBasin);
                // Main 3-Cell Louvered Condenser Body
                const ctBody = new THREE.Mesh(new THREE.BoxGeometry(4.35, 1.55, 2.1), new THREE.MeshStandardMaterial({
                    color: 0xcbd5e1,
                    map: claddingTexture,
                    roughness: 0.45,
                    metalness: 0.5,
                }));
                ctBody.position.y = 1.08;
                ctBody.castShadow = true;
                ctBody.receiveShadow = true;
                ctGroup.add(ctBody);
                // Teal structural divider frames & air-intake louver strips
                [-1.42, 0, 1.42].forEach((cellX, idx) => {
                    // Top Cylindrical Fan Stack Shroud per Cell
                    const fanShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.42, 24), tealAccentMat);
                    fanShroud.position.set(cellX, 2.04, 0);
                    fanShroud.castShadow = true;
                    ctGroup.add(fanShroud);
                    // Spinning 6-Blade Mechanical Exhaust Fan inside each Shroud
                    const fanHub = new THREE.Group();
                    fanHub.position.set(cellX, 2.18, 0);
                    for (let f = 0; f < 6; f++) {
                        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.035, 0.15), steelPipeMat);
                        blade.rotation.y = (f * Math.PI) / 3;
                        blade.rotation.x = 0.25;
                        fanHub.add(blade);
                    }
                    ctGroup.add(fanHub);
                    spinningActors.push({ mesh: fanHub, axis: "y", speed: 7.5 + idx * 0.5 });
                    // Soft Volumetric Billowing White Geothermal Steam Rising from each Cell
                    for (let p = 0; p < 7; p++) {
                        const steamMat = new THREE.SpriteMaterial({
                            map: smokeSpriteTexture,
                            color: 0xf1f5f9,
                            transparent: true,
                            opacity: 0.0,
                            depthWrite: false,
                        });
                        const sprite = new THREE.Sprite(steamMat);
                        const base = new THREE.Vector3(-11.4 + 0.45 + cellX, 2.6, -1.75);
                        sprite.position.copy(base);
                        dynamicWorldGroup.add(sprite);
                        softPlumes.push({
                            sprite,
                            basePos: base,
                            phase: (p / 7 + idx * 0.33) % 1,
                            speed: 0.58 + (p % 3) * 0.07,
                            maxHeight: 2.9,
                            driftX: 0.95,
                            seed: idx * 11 + p * 1.9,
                            baseScale: 0.85,
                            maxScale: 2.15,
                            maxOpacity: 0.46,
                            spinSpeed: (p % 2 === 0 ? 1 : -1) * 0.42,
                        });
                    }
                });
            }
            else {
                // COAL POWER PLANT: BOILER BUILDING, COAL MOUND, CONVEYOR & SOFT VOLUMETRIC SMOKE
                const boilerMat = new THREE.MeshStandardMaterial({
                    color: 0x334155,
                    map: claddingTexture,
                    roughness: 0.55,
                    metalness: 0.52,
                });
                const boiler = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.2, 3.6), boilerMat);
                boiler.position.set(0.3, 1.85, 0.5);
                boiler.castShadow = true;
                boiler.receiveShadow = true;
                powerGroup.add(boiler);
                const winMat = new THREE.MeshStandardMaterial({
                    color: 0xfde68a,
                    emissive: 0xd97706,
                    emissiveIntensity: 0.85,
                });
                [-1.1, 0.3, 1.7].forEach((wx) => {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.08), winMat);
                    win.position.set(wx, 1.45, 2.31);
                    powerGroup.add(win);
                });
                // Raw Coal Stockpile Mound & Inclined Conveyor Ramp
                const coalMound = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.2, 14), new THREE.MeshStandardMaterial({
                    color: 0x090d16,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.08,
                    roughness: 0.95,
                }));
                coalMound.position.set(-2.1, 0.8, 2.1);
                coalMound.castShadow = true;
                powerGroup.add(coalMound);
                const conveyor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 0.45), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.4 }));
                conveyor.position.set(-1.1, 1.55, 1.6);
                conveyor.rotation.z = 0.42;
                conveyor.castShadow = true;
                powerGroup.add(conveyor);
                // Twin Industrial Smokestacks with Aviation Warning Bands
                const stackMat = new THREE.MeshStandardMaterial({
                    color: 0x475569,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.04,
                    roughness: 0.7,
                    metalness: 0.3,
                });
                const redStripeMat = new THREE.MeshStandardMaterial({
                    color: 0xdc2626,
                    roughness: 0.5,
                });
                [-1.3, 1.3].forEach((sx, idx) => {
                    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.56, 5.5, 24), stackMat);
                    stack.position.set(sx, 3.05, -1.6);
                    stack.castShadow = true;
                    powerGroup.add(stack);
                    [4.6, 5.3].forEach((ry) => {
                        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.28, 20), redStripeMat);
                        band.position.set(sx, ry, -1.6);
                        powerGroup.add(band);
                    });
                    // Soft Volumetric Billowing Dark Coal Smoke Sprites
                    for (let p = 0; p < 14; p++) {
                        const smokeMat = new THREE.SpriteMaterial({
                            map: smokeSpriteTexture,
                            color: p < 3 ? 0x64748b : 0x334155,
                            transparent: true,
                            opacity: 0.0,
                            depthWrite: false,
                        });
                        const sprite = new THREE.Sprite(smokeMat);
                        const base = new THREE.Vector3(-11.4 + sx, 5.85, -1.6);
                        sprite.position.copy(base);
                        dynamicWorldGroup.add(sprite);
                        softPlumes.push({
                            sprite,
                            basePos: base,
                            phase: (p / 14 + idx * 0.42) % 1,
                            speed: 0.62 + (p % 3) * 0.07,
                            maxHeight: 5.0,
                            driftX: 2.1,
                            seed: idx * 17 + p * 2.1,
                            baseScale: 0.9,
                            maxScale: 3.1,
                            maxOpacity: 0.62,
                            spinSpeed: (p % 2 === 0 ? 1 : -1) * 0.55,
                        });
                    }
                });
            }
            // 3D High-Voltage Transmission Pylon & Sagged Catenary Power Cables (Zone 1 -> Zone 2)
            const pylon = createTransmissionPylon();
            pylon.position.set(-6.9, 0, -0.5);
            dynamicWorldGroup.add(pylon);
            const pulseColor = isGeo ? 0x10b981 : 0xf59e0b;
            const wireMat = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.85,
                roughness: 0.25,
            });
            const pulseMat = new THREE.MeshStandardMaterial({
                color: pulseColor,
                emissive: pulseColor,
                emissiveIntensity: 1.15,
                roughness: 0.2,
            });
            [-1.1, 0.1].forEach((wz, idx) => {
                const powerCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-9.5, 2.6, wz),
                    new THREE.Vector3(-8.2, 2.95, wz),
                    new THREE.Vector3(-6.9, 3.55, wz),
                    new THREE.Vector3(-5.5, 2.9, wz),
                    new THREE.Vector3(-4.2, 2.5, wz),
                ]);
                const wireMesh = new THREE.Mesh(new THREE.TubeGeometry(powerCurve, 32, 0.038, 8, false), wireMat);
                dynamicWorldGroup.add(wireMesh);
                for (let p = 0; p < 5; p++) {
                    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), pulseMat);
                    dynamicWorldGroup.add(orb);
                    curveParticles.push({
                        mesh: orb,
                        curve: powerCurve,
                        phase: (p * 0.2 + idx * 0.1) % 1,
                        speed: 0.78,
                    });
                }
            });
            // =====================================================================
            // ZONE 2: 3D HYPERSCALE / CAMPUS DATA CENTER HALL (X = -1.4)
            // =====================================================================
            const dcGroup = new THREE.Group();
            dcGroup.position.set(-1.4, 0, 0);
            dynamicWorldGroup.add(dcGroup);
            const dcWidth = st.scale === 2 ? 7.2 : st.scale === 1 ? 5.8 : 4.4;
            const dcDepth = st.scale === 2 ? 6.8 : st.scale === 1 ? 5.4 : 4.2;
            const dcHeight = st.scale === 2 ? 3.8 : st.scale === 1 ? 3.1 : 2.5;
            // Raised Anti-Static Server Hall Plinth
            const dcBase = new THREE.Mesh(new THREE.BoxGeometry(dcWidth + 0.6, 0.32, dcDepth + 0.6), new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                roughness: 0.35,
                metalness: 0.65,
            }));
            dcBase.position.y = 0.16;
            dcBase.receiveShadow = true;
            dcGroup.add(dcBase);
            // Architectural Cladding Back Wall
            const cladWallMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                map: claddingTexture,
                roughness: 0.42,
                metalness: 0.62,
            });
            const backWall = new THREE.Mesh(new THREE.BoxGeometry(dcWidth, dcHeight, 0.28), cladWallMat);
            backWall.position.set(0, dcHeight / 2 + 0.32, -dcDepth / 2);
            backWall.castShadow = true;
            backWall.receiveShadow = true;
            dcGroup.add(backWall);
            // Steel Structural Exo-Frame Pillars around Cutaway Glass
            const pillarMat = new THREE.MeshStandardMaterial({
                color: 0x0284c7,
                roughness: 0.28,
                metalness: 0.78,
            });
            [
                [-dcWidth / 2, -dcDepth / 2],
                [dcWidth / 2, -dcDepth / 2],
                [-dcWidth / 2, dcDepth / 2],
                [dcWidth / 2, dcDepth / 2],
            ].forEach(([px, pz]) => {
                const col = new THREE.Mesh(new THREE.BoxGeometry(0.26, dcHeight + 0.2, 0.26), pillarMat);
                col.position.set(px, dcHeight / 2 + 0.32, pz);
                col.castShadow = true;
                dcGroup.add(col);
            });
            // Roof Frame & Angled Monocrystalline Solar Panel Arrays
            const roofBeam = new THREE.Mesh(new THREE.BoxGeometry(dcWidth + 0.3, 0.22, dcDepth + 0.3), pillarMat);
            roofBeam.position.set(0, dcHeight + 0.34, 0);
            dcGroup.add(roofBeam);
            const solarMat = new THREE.MeshPhysicalMaterial({
                color: 0xbae6fd,
                map: solarPanelTexture,
                roughness: 0.2,
                metalness: 0.55,
                clearcoat: 0.7,
            });
            [-dcDepth * 0.24, dcDepth * 0.22].forEach((sz) => {
                const panel = new THREE.Mesh(new THREE.BoxGeometry(dcWidth * 0.82, 0.06, dcDepth * 0.28), solarMat);
                panel.position.set(0, dcHeight + 0.58, sz);
                panel.rotation.x = 0.18;
                panel.castShadow = true;
                dcGroup.add(panel);
            });
            // Cutaway Optical Glass Enclosure
            const glassHull = new THREE.Mesh(new THREE.BoxGeometry(dcWidth, dcHeight, dcDepth), new THREE.MeshPhysicalMaterial({
                color: 0x7dd3fc,
                transparent: true,
                opacity: 0.11,
                roughness: 0.08,
                metalness: 0.1,
                clearcoat: 0.8,
                depthWrite: false,
            }));
            glassHull.position.set(0, dcHeight / 2 + 0.32, 0);
            glassHull.renderOrder = 6;
            dcGroup.add(glassHull);
            // High-Definition Textured 3D Server Racks Array + Animated Data Traffic Telemetry Bars
            const cols = st.scale === 2 ? 5 : st.scale === 1 ? 4 : 2;
            const rows = st.scale === 2 ? 2 : 1;
            const rackBodyMat = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                roughness: 0.32,
                metalness: 0.78,
            });
            const rackFrontMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: rackTextures.map,
                emissive: 0x38bdf8,
                emissiveMap: rackTextures.emissiveMap,
                emissiveIntensity: 0.92,
                roughness: 0.25,
                metalness: 0.6,
            });
            const rackMaterials = [
                rackBodyMat,
                rackBodyMat,
                rackBodyMat,
                rackBodyMat,
                rackFrontMat,
                rackFrontMat,
            ];
            const rackH = dcHeight - 0.55;
            const trafficMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
            });
            for (let r = 0; r < rows; r++) {
                const rz = rows === 2 ? (r === 0 ? -1.25 : 1.25) : 0;
                // Overhead Yellow Fiber-Optic Cable Tray above each Server Row
                const tray = new THREE.Mesh(new THREE.BoxGeometry(dcWidth - 1.0, 0.08, 0.35), new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.32, metalness: 0.6 }));
                tray.position.set(0, rackH + 0.45, rz);
                dcGroup.add(tray);
                for (let c = 0; c < cols; c++) {
                    const rx = (c - (cols - 1) / 2) * 1.22;
                    const rackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, rackH, 0.95), rackMaterials);
                    rackMesh.position.set(rx, 0.32 + rackH / 2, rz);
                    rackMesh.castShadow = true;
                    rackMesh.receiveShadow = true;
                    dcGroup.add(rackMesh);
                    // Animated Vertical Fiber-Optic Telemetry Light Bar scanning smoothly along each rack
                    const scannerBar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.97), trafficMat);
                    scannerBar.position.set(rx, 0.5 + rackH * 0.5, rz);
                    dcGroup.add(scannerBar);
                    rackTrafficBars.push({
                        mesh: scannerBar,
                        baseY: 0.48 + rackH * 0.5,
                        rangeY: rackH * 0.42,
                        phase: c * 0.7 + r * 1.4,
                        speed: 2.2 + (c % 2) * 0.6,
                    });
                }
            }
            // =====================================================================
            // ZONE 3: 3D COOLING SYSTEM & IPAL PLANT (X = +5.2)
            // =====================================================================
            const coolingGroup = new THREE.Group();
            coolingGroup.position.set(5.2, 0, 0);
            dynamicWorldGroup.add(coolingGroup);
            // Translucent Glass-Jacketed Curved Hot Return & Cold Supply Conduits
            const hotCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(2.1, 1.9, -0.8),
                new THREE.Vector3(3.1, 2.05, -0.8),
                new THREE.Vector3(3.8, 1.75, -0.8),
                new THREE.Vector3(4.4, 1.5, -0.8),
            ]);
            const coldCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(4.4, 0.75, 0.8),
                new THREE.Vector3(3.8, 0.85, 0.8),
                new THREE.Vector3(3.1, 0.85, 0.8),
                new THREE.Vector3(2.1, 0.75, 0.8),
            ]);
            const hotGlassPipe = new THREE.Mesh(new THREE.TubeGeometry(hotCurve, 28, 0.16, 14, false), new THREE.MeshPhysicalMaterial({
                color: 0xea580c,
                roughness: 0.2,
                metalness: 0.35,
                clearcoat: 0.8,
                transparent: true,
                opacity: 0.55,
            }));
            dynamicWorldGroup.add(hotGlassPipe);
            const coldGlassPipe = new THREE.Mesh(new THREE.TubeGeometry(coldCurve, 28, 0.16, 14, false), new THREE.MeshPhysicalMaterial({
                color: 0x0284c7,
                roughness: 0.2,
                metalness: 0.35,
                clearcoat: 0.8,
                transparent: true,
                opacity: 0.55,
            }));
            dynamicWorldGroup.add(coldGlassPipe);
            const hotOrbMat = new THREE.MeshStandardMaterial({
                color: 0xfdba74,
                emissive: 0xea580c,
                emissiveIntensity: 1.1,
            });
            const coldOrbMat = new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                emissive: 0x0284c7,
                emissiveIntensity: 1.1,
            });
            for (let i = 0; i < 6; i++) {
                const hOrb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), hotOrbMat);
                dynamicWorldGroup.add(hOrb);
                curveParticles.push({
                    mesh: hOrb,
                    curve: hotCurve,
                    phase: i / 6,
                    speed: 0.82,
                });
                const cOrb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), coldOrbMat);
                dynamicWorldGroup.add(cOrb);
                curveParticles.push({
                    mesh: cOrb,
                    curve: coldCurve,
                    phase: i / 6,
                    speed: 0.82,
                });
            }
            if (isWater) {
                // HYDRO COOLING + MULTI-STAGE IPAL CLARIFIER & MBR FILTRATION PLANT
                const concreteWallMat = new THREE.MeshStandardMaterial({
                    color: 0x94a3b8,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.04,
                    roughness: 0.72,
                    metalness: 0.18,
                });
                // Outer Cylindrical Concrete Sedimentation Basin
                const clarifierBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 1.35, 36), concreteWallMat);
                clarifierBasin.position.set(-0.2, 0.68, -0.3);
                clarifierBasin.castShadow = true;
                clarifierBasin.receiveShadow = true;
                coolingGroup.add(clarifierBasin);
                // Shimmering Water Surface inside Clarifier Basin
                const clarifierWater = new THREE.Mesh(new THREE.CylinderGeometry(1.74, 1.74, 0.12, 36), new THREE.MeshPhysicalMaterial({
                    color: hasIpal ? 0x0d9488 : 0xb91c1c,
                    normalMap: waterTextures.normalMap,
                    normalScale: new THREE.Vector2(0.35, 0.35),
                    roughness: 0.15,
                    metalness: 0.1,
                    clearcoat: 0.85,
                }));
                clarifierWater.position.set(-0.2, 1.32, -0.3);
                coolingGroup.add(clarifierWater);
                // Rotating 3D Mechanical Skimmer Bridge
                const skimmerGroup = new THREE.Group();
                skimmerGroup.position.set(-0.2, 1.45, -0.3);
                const walkway = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.12, 0.36), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.78, roughness: 0.28 }));
                skimmerGroup.add(walkway);
                const crossRake = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 3.4), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.72, roughness: 0.28 }));
                skimmerGroup.add(crossRake);
                const centerDrive = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.45, 16), new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.8, roughness: 0.22 }));
                centerDrive.position.y = 0.2;
                skimmerGroup.add(centerDrive);
                coolingGroup.add(skimmerGroup);
                if (hasIpal) {
                    spinningActors.push({ mesh: skimmerGroup, axis: "y", speed: 1.35 });
                }
                // 3 Vertical Stainless/Blue Membrane Bio-Reactor (MBR) Filtration Vessels
                [-1.4, 0, 1.4].forEach((fz) => {
                    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.3, 24), new THREE.MeshStandardMaterial({
                        color: hasIpal ? 0x0284c7 : 0x7f1d1d,
                        roughness: 0.22,
                        metalness: 0.8,
                    }));
                    vessel.position.set(1.75, 1.15, fz);
                    vessel.castShadow = true;
                    coolingGroup.add(vessel);
                    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.18 }));
                    cap.position.set(1.75, 2.3, fz);
                    coolingGroup.add(cap);
                });
                // Curved Discharge Pipeline into Zone 4 Ecosystem
                const outCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(6.95, 0.9, 0),
                    new THREE.Vector3(7.65, 0.9, 0),
                    new THREE.Vector3(8.2, 0.45, 0),
                    new THREE.Vector3(8.65, 0.05, 0),
                ]);
                const outPipe = new THREE.Mesh(new THREE.TubeGeometry(outCurve, 20, 0.15, 12, false), new THREE.MeshPhysicalMaterial({
                    color: hasIpal ? 0x10b981 : 0xef4444,
                    roughness: 0.25,
                    metalness: 0.45,
                    clearcoat: 0.8,
                    transparent: true,
                    opacity: 0.65,
                }));
                dynamicWorldGroup.add(outPipe);
                if (!isClosed || !hasIpal) {
                    const outHex = hasIpal ? 0x38bdf8 : 0xef4444;
                    const outOrbMat = new THREE.MeshStandardMaterial({
                        color: outHex,
                        emissive: outHex,
                        emissiveIntensity: 1.1,
                    });
                    for (let i = 0; i < 5; i++) {
                        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), outOrbMat);
                        dynamicWorldGroup.add(drop);
                        curveParticles.push({
                            mesh: drop,
                            curve: outCurve,
                            phase: i / 5,
                            speed: 0.92,
                        });
                    }
                }
            }
            else {
                // AIR COOLING (Industrial Multi-Fan HVAC Chiller Bank with Copper Coils & Aerodynamic Fans)
                const acUnits = st.airCooler === "AC Presisi Besar"
                    ? 3
                    : st.airCooler === "AC Presisi Kecil"
                        ? 2
                        : 1;
                const housingMat = new THREE.MeshStandardMaterial({
                    color: 0x334155,
                    map: claddingTexture,
                    roughness: 0.35,
                    metalness: 0.72,
                });
                const copperMat = new THREE.MeshStandardMaterial({
                    color: 0xb45309,
                    roughness: 0.28,
                    metalness: 0.82,
                });
                for (let u = 0; u < acUnits; u++) {
                    const uz = (u - (acUnits - 1) / 2) * 2.2;
                    const unitGroup = new THREE.Group();
                    unitGroup.position.set(0.2, 0, uz);
                    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.85, 1.75), housingMat);
                    chassis.position.y = 0.95;
                    chassis.castShadow = true;
                    chassis.receiveShadow = true;
                    unitGroup.add(chassis);
                    const coilPanel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.8), copperMat);
                    coilPanel.position.y = 0.95;
                    unitGroup.add(coilPanel);
                    [-0.68, 0.68].forEach((fx) => {
                        const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.24, 20), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.75, roughness: 0.28 }));
                        shroud.position.set(fx, 1.98, 0);
                        unitGroup.add(shroud);
                        const fanGroup = new THREE.Group();
                        fanGroup.position.set(fx, 2.04, 0);
                        for (let b = 0; b < 6; b++) {
                            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.04, 0.16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.22 }));
                            blade.rotation.y = (b * Math.PI) / 3;
                            blade.rotation.x = 0.28;
                            fanGroup.add(blade);
                        }
                        unitGroup.add(fanGroup);
                        spinningActors.push({ mesh: fanGroup, axis: "y", speed: 8.2 });
                    });
                    coolingGroup.add(unitGroup);
                }
            }
            // =====================================================================
            // ZONE 4: 3D ECOSYSTEM, GERSTNER WATER WAVES & CAUSTICS (X = +12.0)
            // =====================================================================
            const ecoGroup = new THREE.Group();
            ecoGroup.position.set(12.0, 0, 0);
            dynamicWorldGroup.add(ecoGroup);
            const waterColorHex = st.pollutedStatus === "Aman"
                ? 0x0369a1
                : st.pollutedStatus === "Sedang"
                    ? 0x0e7490
                    : 0x7c2d12;
            // High-Density Water Surface Mesh with Tangent-Space Normal Map
            const waterGeo = new THREE.PlaneGeometry(8.9, 14.9, 36, 36);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshPhysicalMaterial({
                color: waterColorHex,
                normalMap: waterTextures.normalMap,
                normalScale: new THREE.Vector2(0.45, 0.45),
                roughness: 0.12,
                metalness: 0.1,
                clearcoat: 0.85,
                clearcoatRoughness: 0.08,
                ior: 1.333,
                transparent: true,
                opacity: 0.86,
            });
            const waterMesh = new THREE.Mesh(waterGeo, waterMat);
            waterMesh.position.set(0.05, -0.22, 0);
            waterMesh.receiveShadow = true;
            ecoGroup.add(waterMesh);
            waterSurfaceMesh = waterMesh;
            // Subtle Animated Underwater Caustics Layer on the Basin Floor
            const causticsGeo = new THREE.PlaneGeometry(8.7, 14.7);
            causticsGeo.rotateX(-Math.PI / 2);
            const causticsPlane = new THREE.Mesh(causticsGeo, new THREE.MeshBasicMaterial({
                map: waterTextures.causticsMap,
                color: st.pollutedStatus === "Aman" ? 0x38bdf8 : 0xd97706,
                transparent: true,
                opacity: st.pollutedStatus === "Tinggi" ? 0.08 : 0.24,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }));
            causticsPlane.position.set(0.05, -1.21, 0);
            ecoGroup.add(causticsPlane);
            causticsMesh = causticsPlane;
            // Deep Water Volume Slab
            const waterVolume = new THREE.Mesh(new THREE.BoxGeometry(8.85, 1.05, 14.85), new THREE.MeshStandardMaterial({
                color: waterColorHex,
                transparent: true,
                opacity: 0.56,
                roughness: 0.28,
            }));
            waterVolume.position.set(0.05, -0.8, 0);
            ecoGroup.add(waterVolume);
            if (isWater && st.hydro === "Tangki Penyimpanan Internal") {
                // High-Detail Pressurized Industrial Water Storage Silos with domes
                const tankMat = new THREE.MeshStandardMaterial({
                    color: 0x0284c7,
                    map: claddingTexture,
                    roughness: 0.28,
                    metalness: 0.76,
                });
                const domeMat = new THREE.MeshStandardMaterial({
                    color: 0xcbd5e1,
                    roughness: 0.22,
                    metalness: 0.85,
                });
                [-2.0, 2.0].forEach((tz) => {
                    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 3.2, 28), tankMat);
                    cyl.position.set(-0.6, 1.4, tz);
                    cyl.castShadow = true;
                    cyl.receiveShadow = true;
                    ecoGroup.add(cyl);
                    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.35, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
                    dome.position.set(-0.6, 3.0, tz);
                    ecoGroup.add(dome);
                });
            }
            else if (isWater && st.hydro === "Waduk") {
                // Concrete Hydroelectric Dam Wall
                const damMat = new THREE.MeshStandardMaterial({
                    color: 0x94a3b8,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.05,
                    roughness: 0.72,
                    metalness: 0.18,
                });
                const damWall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 14.8), damMat);
                damWall.position.set(-4.0, 0.7, 0);
                damWall.castShadow = true;
                damWall.receiveShadow = true;
                ecoGroup.add(damWall);
            }
            // Realistic Wind-Swaying Multi-Lobe Trees along the Quay & Campus Perimeter
            const foliageColor = st.pollutedStatus === "Aman"
                ? 0x10b981
                : st.pollutedStatus === "Sedang"
                    ? 0xd97706
                    : 0x7c2d12;
            const treePlacements = [
                [6.6, 0, -5.4, 1.08],
                [6.9, 0, -3.5, 0.9],
                [6.5, 0, 3.4, 0.96],
                [6.8, 0, 5.4, 1.14],
                [-14.8, 0, -5.2, 1.12],
                [-14.9, 0, 4.8, 0.96],
                [-4.8, 0, -5.8, 0.92],
                [1.8, 0, -5.8, 1.02],
            ];
            treePlacements.forEach(([tx, ty, tz, tScale], idx) => {
                const { root, canopy } = createRealisticTree(foliageColor, tScale);
                root.position.set(tx, ty, tz);
                dynamicWorldGroup.add(root);
                windSwayActors.push({
                    root,
                    canopy,
                    phase: idx * 1.35 + tx * 0.25,
                });
            });
            // Multi-Jointed S-Curve Undulating 3D Fish Schools inside the Water Basin
            const fishHex = st.pollutedStatus === "Aman"
                ? 0x38bdf8
                : st.pollutedStatus === "Sedang"
                    ? 0xfbbf24
                    : 0xf87171;
            for (let f = 0; f < 7; f++) {
                const fishParts = createMultiJointFish(fishHex);
                const cx = 10.6 + (f % 2) * 2.5;
                const cz = -4.5 + f * 1.5;
                fishParts.root.position.set(cx, -0.58, cz);
                dynamicWorldGroup.add(fishParts.root);
                swimmingFish.push({
                    ...fishParts,
                    centerX: cx,
                    centerY: -0.58,
                    centerZ: cz,
                    radiusX: 1.2 + (f % 2) * 0.5,
                    radiusZ: 0.95 + (f % 3) * 0.38,
                    phase: f * 1.15,
                    speed: st.pollutedStatus === "Tinggi" ? 0.55 : 1.38,
                });
            }
        };
        rebuildWorldRef.current = buildDynamicWorld;
        buildDynamicWorld();
        if (!isSoftwareGl) {
            renderer.compile(scene, camera);
        }
        // 8. Continuous Fluid Animation Loop with Software-WebGL `afterDraw` Pacing
        let lastTime = performance.now() * 0.001;
        let elapsed = 0;
        let solarCycleTime = 0.6;
        let frameId = 0;
        let isDisposed = false;
        function afterDraw(cb) {
            const gl = renderer.getContext();
            const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
            gl.flush();
            const poll = () => {
                if (isDisposed)
                    return;
                const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
                if (state === gl.UNSIGNALED) {
                    frameId = window.setTimeout(poll, 5);
                }
                else {
                    if (sync)
                        gl.deleteSync(sync);
                    frameId = window.setTimeout(cb, 80);
                }
            };
            frameId = window.setTimeout(poll, 5);
        }
        function tick() {
            if (isDisposed)
                return;
            const now = performance.now() * 0.001;
            const rawDelta = Math.min(now - lastTime, 0.1);
            lastTime = now;
            const st = stateRef.current;
            const simDelta = st.isPlaying ? rawDelta * st.simSpeed : 0;
            elapsed += simDelta > 0 ? simDelta : rawDelta * 0.35;
            // 1. Critically-Damped Smooth Camera Preset Transition + Optional Subtle Idle Float
            if (st.transitionActive) {
                const preset = CAMERA_PRESETS[st.cameraPreset];
                _targetPos.set(...preset.pos);
                _targetLook.set(...preset.target);
                const smoothAlpha = 1 - Math.exp(-6.2 * rawDelta);
                camera.position.lerp(_targetPos, smoothAlpha);
                controls.target.lerp(_targetLook, smoothAlpha);
                if (camera.position.distanceToSquared(_targetPos) < 0.015) {
                    st.transitionActive = false;
                }
            }
            else if (st.cinematicMotion && st.isPlaying) {
                camera.position.x += Math.sin(elapsed * 0.45) * 0.003;
                camera.position.y += Math.cos(elapsed * 0.38) * 0.0018;
            }
            if (controls.enableDamping) {
                controls.update();
            }
            // 2. Subtle Solar Corona Rotation & Automatic Solar Cycle
            sunInnerCorona.material.rotation = elapsed * 0.1;
            if (st.lightingMode === "solarCycle" && st.isPlaying) {
                solarCycleTime += simDelta * 0.32;
                applyAtmosphere(solarCycleTime);
            }
            if (st.isPlaying) {
                // 3. Spin turbines, AC fans, and IPAL clarifier bridge smoothly
                for (let i = 0; i < spinningActors.length; i++) {
                    const item = spinningActors[i];
                    item.mesh.rotation[item.axis] += item.speed * simDelta;
                }
                // 4. Move electrical & pipeline particles smoothly along 3D CatmullRom curves
                for (let i = 0; i < curveParticles.length; i++) {
                    const cp = curveParticles[i];
                    cp.phase = (cp.phase + cp.speed * simDelta * 0.42) % 1;
                    cp.curve.getPointAt(cp.phase, cp.mesh.position);
                }
                // 5. Fluid Volumetric Steam & Smoke Sprites with Perlin-like Curl Turbulence & Bell-Curve Fade
                for (let i = 0; i < softPlumes.length; i++) {
                    const sp = softPlumes[i];
                    sp.phase = (sp.phase + sp.speed * simDelta * 0.24) % 1;
                    const p = sp.phase;
                    const curlX = sp.driftX * Math.pow(p, 1.25) +
                        Math.sin(p * Math.PI * 3.0 + sp.seed + elapsed * 0.8) * (0.18 + p * 0.42);
                    const curlZ = Math.cos(p * Math.PI * 2.5 + sp.seed + elapsed * 0.7) * (0.16 + p * 0.36);
                    sp.sprite.position.set(sp.basePos.x + curlX, sp.basePos.y + p * sp.maxHeight, sp.basePos.z + curlZ);
                    const currentScale = THREE.MathUtils.lerp(sp.baseScale, sp.maxScale, p);
                    sp.sprite.scale.set(currentScale, currentScale, 1);
                    sp.sprite.material.opacity = Math.sin(p * Math.PI) * sp.maxOpacity;
                    sp.sprite.material.rotation += sp.spinSpeed * simDelta;
                }
                // 6. Harmonic Wind Sway on 3D Trees & Canopy Lobes
                for (let i = 0; i < windSwayActors.length; i++) {
                    const tree = windSwayActors[i];
                    const windX = Math.sin(elapsed * 1.85 + tree.phase) * 0.048 +
                        Math.sin(elapsed * 3.9 + tree.phase * 1.7) * 0.018;
                    const windZ = Math.cos(elapsed * 1.55 + tree.phase) * 0.036 +
                        Math.cos(elapsed * 3.2 + tree.phase * 1.3) * 0.014;
                    tree.canopy.rotation.z = windX;
                    tree.canopy.rotation.x = windZ;
                    tree.root.rotation.z = windX * 0.25;
                }
                // 7. Multi-Jointed S-Curve Undulating 3D Fish along Figure-8 / Lissajous Paths
                for (let i = 0; i < swimmingFish.length; i++) {
                    const sf = swimmingFish[i];
                    sf.phase += sf.speed * simDelta;
                    const t = sf.phase;
                    const nx = sf.centerX + Math.cos(t) * sf.radiusX + Math.sin(t * 2.0) * 0.28;
                    const nz = sf.centerZ + Math.sin(t) * sf.radiusZ + Math.cos(t * 2.0) * 0.22;
                    const ny = sf.centerY + Math.sin(t * 2.4 + i) * 0.065;
                    const dx = -Math.sin(t) * sf.radiusX + Math.cos(t * 2.0) * 0.56;
                    const dz = Math.cos(t) * sf.radiusZ - Math.sin(t * 2.0) * 0.44;
                    sf.root.position.set(nx, ny, nz);
                    const heading = Math.atan2(-dz, dx);
                    const spineWave = Math.sin(elapsed * 9.5 + i * 1.4);
                    sf.root.rotation.y = heading + spineWave * 0.07;
                    sf.root.rotation.z = Math.cos(t * 2.4 + i) * 0.08;
                    sf.midPivot.rotation.y = Math.sin(elapsed * 9.5 + i * 1.4 - 0.7) * 0.26;
                    sf.tailPivot.rotation.y = Math.sin(elapsed * 9.5 + i * 1.4 - 1.4) * 0.42;
                    const finFlutter = Math.sin(elapsed * 12 + i) * 0.24;
                    sf.leftFin.rotation.z = finFlutter;
                    sf.rightFin.rotation.z = -finFlutter;
                }
                // 8. Server Rack Telemetry Light Bars & Subtle Interior Light
                for (let i = 0; i < rackTrafficBars.length; i++) {
                    const bar = rackTrafficBars[i];
                    bar.mesh.position.y =
                        bar.baseY + Math.sin(elapsed * bar.speed + bar.phase) * bar.rangeY;
                }
                dcInteriorLight.intensity = 1.05 + Math.sin(elapsed * 3.5) * 0.2;
                // 9. Gerstner 3D Water Wave Displacement + Normal Map Scroll + Subtle Caustics
                waterTextures.normalMap.offset.x = (elapsed * 0.048) % 1;
                waterTextures.normalMap.offset.y = (elapsed * 0.036) % 1;
                waterTextures.causticsMap.offset.x = (elapsed * 0.032) % 1;
                waterTextures.causticsMap.offset.y = (-elapsed * 0.028) % 1;
                if (causticsMesh) {
                    const cMat = causticsMesh.material;
                    cMat.opacity =
                        (st.pollutedStatus === "Tinggi" ? 0.08 : 0.22) +
                            Math.sin(elapsed * 3.1) * 0.04;
                }
                if (waterSurfaceMesh) {
                    const posAttr = waterSurfaceMesh.geometry.attributes.position;
                    for (let v = 0; v < posAttr.count; v++) {
                        const vx = posAttr.getX(v);
                        const vz = posAttr.getZ(v);
                        const w1 = Math.sin(vx * 1.35 + vz * 0.45 + elapsed * 2.6) * 0.042;
                        const w2 = Math.cos(vz * 1.45 - vx * 0.55 + elapsed * 2.15) * 0.034;
                        const w3 = Math.sin((vx + vz) * 2.4 - elapsed * 3.4) * 0.016;
                        posAttr.setY(v, w1 + w2 + w3);
                    }
                    posAttr.needsUpdate = true;
                    waterSurfaceMesh.geometry.computeVertexNormals();
                }
            }
            renderer.render(scene, camera);
            if (isSoftwareGl) {
                afterDraw(tick);
            }
            else {
                frameId = requestAnimationFrame(tick);
            }
        }
        tick();
        const handleResize = () => {
            if (!container || isDisposed)
                return;
            const w = container.clientWidth || 920;
            const h = container.clientHeight || 520;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            isDisposed = true;
            cancelAnimationFrame(frameId);
            clearTimeout(frameId);
            window.removeEventListener("resize", handleResize);
            controls.removeEventListener("start", onControlStart);
            controls.dispose();
            groundTextures.map.dispose();
            groundTextures.bumpMap.dispose();
            rackTextures.map.dispose();
            rackTextures.emissiveMap.dispose();
            claddingTexture.dispose();
            waterTextures.normalMap.dispose();
            waterTextures.causticsMap.dispose();
            smokeSpriteTexture.dispose();
            solarCoronaTex.dispose();
            solarPanelTexture.dispose();
            envTexture.dispose();
            renderer.dispose();
        };
    }, []);
    const badgeTone = pollutedStatus === "Aman"
        ? "text-emerald-400 border-emerald-500/40"
        : pollutedStatus === "Sedang"
            ? "text-amber-400 border-amber-500/40"
            : "text-red-400 border-red-500/40";
    return (<div className="relative w-full h-[490px] sm:h-[550px] rounded-xl overflow-hidden border border-slate-800 bg-[#07111f]" data-testid="threejs-simulation-stage">
      {/* Dedicated WebGL Mount Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing"/>

      {/* Top Overlay: Ultra HD Telemetry & Low-Glare Atmosphere Status */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2 pointer-events-none z-10">
        <div className="bg-slate-950/88 backdrop-blur-md border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 pointer-events-auto">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-semibold text-sky-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400"/>
              ULTRA HD 3D · NATURAL LIGHT
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>PUE {pue}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{elapsedLabel}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Geser untuk putar 360° · Asap volumetrik lembut, pohon berayun &amp; gerak ikan organik
          </div>
        </div>

        <div className={`bg-slate-950/88 backdrop-blur-md border ${badgeTone} rounded-lg px-3.5 py-2 text-xs font-mono pointer-events-auto shrink-0`}>
          <div className="text-[10px] text-slate-400">STATUS LINGKUNGAN &amp; TERMAL</div>
          <div className="text-sm font-bold tabular-nums">
            {pollutedStatus.toUpperCase()} ({pollutionScore.toFixed(1)}%) · ΔT {thermalDelta}
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[96%] max-w-[940px] z-10 flex flex-col items-center pointer-events-none">
        <button type="button" onClick={() => setDockCollapsed((c) => !c)} className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-300 bg-slate-950/95 border border-b-0 border-slate-800 rounded-t-lg hover:text-white transition-colors cursor-pointer">
          {dockCollapsed ? (<>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400"/>
              <span>Tampilkan Kontrol Kamera &amp; Cahaya</span>
            </>) : (<>
              <ChevronDown className="w-3.5 h-3.5 text-sky-400"/>
              <span>Sembunyikan Kontrol</span>
            </>)}
        </button>

        {!dockCollapsed && (<div className="pointer-events-auto w-full bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
            {/* Row 1: Camera Presets, Sunlight Modes & Playback Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Camera className="w-3.5 h-3.5 text-sky-400"/>
                  <span>Kamera:</span>
                </span>
                {Object.keys(CAMERA_PRESETS).map((id) => (<button key={id} type="button" onClick={() => handleSelectCamera(id)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${cameraPreset === id
                    ? "bg-sky-600 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                    {CAMERA_PRESETS[id].label}
                  </button>))}
              </div>

              {/* Sunlight & Solar Cycle Switcher + Play/Pause */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-0.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400 ml-1.5"/>
                  {Object.keys(LIGHTING_MODES).map((modeId) => (<button key={modeId} type="button" onClick={() => setLightingMode(modeId)} className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${lightingMode === modeId
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"}`}>
                      {LIGHTING_MODES[modeId].label}
                    </button>))}
                </div>

                <button type="button" onClick={() => setCinematicMotion((v) => !v)} title="Aktifkan/nonaktifkan ayunan kamera sinematik halus" className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${cinematicMotion
                ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"}`}>
                  Kamera Sinematik
                </button>

                <button type="button" onClick={onTogglePlay} aria-label={isPlaying ? "Jeda Animasi 3D" : "Putar Animasi 3D"} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0">
                  {isPlaying ? (<>
                      <Pause className="w-3.5 h-3.5 text-amber-400 fill-current"/>
                      <span>Jeda</span>
                    </>) : (<>
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-current"/>
                      <span>Putar</span>
                    </>)}
                </button>

                <button type="button" onClick={onCycleSpeed} aria-label="Kecepatan animasi 3D" className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0">
                  <FastForward className="w-3.5 h-3.5"/>
                  <span>{simSpeed}x</span>
                </button>

                <button type="button" onClick={onResetProgress} aria-label="Reset waktu simulasi" className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md transition-colors cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>

            {/* Row 2: Interactive Timeline Slider */}
            <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80 text-xs">
              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                Progres Simulasi:
              </span>
              <label htmlFor="three-timeline-slider" className="sr-only">
                Progres Waktu Simulasi 3D
              </label>
              <input id="three-timeline-slider" type="range" min={1} max={100} value={Math.round(progress)} onChange={(e) => onChangeProgress(Number(e.target.value))} className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"/>
              <span className="font-mono text-sky-400 w-10 text-right tabular-nums shrink-0">
                {Math.round(progress)}%
              </span>
            </div>
          </div>)}
      </div>
    </div>);
}