import { useState } from "react";
import { getPower, getPolluted, getEmmision, totalCost} from "../services/services";
import CurrencyInput from 'react-currency-input-field';
import { useMemo } from "react";
import Simulation3D from "../components/3d/Simulation3D";

export default function Simulation(){
    const [scale, setScale] = useState(0); // 0 untuk kecil, 1 untuk sedang, 2 untuk besar
    const [time, setTime] = useState(1); // 30 untuk sebulan, 365 untuk setahun, 1 untuk sehari
    const [electricity, setElectricity] = useState('konvesional');
    const [cooler, setCooler] = useState("AC");
    const [hydro, setHydro] = useState('Tangki Penyimpanan Internal');
    const [waterCoolerSys, setWaterCoolerSys] = useState('Tertutup-IPAL');
    const [pollutedStatus, setPolutedStatus] = useState('Aman');
    const [emmision, setEmmision] = useState(0);
    const [averagePolluted, setAveragePolluted] = useState(0);
    const [cost, setCost] = useState(100000);
    const [power, setPower] = useState(0);
    const [pollutedMsg, setPollutedMsg] = useState('');
    const [showMsg, setShowMsg] = useState(false);
    const [pollutedData, setPollutedData] = useState({});
    const [total, setTotal] = useState(0);
    const [airCooler, setAirCooler] = useState("");
    const [acPower, setAcPower] = useState(0);

    const preview = useMemo(() => {
        try {
            const p = getPower(scale, time, cooler, airCooler);
            const pol = getPolluted(cooler, waterCoolerSys, hydro, time);
            const numeric = Number(String(cost).replace(/[^0-9]/g, '')) || 0;
            return {
                power: p[0]["power-scale"],
                acPower: p[0]["AC-power"],
                score: pol.score,
                emission: getEmmision(electricity),
                total: totalCost(p[0]["AC-power"] + p[0]["power-scale"], numeric),
            };
        } catch {
            return null;
        }
    }, [scale, time, electricity, cooler, airCooler, hydro, waterCoolerSys, cost]);

    const handleSubmit = (e)=>{
        e.preventDefault()
        const numericCost = Number(String(cost).replace(/[^0-9]/g, '')) || 0;

        const calculatedPower = getPower(scale, time, cooler, airCooler);
        const calculatedPollution = getPolluted(cooler, waterCoolerSys, hydro, time);
        const calculatedEmmision = getEmmision(electricity);
        const calculatedCost = totalCost((calculatedPower[0]["AC-power"] + calculatedPower[0]["power-scale"]), numericCost);

        setPower(calculatedPower[0]["power-scale"]);
        setAcPower(calculatedPower[0]["AC-power"]);

        setAveragePolluted(calculatedPollution.score);
        setEmmision(calculatedEmmision);

        setPollutedMsg(calculatedPollution.msg.msg);
        setPollutedData(calculatedPollution.msg);
        setTotal(calculatedCost);

        if (calculatedPollution.score <= 30){
            setPolutedStatus('Aman');
        } else if (calculatedPollution.score <= 70) {
            setPolutedStatus('Sedang');
        } else if (calculatedPollution.score > 70) {
            setPolutedStatus("Tinggi");
        };

        setShowMsg(true);
        setTimeout(()=>{
            setShowMsg(false)
        }, 10000);
    };
    
    return (
        <div className='simulation-container'>
            <title>Simulation</title>
            <h1>Simulation</h1>
            <div className="simulation-layout">
                <section className='input-section'>
                    <h4>Skala Data Center</h4>
                    <select onChange={(e)=>setScale(Number(e.target.value))}>
                        <option value={2}>Besar - AI (-+ 150MW)</option>
                        <option value={1}>Sedang - Sekolah (-+ 10MW)</option>
                        <option value={0}>Kecil - Rumahan (-+ 1MW)</option>
                    </select>
                    <hr></hr>
                    <h4>Sumber Energi Listrik</h4>
                    <select onChange={(e)=>setElectricity(e.target.value)} required>
                        <option value={"konvesional"}>Konvesional (Batubara)</option>
                        <option value={"geothermal"}>Energi Geothermal</option>
                    </select>
                    <hr></hr>
                    <h4>Durasi Hidup Data Center</h4>
                    <select onChange={(e)=>setTime(Number(e.target.value))}>
                        <option value={1}>Sehari</option>
                        <option value={30}>Sebulan (30 Hari)</option>
                        <option value={365}>Setahun (365 Hari)</option>
                    </select>
                    <hr></hr>

                    {scale === 2 && (
                        <div className="cooler-big-data">
                            <h4>Sistem Pendingin</h4>
                            <select onChange={(e)=>setCooler(e.target.value)} required>
                                <option value={"Air"}>Air</option>
                                <option value={"Udara"}>AC</option>
                            </select>
                            {cooler !== "Air" && (
                                <div className="aircooler">
                                    <h4>Jenis AC</h4>
                                    <select onChange={(e)=>setAirCooler(e.target.value)} required>
                                        <option value={"AC Konvesional"}>AC Konvesional</option>
                                        <option value={"AC Presisi Kecil"}>AC Presisi - Khusus - 220V</option>
                                        <option value={"AC Presisi Besar"}>AC Presisi - Khusus - 415V</option>
                                    </select>
                                </div>
                            )}
                            {cooler === "Air" && (
                                <div className="hydro-container">
                                    <h4>Sumber Hidro atau Lokasi Server</h4>
                                    <select onChange={(e)=>setHydro(e.target.value)} required>
                                        <option value={"Tangki Penyimpanan Internal"}>Tangki Penyimpanan Internal</option>
                                        <option value={"Tepi Pantai"}>Tepi Pantai</option>
                                        <option value={"Waduk"}>Waduk/Bendungan</option>
                                        <option value={"Laut Dalam"}>Air Laut Dalam</option>
                                        <option value={"Sungai"}>Sungai/Danau</option>
                                    </select>
                                    <hr></hr>
                                    <h4>Pengolahan Limbah Air</h4>
                                    <select onChange={(e)=> setWaterCoolerSys(e.target.value)} required>
                                        <option value={"Tertutup-IPAL"}>Menggunakan Metode Tertutup dan Instalasi Pengolahan Limbah</option>
                                        <option value={"Terbuka-IPAL"}>Menggunakan Metode Terbuka dan Instalasi Pengolahan Limbah</option>
                                        <option value={"Tertutup"}>Menggunakan Metode Tertutup tanpa Instalasi Pengolahan Limbah</option>
                                        <option value={"Terbuka"}>Menggunakan Metode Terbuka tanpa Instalasi Pengolahan Limbah</option>
                                        <option value={"None"}>Tanpa Menggunakan Metode Tertutup dan Instalasi Pengolahan Limbah</option>
                                    </select>
                                </div>
                            )}
                            <hr></hr>
                        </div>
                    )}

                    {scale === 1 && (
                        <div className="cooler-mid-data">
                            <h4>Sistem Pendingin</h4>
                            <select onChange={(e)=>setCooler(e.target.value)} required>
                                <option value={"Air"}>Air</option>
                                <option value={"Udara"}>AC</option>
                            </select>
                            {cooler !== "Air" && (
                                <div className="aircooler">
                                    <h4>Jenis AC</h4>
                                    <select onChange={(e)=>setAirCooler(e.target.value)} required>
                                        <option value={"AC Konvesional"}>AC Konvesional</option>
                                        <option value={"AC Presisi Kecil"}>AC Presisi - Khusus - 220V</option>
                                        <option value={"AC Presisi Besar"}>AC Presisi - Khusus - 415V</option>
                                    </select>
                                </div>
                            )}
                            {cooler === "Air" && (
                                <div className="hydro-container">
                                    <h4>Sumber Hidro atau Lokasi Server</h4>
                                    <select onChange={(e)=>setHydro(e.target.value)} required>
                                        <option value={"Tangki Penyimpanan Internal"}>Tangki Penyimpanan Internal</option>
                                        <option value={"Tepi Pantai"}>Tepi Pantai</option>
                                        <option value={"Waduk"}>Waduk/Bendungan</option>
                                        <option value={"Laut Dalam"}>Air Laut Dalam</option>
                                        <option value={"Sungai"}>Sungai/Danau</option>
                                    </select>
                                    <hr></hr>
                                    <h4>Pengolahan Limbah Air</h4>
                                    <select onChange={(e)=> setWaterCoolerSys(e.target.value)} required>
                                        <option value={"Tertutup-IPAL"}>Menggunakan Metode Tertutup dan Instalasi Pengolahan Limbah</option>
                                        <option value={"Terbuka-IPAL"}>Menggunakan Metode Terbuka dan Instalasi Pengolahan Limbah</option>
                                        <option value={"Tertutup"}>Menggunakan Metode Tertutup tanpa Instalasi Pengolahan Limbah</option>
                                        <option value={"Terbuka"}>Menggunakan Metode Terbuka tanpa Instalasi Pengolahan Limbah</option>
                                        <option value={"None"}>Tanpa Menggunakan Metode Tertutup dan Instalasi Pengolahan Limbah</option>
                                    </select>
                                </div>
                            )}
                            <hr></hr>
                        </div>
                    )}
                    {scale === 0 && (
                        <div className="cooler-low-data">
                            <h4>Sistem Pendingin</h4>
                            <select onChange={(e)=>setCooler(e.target.value)} required>
                                <option value={"Udara"}>AC</option>
                            </select>
                            {cooler !== "Air" && (
                                <div className="aircooler">
                                    <h4>Jenis AC</h4>
                                    <select onChange={(e)=>setAirCooler(e.target.value)} required>
                                        <option value={"AC Konvesional"}>AC Konvesional</option>
                                        <option value={"AC Presisi Kecil"}>AC Presisi - Khusus - 220V</option>
                                        <option value={"AC Presisi Besar"}>AC Presisi - Khusus - 415V</option>
                                    </select>
                                </div>
                            )}
                            <hr></hr>
                        </div>
                    )}
                    <h4>Biaya per Hari</h4>
                    <CurrencyInput placeholder="Masukkan nominal biaya" defaultValue={100000} decimalsLimit={2} groupSeparator="." decimalSeparator="," onValueChange={(value)=>setCost(value)} required></CurrencyInput>
                    <button type="button" onClick={handleSubmit}>Periksa Hasil</button>
                </section>

                <Simulation3D
                    scale={scale}
                    time={time}
                    electricity={electricity}
                    cooler={cooler}
                    airCooler={airCooler}
                    hydro={hydro}
                    waterCoolerSys={waterCoolerSys}
                />
            </div>
            
            {showMsg && (
                <div className="popup-container">
                    <div className="popup-background">
                        <h1>TINGKAT POLUSI : {pollutedStatus}</h1>
                        <h3>{pollutedMsg}</h3>
                        <p>DAYA SERVER : {power} kWh</p>
                        {acPower !== 0 && (
                            <p>DAYA AC : {acPower} kWh</p>
                        )}
                        <p>EMISI : {emmision}</p>
                        <p>RATA-RATA POLUSI : {averagePolluted.toFixed(2)}%</p>
                        <p>TOTAL BIAYA : Rp {total.toLocaleString('id-ID')}</p>
                        <p>{pollutedData.location_risk}</p>
                        <p>{pollutedData.cooler_risk}</p>
                    </div>
                </div>
            )}
        </div>
    )
};