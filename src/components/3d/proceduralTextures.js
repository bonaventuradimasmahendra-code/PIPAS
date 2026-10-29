import * as THREE from "three";
/**
 * Generates a high-resolution procedural concrete/asphalt industrial ground texture
 * with subtle aggregate noise, expansion grid seams, and safety zone markings.
 */
export function createIndustrialGroundTexture(maxAnisotropy = 4) {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Base dark slate asphalt/concrete
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, size, size);
    // Fine aggregate grain
    for (let i = 0; i < 18000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const v = 24 + Math.floor(Math.random() * 26);
        ctx.fillStyle = `rgb(${v}, ${v + 8}, ${v + 18})`;
        ctx.fillRect(x, y, 2, 2);
    }
    // Expansion joint grid lines
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    const step = 128;
    for (let i = 0; i <= size; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
    }
    // Subtle service road lane markings
    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 18]);
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
    // Grayscale bump map
    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext("2d");
    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 12000; i++) {
        const g = 100 + Math.floor(Math.random() * 55);
        bCtx.fillStyle = `rgb(${g},${g},${g})`;
        bCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(6, 4);
    bumpMap.anisotropy = maxAnisotropy;
    return { map, bumpMap };
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
    // Outer vertical rails
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 28, h);
    ctx.fillRect(w - 28, 0, 28, h);
    // 16 Server Blade U-Slots
    const slotCount = 16;
    const slotH = (h - 64) / slotCount;
    for (let i = 0; i < slotCount; i++) {
        const y = 32 + i * slotH;
        // Blade bezel
        ctx.fillStyle = "#111827";
        ctx.fillRect(34, y + 4, w - 68, slotH - 8);
        // Perforated vent bays
        ctx.fillStyle = "#030712";
        for (let vx = 48; vx < w - 140; vx += 14) {
            ctx.fillRect(vx, y + 10, 8, slotH - 20);
        }
        // Glowing LED status indicators (Cyan, Emerald, Blue)
        const isSwitchSlot = i % 4 === 0;
        const ledColor = isSwitchSlot ? "#38bdf8" : i % 3 === 0 ? "#10b981" : "#0ea5e9";
        ctx.fillStyle = ledColor;
        emCtx.fillStyle = ledColor;
        // Status bar & blinking ports
        ctx.fillRect(w - 125, y + 14, 52, 7);
        emCtx.fillRect(w - 125, y + 14, 52, 7);
        // Individual port LEDs
        for (let p = 0; p < 4; p++) {
            ctx.fillRect(w - 64 + p * 7, y + 14, 4, 7);
            emCtx.fillRect(w - 64 + p * 7, y + 14, 4, 7);
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
        ctx.fillStyle = "#f1f5f9";
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
 * Generates a tileable water ripple bump/roughness texture for realistic 3D water.
 */
export function createWaterRippleTexture() {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 220; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const rx = 18 + Math.random() * 42;
        const ry = 6 + Math.random() * 14;
        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
        grad.addColorStop(0.5, "rgba(160, 160, 160, 0.15)");
        grad.addColorStop(1, "rgba(128, 128, 128, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 4);
    return tex;
}
