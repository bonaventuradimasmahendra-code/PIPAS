import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Sky } from "three/addons/objects/Sky.js";
import { Play, Pause, FastForward, RotateCcw, ChevronDown, ChevronUp, Camera, Sun, } from "lucide-react";
import { createIndustrialGroundTexture, createServerRackTexture, createArchitecturalCladdingTexture, createWaterRippleTexture, } from "./proceduralTextures";
const CAMERA_PRESETS = {
    overview: {
        pos: [0.5, 11.8, 23.5],
        target: [0, 1.8, 0],
        label: "Ikhtisar 3D",
    },
    power: {
        pos: [-10.8, 6.2, 11.2],
        target: [-10.8, 2.4, -0.4],
        label: "01. Pembangkit",
    },
    server: {
        pos: [-1.5, 5.8, 9.8],
        target: [-1.5, 2.0, 0],
        label: "02. Hall Server",
    },
    cooling: {
        pos: [5.4, 5.6, 9.5],
        target: [5.2, 1.5, 0],
        label: "03. Pendingin & IPAL",
    },
    ecology: {
        pos: [12.8, 5.8, 11.2],
        target: [11.5, 0.8, 0],
        label: "04. Ekosistem",
    },
};
// Pre-allocated math helpers at module scope (Zero GC in render loop)
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _sunVec = new THREE.Vector3();
export default function DataCenter3DScene({ scale, electricity, cooler, airCooler, hydro, waterCoolerSys, pollutedStatus, pollutionScore, pue, thermalDelta, ecosystemHealth, isPlaying, simSpeed, progress, elapsedLabel, onTogglePlay, onCycleSpeed, onResetProgress, onChangeProgress, }) {
    const canvasMountRef = useRef(null);
    const [cameraPreset, setCameraPreset] = useState("overview");
    const [lightingMode, setLightingMode] = useState("sunset");
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
        isPlaying,
        simSpeed,
        cameraPreset,
        lightingMode,
        transitionActive: false,
    });
    useEffect(() => {
        stateRef.current = {
            ...stateRef.current,
            scale,
            electricity,
            cooler,
            airCooler,
            hydro,
            waterCoolerSys,
            pollutedStatus,
            pollutionScore,
            isPlaying,
            simSpeed,
            lightingMode,
        };
    }, [
        scale,
        electricity,
        cooler,
        airCooler,
        hydro,
        waterCoolerSys,
        pollutedStatus,
        pollutionScore,
        isPlaying,
        simSpeed,
        lightingMode,
    ]);
    const handleSelectCamera = (presetId) => {
        setCameraPreset(presetId);
        stateRef.current.cameraPreset = presetId;
        stateRef.current.transitionActive = true;
    };
    const rebuildWorldRef = useRef(null);
    const updateAtmosphereRef = useRef(null);
    useEffect(() => {
        if (rebuildWorldRef.current) {
            rebuildWorldRef.current();
        }
    }, [scale, electricity, cooler, airCooler, hydro, waterCoolerSys, pollutedStatus]);
    useEffect(() => {
        if (updateAtmosphereRef.current) {
            updateAtmosphereRef.current();
        }
    }, [lightingMode, pollutedStatus]);
    useEffect(() => {
        const container = canvasMountRef.current;
        if (!container)
            return;
        // 1. Detect software WebGL (SwiftShader / llvmpipe)
        const isSoftwareGl = (() => {
            const probeCanvas = document.createElement("canvas");
            const gl = probeCanvas.getContext("webgl2");
            if (!gl)
                return true;
            const ext = gl.getExtension("WEBGL_debug_renderer_info");
            const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
            const gpu = String(gl.getParameter(param));
            gl.getExtension("WEBGL_lose_context")?.loseContext();
            return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        })();
        const width = container.clientWidth || 920;
        const height = container.clientHeight || 520;
        const renderer = new THREE.WebGLRenderer({
            antialias: !isSoftwareGl,
            powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = !isSoftwareGl;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.innerHTML = "";
        container.appendChild(renderer.domElement);
        const maxAniso = renderer.capabilities.getMaxAnisotropy() || 4;
        // Generate High-Resolution Procedural Textures Once
        const groundTextures = createIndustrialGroundTexture(maxAniso);
        const rackTextures = createServerRackTexture(maxAniso);
        const claddingTexture = createArchitecturalCladdingTexture(maxAniso);
        const waterRippleTex = createWaterRippleTexture();
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0b192c, 0.011);
        // 2. Studio PBR Environment Reflection via RoomEnvironment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.035).texture;
        scene.environment = envTexture;
        pmremGenerator.dispose();
        // 3. Physical Sky Atmosphere Shader (Sky.js)
        const sky = new Sky();
        sky.scale.setScalar(450);
        scene.add(sky);
        // 4. Camera & OrbitControls
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 160);
        camera.position.set(...CAMERA_PRESETS.overview.pos);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(...CAMERA_PRESETS.overview.target);
        controls.enableDamping = !isSoftwareGl;
        controls.dampingFactor = 0.06;
        controls.maxPolarAngle = Math.PI * 0.475;
        controls.minDistance = 5;
        controls.maxDistance = 40;
        controls.update();
        const onControlStart = () => {
            stateRef.current.transitionActive = false;
        };
        controls.addEventListener("start", onControlStart);
        // 5. Realistic Multi-Point Studio & Sun Lighting Rig
        const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.9);
        scene.add(hemiLight);
        const sunLight = new THREE.DirectionalLight(0xfff1e6, 2.6);
        sunLight.position.set(16, 22, 14);
        if (!isSoftwareGl) {
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.set(1024, 1024);
            sunLight.shadow.camera.near = 2;
            sunLight.shadow.camera.far = 65;
            const d = 22;
            sunLight.shadow.camera.left = -d;
            sunLight.shadow.camera.right = d;
            sunLight.shadow.camera.top = d;
            sunLight.shadow.camera.bottom = -d;
            sunLight.shadow.bias = -0.0005;
            sunLight.shadow.normalBias = 0.02;
        }
        scene.add(sunLight);
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
        rimLight.position.set(-18, 14, -12);
        scene.add(rimLight);
        // Function to update Sky Shader & Lighting based on Time-of-Day & Pollution Status
        const updateAtmosphere = () => {
            const st = stateRef.current;
            const skyUniforms = sky.material.uniforms;
            const isPolluted = st.pollutedStatus === "Tinggi";
            if (st.lightingMode === "day") {
                skyUniforms["turbidity"].value = isPolluted ? 14 : 4.5;
                skyUniforms["rayleigh"].value = isPolluted ? 3.2 : 1.8;
                skyUniforms["mieCoefficient"].value = 0.005;
                skyUniforms["mieDirectionalG"].value = 0.8;
                const elevation = isPolluted ? 22 : 36;
                const phi = THREE.MathUtils.degToRad(90 - elevation);
                const theta = THREE.MathUtils.degToRad(145);
                _sunVec.setFromSphericalCoords(1, phi, theta);
                skyUniforms["sunPosition"].value.copy(_sunVec);
                sunLight.color.setHex(isPolluted ? 0xfdba74 : 0xffffff);
                sunLight.intensity = 2.8;
                hemiLight.intensity = 1.05;
                scene.fog = new THREE.FogExp2(isPolluted ? 0x3b2f2f : 0x7dd3fc, 0.006);
            }
            else if (st.lightingMode === "sunset") {
                skyUniforms["turbidity"].value = isPolluted ? 16 : 8.5;
                skyUniforms["rayleigh"].value = isPolluted ? 3.8 : 2.6;
                skyUniforms["mieCoefficient"].value = 0.008;
                skyUniforms["mieDirectionalG"].value = 0.85;
                const phi = THREE.MathUtils.degToRad(90 - 9.5);
                const theta = THREE.MathUtils.degToRad(155);
                _sunVec.setFromSphericalCoords(1, phi, theta);
                skyUniforms["sunPosition"].value.copy(_sunVec);
                sunLight.color.setHex(0xffedd5);
                sunLight.intensity = 2.4;
                hemiLight.intensity = 0.85;
                scene.fog = new THREE.FogExp2(isPolluted ? 0x2a1810 : 0x1e293b, 0.009);
            }
            else {
                // Night Mode
                skyUniforms["turbidity"].value = 1.2;
                skyUniforms["rayleigh"].value = 0.15;
                const phi = THREE.MathUtils.degToRad(90 - -6);
                const theta = THREE.MathUtils.degToRad(160);
                _sunVec.setFromSphericalCoords(1, phi, theta);
                skyUniforms["sunPosition"].value.copy(_sunVec);
                sunLight.color.setHex(0x93c5fd);
                sunLight.intensity = 1.1;
                hemiLight.intensity = 0.45;
                scene.fog = new THREE.FogExp2(0x040914, 0.012);
            }
        };
        updateAtmosphereRef.current = updateAtmosphere;
        updateAtmosphere();
        // 6. Detailed Base Diorama Platform (Asphalt Ground, Geological Strata, Shoreline Rocks, Seabed)
        const staticBaseGroup = new THREE.Group();
        scene.add(staticBaseGroup);
        const industrialGroundMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: groundTextures.map,
            bumpMap: groundTextures.bumpMap,
            bumpScale: 0.04,
            roughness: 0.78,
            metalness: 0.12,
        });
        // Main Industrial Land Slab (Zones 1..3: X = -16.5 to +7.5)
        const landMesh = new THREE.Mesh(new THREE.BoxGeometry(24.0, 1.4, 15.0), industrialGroundMat);
        landMesh.position.set(-4.5, -0.7, 0);
        landMesh.receiveShadow = true;
        staticBaseGroup.add(landMesh);
        // Coastal / Riverbank Concrete Retaining Quay Wall at X = +7.5
        const quayWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.55, 15.05), new THREE.MeshStandardMaterial({
            color: 0x64748b,
            bumpMap: groundTextures.bumpMap,
            bumpScale: 0.03,
            roughness: 0.7,
            metalness: 0.2,
        }));
        quayWall.position.set(7.45, -0.62, 0);
        staticBaseGroup.add(quayWall);
        // Sandy/Rocky Seabed under Zone 4 Water Basin
        const seabedMesh = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.6, 15.0), new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            bumpMap: groundTextures.bumpMap,
            bumpScale: 0.05,
            roughness: 0.9,
            metalness: 0.05,
        }));
        seabedMesh.position.set(11.9, -1.65, 0);
        seabedMesh.receiveShadow = true;
        staticBaseGroup.add(seabedMesh);
        // Deep Architectural Diorama Base Plinth (Beveled Dark Slate Frame)
        const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(33.4, 1.5, 15.4), new THREE.MeshStandardMaterial({
            color: 0x090d16,
            roughness: 0.4,
            metalness: 0.6,
        }));
        plinthMesh.position.set(0.1, -2.15, 0);
        staticBaseGroup.add(plinthMesh);
        // Natural Shoreline Rock Outcrops along X = 7.4 and Underwater
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            bumpMap: groundTextures.bumpMap,
            bumpScale: 0.06,
            roughness: 0.85,
            metalness: 0.1,
        });
        const rockCoords = [
            [7.7, -0.9, -5.2, 0.65],
            [8.2, -1.1, -4.4, 0.48],
            [7.8, -0.85, 4.8, 0.72],
            [8.4, -1.15, 3.9, 0.52],
            [13.5, -1.25, -3.5, 0.6],
            [14.2, -1.2, 2.8, 0.55],
        ];
        rockCoords.forEach(([rx, ry, rz, rScale]) => {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rScale, 1), rockMat);
            rock.position.set(rx, ry, rz);
            rock.rotation.set(rx, ry, rz);
            rock.scale.set(1.2, 0.75, 1.0);
            staticBaseGroup.add(rock);
        });
        // Dynamic World Group & Animated Actors
        const dynamicWorldGroup = new THREE.Group();
        scene.add(dynamicWorldGroup);
        const spinningActors = [];
        const curveParticles = [];
        const risingPlumes = [];
        const swimmingFish = [];
        let waterSurfaceMesh = null;
        // Helper: Build a Realistic 3D Steel Lattice Transmission Tower (Pylon)
        const createTransmissionPylon = () => {
            const pylon = new THREE.Group();
            const steelMat = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                roughness: 0.35,
                metalness: 0.85,
            });
            const insulatorMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                roughness: 0.2,
                metalness: 0.5,
            });
            // 4 angled corner legs
            const legPositions = [
                [-0.35, -0.35],
                [0.35, -0.35],
                [-0.35, 0.35],
                [0.35, 0.35],
            ];
            legPositions.forEach(([lx, lz]) => {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 4.4, 8), steelMat);
                leg.position.set(lx * 0.75, 2.2, lz * 0.75);
                leg.rotation.z = lx * 0.08;
                leg.rotation.x = -lz * 0.08;
                pylon.add(leg);
            });
            // 2 Horizontal Cross-arms
            [2.8, 3.8].forEach((cy, idx) => {
                const armW = idx === 0 ? 1.8 : 1.4;
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, armW), steelMat);
                arm.position.set(0, cy, 0);
                pylon.add(arm);
                // Ceramic Hanging Insulators at ends of cross-arm
                [-armW / 2 + 0.1, armW / 2 - 0.1].forEach((iz) => {
                    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 10), insulatorMat);
                    ins.position.set(0, cy - 0.2, iz);
                    pylon.add(ins);
                });
            });
            return pylon;
        };
        // Helper: Multi-part Realistic Tree with Branching Crown & Contact Shadow
        const createRealisticTree = (foliageHex, scaleFactor = 1.0) => {
            const tree = new THREE.Group();
            const trunkMat = new THREE.MeshStandardMaterial({
                color: 0x451a03,
                bumpMap: groundTextures.bumpMap,
                bumpScale: 0.04,
                roughness: 0.9,
                metalness: 0.05,
            });
            const leafMat = new THREE.MeshStandardMaterial({
                color: foliageHex,
                bumpMap: groundTextures.bumpMap,
                bumpScale: 0.03,
                roughness: 0.65,
                metalness: 0.08,
            });
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 1.1, 10), trunkMat);
            trunk.position.y = 0.55;
            trunk.castShadow = true;
            tree.add(trunk);
            // Multi-lobe organic canopy (5 overlapping faceted spheres/cones)
            const lobes = [
                [0, 1.35, 0, 0.72],
                [0.32, 1.18, 0.24, 0.52],
                [-0.3, 1.22, -0.22, 0.54],
                [0.22, 1.58, -0.2, 0.48],
                [0, 1.85, 0, 0.46],
            ];
            lobes.forEach(([lx, ly, lz, lr]) => {
                const lobe = new THREE.Mesh(new THREE.DodecahedronGeometry(lr, 1), leafMat);
                lobe.position.set(lx, ly, lz);
                lobe.castShadow = true;
                tree.add(lobe);
            });
            const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), new THREE.MeshBasicMaterial({
                color: 0x020617,
                transparent: true,
                opacity: 0.45,
                depthWrite: false,
            }));
            shadowDisc.rotation.x = -Math.PI / 2;
            shadowDisc.position.y = 0.02;
            tree.add(shadowDisc);
            tree.scale.setScalar(scaleFactor);
            return tree;
        };
        // Helper: Articulated 3D Fish with Animated Tail Fin
        const createArticulatedFish = (bodyColorHex) => {
            const fish = new THREE.Group();
            const bodyMat = new THREE.MeshPhysicalMaterial({
                color: bodyColorHex,
                roughness: 0.2,
                metalness: 0.35,
                clearcoat: 1.0,
            });
            const finMat = new THREE.MeshStandardMaterial({
                color: 0xe0f2fe,
                roughness: 0.4,
                metalness: 0.2,
            });
            const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.38, 8, 16), bodyMat);
            body.rotation.z = Math.PI / 2;
            body.scale.set(1, 1, 0.6);
            fish.add(body);
            const tailPivot = new THREE.Group();
            tailPivot.position.x = -0.28;
            const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.32, 4), finMat);
            tailFin.rotation.z = -Math.PI / 2;
            tailFin.position.x = -0.12;
            tailFin.scale.set(1, 1, 0.3);
            tailPivot.add(tailFin);
            fish.add(tailPivot);
            const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), finMat);
            dorsal.position.set(0.02, 0.17, 0);
            dorsal.rotation.z = -0.3;
            fish.add(dorsal);
            return { fish, tail: tailPivot };
        };
        // Build / Rebuild Dynamic 3D World
        const buildDynamicWorld = () => {
            while (dynamicWorldGroup.children.length > 0) {
                dynamicWorldGroup.remove(dynamicWorldGroup.children[0]);
            }
            spinningActors.length = 0;
            curveParticles.length = 0;
            risingPlumes.length = 0;
            swimmingFish.length = 0;
            waterSurfaceMesh = null;
            updateAtmosphere();
            const st = stateRef.current;
            const isGeo = st.electricity === "geothermal";
            const isWater = st.scale === 0 ? false : st.cooler === "Air";
            const hasIpal = st.waterCoolerSys.includes("IPAL");
            const isClosed = st.waterCoolerSys.includes("Tertutup");
            // =====================================================================
            // ZONE 1: 3D POWER GENERATION COMPLEX (X = -11.4)
            // =====================================================================
            const powerGroup = new THREE.Group();
            powerGroup.position.set(-11.4, 0, 0);
            dynamicWorldGroup.add(powerGroup);
            // Raised Concrete Industrial Foundation with Yellow Hazard Trim
            const padBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.28, 7.6), new THREE.MeshStandardMaterial({
                color: 0x334155,
                bumpMap: groundTextures.bumpMap,
                bumpScale: 0.03,
                roughness: 0.75,
                metalness: 0.15,
            }));
            padBase.position.y = 0.14;
            padBase.receiveShadow = true;
            powerGroup.add(padBase);
            if (isGeo) {
                // GEOTHERMAL RENEWABLE PLANT (Brushed Cladding Turbine Hall, Hyperbolic Cooling Tower, Steam Loops)
                const geoHallMat = new THREE.MeshStandardMaterial({
                    color: 0x10b981,
                    map: claddingTexture,
                    roughness: 0.35,
                    metalness: 0.65,
                });
                const stainlessMat = new THREE.MeshStandardMaterial({
                    color: 0xe2e8f0,
                    roughness: 0.18,
                    metalness: 0.9,
                });
                const turbineHall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 4.2), geoHallMat);
                turbineHall.position.set(0.7, 1.48, 0.4);
                turbineHall.castShadow = true;
                powerGroup.add(turbineHall);
                // Arched Roof Vault over Geothermal Hall
                const archRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 4.25, 20, 1, false, 0, Math.PI), stainlessMat);
                archRoof.rotation.x = Math.PI / 2;
                archRoof.scale.set(1, 0.45, 1);
                archRoof.position.set(0.7, 2.68, 0.4);
                powerGroup.add(archRoof);
                // 3 Rooftop Spinning Geothermal Steam Exhaust Turbines
                [-1.1, 0.4, 1.9].forEach((tz) => {
                    const ventGroup = new THREE.Group();
                    ventGroup.position.set(0.7, 3.48, tz);
                    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.35, 16), stainlessMat);
                    ventGroup.add(hub);
                    for (let b = 0; b < 6; b++) {
                        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.18), new THREE.MeshStandardMaterial({ color: 0x34d399, metalness: 0.8, roughness: 0.2 }));
                        blade.rotation.y = (b * Math.PI) / 3;
                        ventGroup.add(blade);
                    }
                    powerGroup.add(ventGroup);
                    spinningActors.push({ mesh: ventGroup, axis: "y", speed: 3.4 });
                });
                // Hyperbolic Concrete Cooling Tower (LatheGeometry)
                const lathePoints = [];
                for (let i = 0; i <= 12; i++) {
                    const t = i / 12;
                    const r = 0.95 + 0.38 * Math.pow(t - 0.62, 2) * 2.4;
                    lathePoints.push(new THREE.Vector2(r, t * 3.8));
                }
                const towerGeo = new THREE.LatheGeometry(lathePoints, 24);
                const coolingTower = new THREE.Mesh(towerGeo, new THREE.MeshStandardMaterial({
                    color: 0xe2e8f0,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.03,
                    roughness: 0.7,
                    metalness: 0.15,
                }));
                coolingTower.position.set(-1.55, 0.28, -1.4);
                coolingTower.castShadow = true;
                powerGroup.add(coolingTower);
                // Curved 3D Geothermal Steam Expansion Loop Pipe (TubeGeometry)
                const steamCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-1.6, 0.28, 2.6),
                    new THREE.Vector3(-1.6, 1.8, 2.6),
                    new THREE.Vector3(-1.6, 1.8, 1.2),
                    new THREE.Vector3(-0.8, 1.4, 1.2),
                ]);
                const steamTube = new THREE.Mesh(new THREE.TubeGeometry(steamCurve, 24, 0.16, 12, false), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 }));
                powerGroup.add(steamTube);
                // Clean White Steam Vapor Billows
                const vaporMat = new THREE.MeshStandardMaterial({
                    color: 0xecfdf5,
                    transparent: true,
                    opacity: 0.55,
                    roughness: 0.9,
                });
                for (let i = 0; i < 5; i++) {
                    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + i * 0.08, 1), vaporMat);
                    const base = new THREE.Vector3(-11.4 - 1.55, 4.2, -1.4);
                    puff.position.copy(base);
                    dynamicWorldGroup.add(puff);
                    risingPlumes.push({
                        mesh: puff,
                        basePos: base,
                        phase: i * 0.2,
                        speed: 0.7,
                        maxHeight: 3.2,
                        driftX: 0.4,
                    });
                }
            }
            else {
                // COAL POWER PLANT (PLTU Batubara: Heavy Boiler House, Coal Conveyor, Hyperbolic Tower, 2 Tall Stacks)
                const boilerMat = new THREE.MeshStandardMaterial({
                    color: 0x334155,
                    map: claddingTexture,
                    roughness: 0.6,
                    metalness: 0.45,
                });
                const boilerHouse = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 4.2), boilerMat);
                boilerHouse.position.set(0.5, 1.88, 0.4);
                boilerHouse.castShadow = true;
                powerGroup.add(boilerHouse);
                // Glowing Coal Combustion Furnace Windows
                const fireMat = new THREE.MeshStandardMaterial({
                    color: 0xf97316,
                    emissive: 0xea580c,
                    emissiveIntensity: 2.4,
                    roughness: 0.2,
                });
                for (let i = -1; i <= 1; i++) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.08), fireMat);
                    win.position.set(0.5 + i * 1.05, 1.15, 2.52);
                    powerGroup.add(win);
                }
                // Coal Conveyor Ramp & Dark Coal Stockpile Mound
                const coalMound = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.2, 12), new THREE.MeshStandardMaterial({
                    color: 0x090d16,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.08,
                    roughness: 0.95,
                }));
                coalMound.position.set(-1.6, 0.85, 2.1);
                powerGroup.add(coalMound);
                const conveyor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 0.45), new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.5, roughness: 0.6 }));
                conveyor.position.set(-0.6, 1.65, 1.5);
                conveyor.rotation.z = 0.45;
                powerGroup.add(conveyor);
                // 2 Tall Industrial Flue Smokestacks with Red Aviation Stripes
                const stackMat = new THREE.MeshStandardMaterial({
                    color: 0x64748b,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.03,
                    roughness: 0.7,
                    metalness: 0.25,
                });
                const redStripeMat = new THREE.MeshStandardMaterial({
                    color: 0xdc2626,
                    roughness: 0.4,
                });
                [-1.6, 0.1].forEach((sx, idx) => {
                    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.54, 5.6, 20), stackMat);
                    stack.position.set(sx, 3.05, -1.6);
                    stack.castShadow = true;
                    powerGroup.add(stack);
                    [4.6, 5.3].forEach((ry) => {
                        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.37, 0.28, 20), redStripeMat);
                        band.position.set(sx, ry, -1.6);
                        powerGroup.add(band);
                    });
                    // Volumetric-style Dark Smoke Billows Rising & Drifting
                    const smokeMat = new THREE.MeshStandardMaterial({
                        color: 0x475569,
                        transparent: true,
                        opacity: 0.74,
                        roughness: 0.95,
                    });
                    for (let p = 0; p < 5; p++) {
                        const cloud = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46 + p * 0.14, 1), smokeMat);
                        const base = new THREE.Vector3(-11.4 + sx, 6.0, -1.6);
                        cloud.position.copy(base);
                        dynamicWorldGroup.add(cloud);
                        risingPlumes.push({
                            mesh: cloud,
                            basePos: base,
                            phase: p * 0.2 + idx * 0.1,
                            speed: 0.9,
                            maxHeight: 4.0,
                            driftX: 1.4,
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
                color: 0x64748b,
                metalness: 0.85,
                roughness: 0.25,
            });
            const pulseMat = new THREE.MeshStandardMaterial({
                color: pulseColor,
                emissive: pulseColor,
                emissiveIntensity: 2.6,
                roughness: 0.1,
            });
            [-1.1, 0.1].forEach((wz, idx) => {
                const powerCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-9.5, 2.6, wz),
                    new THREE.Vector3(-6.9, 3.55, wz),
                    new THREE.Vector3(-4.2, 2.5, wz),
                ]);
                const wireMesh = new THREE.Mesh(new THREE.TubeGeometry(powerCurve, 24, 0.04, 8, false), wireMat);
                dynamicWorldGroup.add(wireMesh);
                for (let p = 0; p < 3; p++) {
                    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), pulseMat);
                    dynamicWorldGroup.add(orb);
                    curveParticles.push({
                        mesh: orb,
                        curve: powerCurve,
                        phase: (p * 0.33 + idx * 0.16) % 1,
                        speed: 0.85,
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
            // Raised Anti-Static Server Hall Floor Plinth
            const dcBase = new THREE.Mesh(new THREE.BoxGeometry(dcWidth + 0.6, 0.32, dcDepth + 0.6), new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                roughness: 0.35,
                metalness: 0.65,
            }));
            dcBase.position.y = 0.16;
            dcBase.receiveShadow = true;
            dcGroup.add(dcBase);
            // Architectural Cladding Back Wall & Structural Exo-Columns
            const cladWallMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                map: claddingTexture,
                roughness: 0.4,
                metalness: 0.65,
            });
            const backWall = new THREE.Mesh(new THREE.BoxGeometry(dcWidth, dcHeight, 0.28), cladWallMat);
            backWall.position.set(0, dcHeight / 2 + 0.32, -dcDepth / 2);
            backWall.castShadow = true;
            dcGroup.add(backWall);
            // Steel Structural Exo-Frame Pillars around Cutaway Glass
            const pillarMat = new THREE.MeshStandardMaterial({
                color: 0x0284c7,
                roughness: 0.25,
                metalness: 0.8,
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
            // Roof Frame with Solar / Skylight Louvers
            const roofBeam = new THREE.Mesh(new THREE.BoxGeometry(dcWidth + 0.3, 0.24, dcDepth + 0.3), pillarMat);
            roofBeam.position.set(0, dcHeight + 0.34, 0);
            dcGroup.add(roofBeam);
            // Cutaway Optical Glass Enclosure (depthWrite: false so HD Server Racks inside are crystal clear)
            const glassHull = new THREE.Mesh(new THREE.BoxGeometry(dcWidth, dcHeight, dcDepth), new THREE.MeshPhysicalMaterial({
                color: 0x7dd3fc,
                transparent: true,
                opacity: 0.13,
                roughness: 0.08,
                metalness: 0.1,
                clearcoat: 1.0,
                depthWrite: false,
            }));
            glassHull.position.set(0, dcHeight / 2 + 0.32, 0);
            glassHull.renderOrder = 6;
            dcGroup.add(glassHull);
            // High-Definition Textured 3D Server Racks Array with Emissive Telemetry Maps
            const cols = st.scale === 2 ? 5 : st.scale === 1 ? 4 : 2;
            const rows = st.scale === 2 ? 2 : 1;
            const rackBodyMat = new THREE.MeshStandardMaterial({
                color: 0x111827,
                roughness: 0.3,
                metalness: 0.8,
            });
            const rackFrontMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: rackTextures.map,
                emissive: 0x38bdf8,
                emissiveMap: rackTextures.emissiveMap,
                emissiveIntensity: 1.45,
                roughness: 0.25,
                metalness: 0.6,
            });
            const rackMaterials = [
                rackBodyMat, // right
                rackBodyMat, // left
                rackBodyMat, // top
                rackBodyMat, // bottom
                rackFrontMat, // front (+Z)
                rackFrontMat, // back (-Z)
            ];
            const rackH = dcHeight - 0.55;
            for (let r = 0; r < rows; r++) {
                const rz = rows === 2 ? (r === 0 ? -1.25 : 1.25) : 0;
                // Overhead Yellow Fiber-Optic Cable Tray above each Server Row
                const tray = new THREE.Mesh(new THREE.BoxGeometry(dcWidth - 1.0, 0.08, 0.35), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.6 }));
                tray.position.set(0, rackH + 0.45, rz);
                dcGroup.add(tray);
                for (let c = 0; c < cols; c++) {
                    const rx = (c - (cols - 1) / 2) * 1.22;
                    const rackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, rackH, 0.95), rackMaterials);
                    rackMesh.position.set(rx, 0.32 + rackH / 2, rz);
                    rackMesh.castShadow = true;
                    dcGroup.add(rackMesh);
                }
            }
            // =====================================================================
            // ZONE 3: 3D COOLING SYSTEM & IPAL PLANT (X = +5.2)
            // =====================================================================
            const coolingGroup = new THREE.Group();
            coolingGroup.position.set(5.2, 0, 0);
            dynamicWorldGroup.add(coolingGroup);
            // 3D Curved Hot Return & Cold Supply Pipelines (Server Hall <-> Cooling Station)
            const hotCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(2.1, 1.9, -0.8),
                new THREE.Vector3(3.5, 1.9, -0.8),
                new THREE.Vector3(4.4, 1.5, -0.8),
            ]);
            const coldCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(4.4, 0.75, 0.8),
                new THREE.Vector3(3.5, 0.75, 0.8),
                new THREE.Vector3(2.1, 0.75, 0.8),
            ]);
            const hotPipeMesh = new THREE.Mesh(new THREE.TubeGeometry(hotCurve, 20, 0.16, 12, false), new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.7, roughness: 0.25 }));
            dynamicWorldGroup.add(hotPipeMesh);
            const coldPipeMesh = new THREE.Mesh(new THREE.TubeGeometry(coldCurve, 20, 0.16, 12, false), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.25 }));
            dynamicWorldGroup.add(coldPipeMesh);
            const hotOrbMat = new THREE.MeshStandardMaterial({
                color: 0xf97316,
                emissive: 0xea580c,
                emissiveIntensity: 2.2,
            });
            const coldOrbMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                emissive: 0x0284c7,
                emissiveIntensity: 2.2,
            });
            for (let i = 0; i < 3; i++) {
                const hOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), hotOrbMat);
                dynamicWorldGroup.add(hOrb);
                curveParticles.push({
                    mesh: hOrb,
                    curve: hotCurve,
                    phase: i * 0.33,
                    speed: 0.9,
                });
                const cOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), coldOrbMat);
                dynamicWorldGroup.add(cOrb);
                curveParticles.push({
                    mesh: cOrb,
                    curve: coldCurve,
                    phase: i * 0.33,
                    speed: 0.9,
                });
            }
            if (isWater) {
                // HYDRO COOLING + MULTI-STAGE IPAL CLARIFIER & MBR FILTRATION PLANT
                const concreteWallMat = new THREE.MeshStandardMaterial({
                    color: 0x94a3b8,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.04,
                    roughness: 0.75,
                    metalness: 0.15,
                });
                // Outer Cylindrical Concrete Sedimentation Basin
                const clarifierBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 1.35, 32), concreteWallMat);
                clarifierBasin.position.set(-0.2, 0.68, -0.3);
                clarifierBasin.castShadow = true;
                coolingGroup.add(clarifierBasin);
                // Water Surface inside Clarifier Basin
                const clarifierWater = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.12, 32), new THREE.MeshPhysicalMaterial({
                    color: hasIpal ? 0x0d9488 : 0xb91c1c,
                    roughness: 0.15,
                    metalness: 0.1,
                    clearcoat: 1.0,
                }));
                clarifierWater.position.set(-0.2, 1.32, -0.3);
                coolingGroup.add(clarifierWater);
                // Rotating 3D Mechanical Skimmer Bridge with Handrails & Scraper Blades
                const skimmerGroup = new THREE.Group();
                skimmerGroup.position.set(-0.2, 1.45, -0.3);
                const walkway = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.12, 0.36), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.25 }));
                skimmerGroup.add(walkway);
                const crossRake = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 3.4), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.75, roughness: 0.3 }));
                skimmerGroup.add(crossRake);
                const centerDrive = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.45, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 }));
                centerDrive.position.y = 0.2;
                skimmerGroup.add(centerDrive);
                coolingGroup.add(skimmerGroup);
                if (hasIpal) {
                    spinningActors.push({ mesh: skimmerGroup, axis: "y", speed: 1.5 });
                }
                // 3 Vertical Stainless/Blue Membrane Bio-Reactor (MBR) Filtration Vessels
                [-1.4, 0, 1.4].forEach((fz) => {
                    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.3, 20), new THREE.MeshStandardMaterial({
                        color: hasIpal ? 0x0284c7 : 0x7f1d1d,
                        roughness: 0.22,
                        metalness: 0.82,
                    }));
                    vessel.position.set(1.75, 1.15, fz);
                    vessel.castShadow = true;
                    coolingGroup.add(vessel);
                    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 }));
                    cap.position.set(1.75, 2.3, fz);
                    coolingGroup.add(cap);
                });
                // Curved Discharge Pipeline into Zone 4 Ecosystem
                const outCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(6.95, 0.9, 0),
                    new THREE.Vector3(8.1, 0.9, 0),
                    new THREE.Vector3(8.6, 0.1, 0),
                ]);
                const outPipe = new THREE.Mesh(new THREE.TubeGeometry(outCurve, 16, 0.16, 12, false), new THREE.MeshStandardMaterial({
                    color: hasIpal ? 0x10b981 : 0xef4444,
                    metalness: 0.7,
                    roughness: 0.3,
                }));
                dynamicWorldGroup.add(outPipe);
                if (!isClosed || !hasIpal) {
                    const outHex = hasIpal ? 0x38bdf8 : 0xef4444;
                    const outOrbMat = new THREE.MeshStandardMaterial({
                        color: outHex,
                        emissive: outHex,
                        emissiveIntensity: 2.0,
                    });
                    for (let i = 0; i < 3; i++) {
                        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), outOrbMat);
                        dynamicWorldGroup.add(drop);
                        curveParticles.push({
                            mesh: drop,
                            curve: outCurve,
                            phase: i * 0.33,
                            speed: 1.0,
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
                    metalness: 0.75,
                });
                const copperMat = new THREE.MeshStandardMaterial({
                    color: 0xd97706,
                    roughness: 0.3,
                    metalness: 0.85,
                });
                for (let u = 0; u < acUnits; u++) {
                    const uz = (u - (acUnits - 1) / 2) * 2.2;
                    const unitGroup = new THREE.Group();
                    unitGroup.position.set(0.2, 0, uz);
                    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.85, 1.75), housingMat);
                    chassis.position.y = 0.95;
                    chassis.castShadow = true;
                    unitGroup.add(chassis);
                    // Copper Fin Condenser Side Grille
                    const coilPanel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.8), copperMat);
                    coilPanel.position.y = 0.95;
                    unitGroup.add(coilPanel);
                    // Twin Top Aerodynamic Fan Shrouds per Chiller Unit
                    [-0.68, 0.68].forEach((fx) => {
                        const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.24, 20), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 }));
                        shroud.position.set(fx, 1.98, 0);
                        unitGroup.add(shroud);
                        const fanGroup = new THREE.Group();
                        fanGroup.position.set(fx, 2.04, 0);
                        for (let b = 0; b < 6; b++) {
                            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.04, 0.16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2 }));
                            blade.rotation.y = (b * Math.PI) / 3;
                            blade.rotation.x = 0.25;
                            fanGroup.add(blade);
                        }
                        unitGroup.add(fanGroup);
                        spinningActors.push({ mesh: fanGroup, axis: "y", speed: 7.5 });
                    });
                    coolingGroup.add(unitGroup);
                }
            }
            // =====================================================================
            // ZONE 4: 3D ECOSYSTEM, WATER BASIN & HYDRO STRUCTURES (X = +12.0)
            // =====================================================================
            const ecoGroup = new THREE.Group();
            ecoGroup.position.set(12.0, 0, 0);
            dynamicWorldGroup.add(ecoGroup);
            const waterColorHex = st.pollutedStatus === "Aman"
                ? 0x0284c7
                : st.pollutedStatus === "Sedang"
                    ? 0x0e7490
                    : 0x9a3412;
            const waterGeo = new THREE.PlaneGeometry(8.9, 14.9, 28, 28);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshPhysicalMaterial({
                color: waterColorHex,
                bumpMap: waterRippleTex,
                bumpScale: 0.08,
                roughness: 0.08,
                metalness: 0.12,
                clearcoat: 1.0,
                clearcoatRoughness: 0.06,
                ior: 1.333,
                transparent: true,
                opacity: 0.86,
            });
            const waterMesh = new THREE.Mesh(waterGeo, waterMat);
            waterMesh.position.set(0.05, -0.25, 0);
            waterMesh.receiveShadow = true;
            ecoGroup.add(waterMesh);
            waterSurfaceMesh = waterMesh;
            // Translucent Deep Water Volume Slab below the rippled surface
            const waterVolume = new THREE.Mesh(new THREE.BoxGeometry(8.85, 1.1, 14.85), new THREE.MeshStandardMaterial({
                color: waterColorHex,
                transparent: true,
                opacity: 0.58,
                roughness: 0.3,
            }));
            waterVolume.position.set(0.05, -0.82, 0);
            ecoGroup.add(waterVolume);
            if (isWater && st.hydro === "Tangki Penyimpanan Internal") {
                // High-Detail Pressurized Industrial Water Storage Silos with domes & piping
                const tankMat = new THREE.MeshStandardMaterial({
                    color: 0x0284c7,
                    map: claddingTexture,
                    roughness: 0.28,
                    metalness: 0.78,
                });
                const domeMat = new THREE.MeshStandardMaterial({
                    color: 0xe2e8f0,
                    roughness: 0.2,
                    metalness: 0.9,
                });
                [-2.0, 2.0].forEach((tz) => {
                    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 3.2, 24), tankMat);
                    cyl.position.set(-0.6, 1.4, tz);
                    cyl.castShadow = true;
                    ecoGroup.add(cyl);
                    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
                    dome.position.set(-0.6, 3.0, tz);
                    ecoGroup.add(dome);
                });
            }
            else if (isWater && st.hydro === "Waduk") {
                // Sloped Concrete Hydroelectric Dam with Spillway Buttresses
                const damMat = new THREE.MeshStandardMaterial({
                    color: 0x94a3b8,
                    bumpMap: groundTextures.bumpMap,
                    bumpScale: 0.05,
                    roughness: 0.75,
                    metalness: 0.15,
                });
                const damWall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 14.8), damMat);
                damWall.position.set(-4.0, 0.7, 0);
                damWall.castShadow = true;
                ecoGroup.add(damWall);
            }
            // Realistic Multi-Lobe Trees along the Quay / Shoreline & Campus Perimeter
            const foliageColor = st.pollutedStatus === "Aman"
                ? 0x10b981
                : st.pollutedStatus === "Sedang"
                    ? 0xd97706
                    : 0x7c2d12;
            const treePlacements = [
                [6.6, 0, -5.4, 1.05],
                [6.9, 0, -3.5, 0.88],
                [6.5, 0, 3.4, 0.95],
                [6.8, 0, 5.4, 1.12],
                [-14.8, 0, -5.2, 1.1],
                [-14.9, 0, 4.8, 0.95],
                [-4.8, 0, -5.8, 0.9],
                [1.8, 0, -5.8, 1.0],
            ];
            treePlacements.forEach(([tx, ty, tz, tScale]) => {
                const tree = createRealisticTree(foliageColor, tScale);
                tree.position.set(tx, ty, tz);
                dynamicWorldGroup.add(tree);
            });
            // Articulated 3D Fish Schools swimming inside the Water Basin
            const fishHex = st.pollutedStatus === "Aman"
                ? 0x38bdf8
                : st.pollutedStatus === "Sedang"
                    ? 0xfbbf24
                    : 0xf87171;
            for (let f = 0; f < 6; f++) {
                const { fish, tail } = createArticulatedFish(fishHex);
                const cx = 10.6 + (f % 2) * 2.4;
                const cz = -4.2 + f * 1.7;
                fish.position.set(cx, -0.62, cz);
                dynamicWorldGroup.add(fish);
                swimmingFish.push({
                    group: fish,
                    tail,
                    centerX: cx,
                    centerY: -0.62,
                    centerZ: cz,
                    radiusX: 1.15 + (f % 2) * 0.45,
                    radiusZ: 0.85 + (f % 3) * 0.35,
                    phase: f * 1.1,
                    speed: st.pollutedStatus === "Tinggi" ? 0.55 : 1.55,
                });
            }
        };
        rebuildWorldRef.current = buildDynamicWorld;
        buildDynamicWorld();
        if (!isSoftwareGl) {
            renderer.compile(scene, camera);
        }
        // 7. Continuous Animation Loop with Software-WebGL `afterDraw` Pacing
        const clock = new THREE.Clock();
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
            const rawDelta = Math.min(clock.getDelta(), 0.1);
            const st = stateRef.current;
            const simDelta = st.isPlaying ? rawDelta * st.simSpeed : 0;
            const elapsed = clock.getElapsedTime();
            // Smooth Camera Preset Transition
            if (st.transitionActive) {
                const preset = CAMERA_PRESETS[st.cameraPreset];
                _targetPos.set(...preset.pos);
                _targetLook.set(...preset.target);
                const alpha = 1 - Math.exp(-5.5 * rawDelta);
                camera.position.lerp(_targetPos, alpha);
                controls.target.lerp(_targetLook, alpha);
                if (camera.position.distanceToSquared(_targetPos) < 0.02) {
                    st.transitionActive = false;
                }
            }
            if (controls.enableDamping) {
                controls.update();
            }
            if (st.isPlaying) {
                // 1. Spin turbines, AC fans, and IPAL clarifier bridge
                for (let i = 0; i < spinningActors.length; i++) {
                    const item = spinningActors[i];
                    item.mesh.rotation[item.axis] += item.speed * simDelta;
                }
                // 2. Move electrical & pipeline particles smoothly along 3D CatmullRom curves
                for (let i = 0; i < curveParticles.length; i++) {
                    const cp = curveParticles[i];
                    cp.phase = (cp.phase + cp.speed * simDelta * 0.45) % 1;
                    cp.curve.getPointAt(cp.phase, cp.mesh.position);
                }
                // 3. Rise and billow smoke & steam clouds
                for (let i = 0; i < risingPlumes.length; i++) {
                    const rp = risingPlumes[i];
                    rp.phase = (rp.phase + rp.speed * simDelta * 0.32) % 1;
                    rp.mesh.position.set(rp.basePos.x + rp.phase * rp.driftX + Math.sin(rp.phase * Math.PI * 2) * 0.22, rp.basePos.y + rp.phase * rp.maxHeight, rp.basePos.z + Math.cos(rp.phase * Math.PI * 2) * 0.18);
                    rp.mesh.rotation.y += simDelta * 0.8;
                    rp.mesh.scale.setScalar(0.75 + rp.phase * 0.95);
                }
                // 4. Swim articulated 3D fish with tail-wag oscillation
                for (let i = 0; i < swimmingFish.length; i++) {
                    const sf = swimmingFish[i];
                    sf.phase += sf.speed * simDelta;
                    const nx = sf.centerX + Math.cos(sf.phase) * sf.radiusX;
                    const nz = sf.centerZ + Math.sin(sf.phase) * sf.radiusZ;
                    const dx = -Math.sin(sf.phase) * sf.radiusX;
                    const dz = Math.cos(sf.phase) * sf.radiusZ;
                    sf.group.position.set(nx, sf.centerY + Math.sin(sf.phase * 2) * 0.05, nz);
                    sf.group.rotation.y = Math.atan2(-dz, dx);
                    sf.tail.rotation.y = Math.sin(elapsed * 10 + i) * 0.35;
                }
                // 5. Scroll water ripple texture & vertex wave displacement
                waterRippleTex.offset.x = (elapsed * 0.04) % 1;
                waterRippleTex.offset.y = (elapsed * 0.03) % 1;
                if (waterSurfaceMesh) {
                    const posAttr = waterSurfaceMesh.geometry.attributes.position;
                    for (let v = 0; v < posAttr.count; v++) {
                        const vx = posAttr.getX(v);
                        const vz = posAttr.getZ(v);
                        const waveY = Math.sin(vx * 1.4 + elapsed * 2.6) * 0.045 +
                            Math.cos(vz * 1.2 + elapsed * 2.1) * 0.035;
                        posAttr.setY(v, waveY);
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
            waterRippleTex.dispose();
            envTexture.dispose();
            renderer.dispose();
        };
    }, []);
    const badgeTone = pollutedStatus === "Aman"
        ? "text-emerald-400 border-emerald-500/40"
        : pollutedStatus === "Sedang"
            ? "text-amber-400 border-amber-500/40"
            : "text-red-400 border-red-500/40";
    return (<div className="relative w-full h-[480px] sm:h-[540px] rounded-xl overflow-hidden border border-slate-800 bg-[#07111f]" data-testid="threejs-simulation-stage">
      {/* Dedicated WebGL Mount Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing"/>

      {/* Top Overlay: HD Telemetry & Atmosphere Status */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 pointer-events-auto">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-semibold text-sky-400">3D PBR REALISTIS</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>PUE {pue}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{elapsedLabel}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Geser untuk memutar 360° · Scroll untuk zoom detail rak &amp; pipa
          </div>
        </div>

        <div className={`bg-slate-950/90 border ${badgeTone} rounded-lg px-3.5 py-2 text-xs font-mono pointer-events-auto`}>
          <div className="text-[10px] text-slate-400">STATUS LINGKUNGAN &amp; TERMAL</div>
          <div className="text-sm font-bold tabular-nums">
            {pollutedStatus.toUpperCase()} ({pollutionScore.toFixed(1)}%) · ΔT {thermalDelta}
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[96%] max-w-[900px] z-10 flex flex-col items-center pointer-events-none">
        <button type="button" onClick={() => setDockCollapsed((c) => !c)} className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-300 bg-slate-950/95 border border-b-0 border-slate-800 rounded-t-lg hover:text-white transition-colors cursor-pointer">
          {dockCollapsed ? (<>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400"/>
              <span>Tampilkan Kontrol 3D</span>
            </>) : (<>
              <ChevronDown className="w-3.5 h-3.5 text-sky-400"/>
              <span>Sembunyikan Kontrol</span>
            </>)}
        </button>

        {!dockCollapsed && (<div className="pointer-events-auto w-full bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
            {/* Row 1: Camera Presets, Lighting Mode & Playback Controls */}
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

              {/* Lighting Atmosphere Switcher & Play/Pause */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-0.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400 ml-1.5"/>
                  {[
                { id: "day", label: "Siang" },
                { id: "sunset", label: "Senja" },
                { id: "night", label: "Malam" },
            ].map((mode) => (<button key={mode.id} type="button" onClick={() => setLightingMode(mode.id)} className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${lightingMode === mode.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"}`}>
                      {mode.label}
                    </button>))}
                </div>

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
