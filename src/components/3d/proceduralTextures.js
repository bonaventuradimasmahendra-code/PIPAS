import * as THREE from "three";
/**
 * Generates a high-resolution procedural concrete/asphalt industrial ground texture
 * with subtle aggregate noise, expansion grid seams, weathered tire tracks, and safety markings.
 */
export function createIndustrialGroundTexture(maxAnisotropy = 4) {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Base dark slate architectural concrete
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, size, size);
    // Subtle weathered concrete patches
    for (let p = 0; p < 45; p++) {
        const px = Math.random() * size;
        const py = Math.random() * size;
        const pr = 40 + Math.random() * 110;
        const grad = ctx.createRadialGradient(px, py, 4, px, py, pr);
        grad.addColorStop(0, "rgba(15, 23, 42, 0.28)");
        grad.addColorStop(1, "rgba(30, 41, 59, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
    }
    // Fine aggregate mineral grain
    for (let i = 0; i < 22000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const v = 22 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${v}, ${v + 8}, ${v + 18})`;
        ctx.fillRect(x, y, 2, 2);
    }
    // Expansion joint grid lines with subtle bevel highlight
    const step = 128;
    for (let i = 0; i <= size; i += step) {
        ctx.strokeStyle = "#090d16";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(i + 3, 0);
        ctx.lineTo(i + 3, size);
        ctx.stroke();
    }
    // Industrial safety lane markings
    ctx.strokeStyle = "rgba(245, 158, 11, 0.55)";
    ctx.lineWidth = 5;
    ctx.setLineDash([28, 18]);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.82);
    ctx.lineTo(size, size * 0.82);
    ctx.stroke();
    ctx.setLineDash([]);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(3, 2);
    map.anisotropy = maxAnisotropy;
    // High-frequency grayscale bump & roughness map
    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext("2d");
    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16000; i++) {
        const g = 90 + Math.floor(Math.random() * 75);
        bCtx.fillStyle = `rgb(${g},${g},${g})`;
        bCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(6, 4);
    bumpMap.anisotropy = maxAnisotropy;
    return { map, bumpMap, roughnessMap: bumpMap };
}
/**
 * Generates a high-definition Server Rack front face texture with perforated mesh,
 * server blades, status LEDs, and LCD telemetry bars.
 */
export function createServerRackTexture(maxAnisotropy = 4) {
    const w = 512;
    const h = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const emCanvas = document.createElement("canvas");
    emCanvas.width = w;
    emCanvas.height = h;
    const emCtx = emCanvas.getContext("2d");
    // Dark metallic rack frame
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);
    emCtx.fillStyle = "#000000";
    emCtx.fillRect(0, 0, w, h);
    // Outer vertical rails with mounting holes
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 28, h);
    ctx.fillRect(w - 28, 0, 28, h);
    // 16 Server Blade U-Slots
    const slotCount = 16;
    const slotH = (h - 64) / slotCount;
    for (let i = 0; i < slotCount; i++) {
        const y = 32 + i * slotH;
        // Blade anodized aluminum bezel
        ctx.fillStyle = "#111827";
        ctx.fillRect(32, y + 3, w - 64, slotH - 6);
        // Subtle metallic highlight strip on top of each 2U blade
        ctx.fillStyle = "#334155";
        ctx.fillRect(32, y + 3, w - 64, 2);
        // Perforated vent bays
        ctx.fillStyle = "#030712";
        for (let vx = 44; vx < w - 144; vx += 12) {
            ctx.fillRect(vx, y + 9, 7, slotH - 18);
        }
        // Glowing LED status indicators (Cyan, Emerald, Sky, Amber)
        const isSwitchSlot = i % 4 === 0;
        const ledColor = isSwitchSlot
            ? "#38bdf8"
            : i % 3 === 0
                ? "#10b981"
                : i % 5 === 0
                    ? "#f59e0b"
                    : "#0ea5e9";
        ctx.fillStyle = ledColor;
        emCtx.fillStyle = ledColor;
        // Telemetry OLED bar
        ctx.fillRect(w - 128, y + 13, 54, 8);
        emCtx.fillRect(w - 128, y + 13, 54, 8);
        // Individual fiber port LEDs
        for (let p = 0; p < 5; p++) {
            ctx.fillRect(w - 66 + p * 6.5, y + 13, 4, 8);
            emCtx.fillRect(w - 66 + p * 6.5, y + 13, 4, 8);
        }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAnisotropy;
    const emissiveMap = new THREE.CanvasTexture(emCanvas);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.anisotropy = maxAnisotropy;
    return { map, emissiveMap };
}
/**
 * Generates a realistic brushed architectural metal cladding & louver texture.
 */
export function createArchitecturalCladdingTexture(maxAnisotropy = 4) {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 0, size, size);
    // Horizontal architectural panel seams & brushed streaks
    for (let y = 0; y < size; y += 32) {
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(0, y, size, 3);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, y + 3, size, 2);
    }
    for (let x = 0; x < size; x += 128) {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(x, 0, 2, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = maxAnisotropy;
    return tex;
}
/**
 * Generates a tangent-space normal map + underwater caustics map for realistic 3D water.
 */
export function createWaterNormalAndCausticsTextures(maxAnisotropy = 4) {
    const size = 512;
    const normCanvas = document.createElement("canvas");
    normCanvas.width = size;
    normCanvas.height = size;
    const nCtx = normCanvas.getContext("2d");
    const imgData = nCtx.createImageData(size, size);
    const data = imgData.data;
    // Synthesize smooth tileable multi-wave height derivatives for tangent-space normal map
    const twoPi = Math.PI * 2;
    for (let y = 0; y < size; y++) {
        const v = (y / size) * twoPi;
        for (let x = 0; x < size; x++) {
            const u = (x / size) * twoPi;
            const dx = Math.cos(u * 3 + v * 2) * 0.45 +
                Math.cos(u * 7 - v * 4) * 0.3 +
                Math.sin(u * 11 + v * 9) * 0.18;
            const dy = Math.cos(v * 4 - u * 2) * 0.45 +
                Math.cos(v * 8 + u * 5) * 0.3 +
                Math.sin(v * 12 - u * 7) * 0.18;
            const nx = Math.max(0, Math.min(255, Math.floor((dx * 0.5 + 0.5) * 255)));
            const ny = Math.max(0, Math.min(255, Math.floor((dy * 0.5 + 0.5) * 255)));
            const idx = (y * size + x) * 4;
            data[idx] = nx;
            data[idx + 1] = ny;
            data[idx + 2] = 245;
            data[idx + 3] = 255;
        }
    }
    nCtx.putImageData(imgData, 0, 0);
    const normalMap = new THREE.CanvasTexture(normCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(4, 5);
    normalMap.anisotropy = maxAnisotropy;
    // Shimmering underwater caustics network texture
    const causCanvas = document.createElement("canvas");
    causCanvas.width = size;
    causCanvas.height = size;
    const cCtx = causCanvas.getContext("2d");
    cCtx.fillStyle = "#031829";
    cCtx.fillRect(0, 0, size, size);
    for (let i = 0; i < 160; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const r = 20 + Math.random() * 52;
        const grad = cCtx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
        grad.addColorStop(0, "rgba(56, 189, 248, 0)");
        grad.addColorStop(0.72, "rgba(125, 211, 252, 0.28)");
        grad.addColorStop(0.88, "rgba(224, 242, 254, 0.45)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        cCtx.fillStyle = grad;
        cCtx.beginPath();
        cCtx.arc(cx, cy, r, 0, Math.PI * 2);
        cCtx.fill();
    }
    const causticsMap = new THREE.CanvasTexture(causCanvas);
    causticsMap.colorSpace = THREE.SRGBColorSpace;
    causticsMap.wrapS = THREE.RepeatWrapping;
    causticsMap.wrapT = THREE.RepeatWrapping;
    causticsMap.repeat.set(2, 3);
    return { normalMap, causticsMap };
}
/**
 * Generates an ultra-soft volumetric smoke/steam cloud sprite texture (zero hard polygon edges).
 */
export function createSoftSmokePlumeTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    // Multi-lobe radial cloud puff for realistic billowing steam/smoke
    const lobes = [
        [128, 128, 110, 0.55],
        [96, 116, 76, 0.38],
        [160, 118, 74, 0.38],
        [118, 92, 72, 0.35],
        [138, 156, 70, 0.32],
    ];
    lobes.forEach(([cx, cy, r, alpha]) => {
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.45, `rgba(241, 245, 249, ${alpha * 0.65})`);
        grad.addColorStop(0.78, `rgba(203, 213, 225, ${alpha * 0.22})`);
        grad.addColorStop(1, "rgba(203, 213, 225, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
/**
 * Generates a realistic blazing Solar Corona & Lensflare halo texture with sunbeams.
 */
export function createSolarCoronaTexture() {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const center = size / 2;
    ctx.clearRect(0, 0, size, size);
    // Outer golden-warm atmospheric halo
    const outerGrad = ctx.createRadialGradient(center, center, 8, center, center, center);
    outerGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    outerGrad.addColorStop(0.14, "rgba(254, 249, 195, 0.95)");
    outerGrad.addColorStop(0.32, "rgba(253, 224, 71, 0.55)");
    outerGrad.addColorStop(0.62, "rgba(251, 146, 60, 0.18)");
    outerGrad.addColorStop(1, "rgba(251, 146, 60, 0)");
    ctx.fillStyle = outerGrad;
    ctx.fillRect(0, 0, size, size);
    // Subtle radial star diffraction rays
    ctx.save();
    ctx.translate(center, center);
    for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        const rayGrad = ctx.createLinearGradient(0, -center, 0, center);
        rayGrad.addColorStop(0, "rgba(255, 251, 235, 0)");
        rayGrad.addColorStop(0.45, "rgba(254, 240, 138, 0.22)");
        rayGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.55)");
        rayGrad.addColorStop(0.55, "rgba(254, 240, 138, 0.22)");
        rayGrad.addColorStop(1, "rgba(255, 251, 235, 0)");
        ctx.fillStyle = rayGrad;
        ctx.fillRect(-3, -center * 0.92, 6, center * 1.84);
    }
    ctx.restore();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
/**
 * Generates a monocrystalline rooftop solar array texture for the Data Center roof.
 */
export function createSolarPanelTexture(maxAnisotropy = 4) {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#082f49";
    ctx.fillRect(0, 0, size, size);
    // Silicon photovoltaic cell grid
    const cellStep = 64;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += cellStep) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
    }
    // Fine silver busbars
    ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
    ctx.lineWidth = 1;
    for (let i = 16; i < size; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    tex.anisotropy = maxAnisotropy;
    return tex;
}