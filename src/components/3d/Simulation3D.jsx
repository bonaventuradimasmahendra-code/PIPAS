import { useEffect, useMemo, useState } from "react";
import { getPower, getPolluted } from "../../services/services";
import DataCenter3DScene from "./DataCenter3DScene";
import "./simulation-3d.css";

/**
 * Pengganti SimulationIllustration (2D). Menerima state form milik simulation.jsx
 * dan meneruskannya ke scene 3D (DataCenter3DScene) dari elementcraft.zip.
 *
 * Seluruh nilai (skor polusi, status, PUE, delta suhu, kesehatan ekosistem) dihitung
 * ulang setiap input berubah, memakai service yang sama dengan handleSubmit,
 * sehingga dunia 3D berubah secara real-time tanpa menunggu tombol "Periksa Hasil".
 */
export default function Simulation3D({
  scale = 0,
  time = 1,
  electricity = "konvesional",
  cooler = "Udara",
  airCooler = "AC Konvesional",
  hydro = "Tangki Penyimpanan Internal",
  waterCoolerSys = "Tertutup-IPAL",
}) {
  // ---- Kontrol waktu simulasi (sama seperti di elements.tsx pada zip) ----
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [progress, setProgress] = useState(35);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const step = 0.5 * simSpeed;
        return prev + step > 100 ? 5 : Number((prev + step).toFixed(1));
      });
    }, 150);
    return () => clearInterval(timer);
  }, [isPlaying, simSpeed]);

  // Skala kecil hanya mendukung AC; nilai cooler lama ("AC") dianggap udara.
  const effectiveCooler = scale > 0 && cooler === "Air" ? "Air" : "Udara";
  const effectiveAirCooler = airCooler || "AC Konvesional";

  // ---- Nilai live dari service (tahan terhadap field yang belum ada) ----
  const live = useMemo(() => {
    try {
      const p = getPower(scale, time, effectiveCooler, effectiveAirCooler)?.[0] ?? {};
      const pol = getPolluted(effectiveCooler, waterCoolerSys, hydro, time) ?? {};
      const score = Number(pol.score) || 0;
      const server = Number(p["power-scale"]) || 0;
      const ac = Number(p["AC-power"]) || 0;
      return {
        score,
        pue: p.pue ?? (server > 0 ? Number(((server + ac) / server).toFixed(2)) : 1),
        thermalDelta: pol.msg?.thermal_delta ?? "-",
      };
    } catch {
      return { score: 0, pue: 1, thermalDelta: "-" };
    }
  }, [scale, time, effectiveCooler, effectiveAirCooler, waterCoolerSys, hydro]);

  const status = live.score <= 30 ? "Aman" : live.score <= 70 ? "Sedang" : "Tinggi";

  const ratio = Math.max(0.05, progress / 100);
  const elapsedLabel =
    time === 1
      ? `Jam ke-${Math.max(1, Math.ceil(24 * ratio))} dari 24 Jam`
      : time === 30
      ? `Hari ke-${Math.max(1, Math.ceil(30 * ratio))} dari 30 Hari`
      : `Hari ke-${Math.max(1, Math.ceil(365 * ratio))} dari 365 Hari`;

  return (
    <div className="sim-3d">
      <DataCenter3DScene
        scale={scale}
        electricity={electricity}
        cooler={effectiveCooler}
        airCooler={effectiveAirCooler}
        hydro={hydro}
        waterCoolerSys={waterCoolerSys}
        pollutedStatus={status}
        pollutionScore={live.score}
        pue={String(live.pue)}
        thermalDelta={live.thermalDelta}
        isPlaying={isPlaying}
        simSpeed={simSpeed}
        progress={progress}
        elapsedLabel={elapsedLabel}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onCycleSpeed={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
        onResetProgress={() => setProgress(0)}
        onChangeProgress={(val) => setProgress(val)}
      />
    </div>
  );
}