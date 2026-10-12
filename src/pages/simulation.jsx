import { useState } from "react";
import { getPower, getPolluted, getEmmision} from "../services/services";
import CurrencyInput from 'react-currency-input-field';

export default function Simulation(){
    const [scale, setScale] = useState(0); // 0 untuk kecil, 1 untuk sedang, 2 untuk besar
    const [time, setTime] = useState(1); // 30 untuk sebulan, 365 untuk setahun, 1 untuk sehari
    const [electricity, setElectricity] = useState('konvesional');
    const [hydro, setHydro] = useState('Tangki Penyimpanan Internal');
    const [coolerSys, setCoolerSys] = useState('Tertutup-IPAL');
    const [pollutedWater, setPolutedWater] = useState('Aman');
    const [emmision, setEmmision] = useState(0);
    const [averagePolluted, setAveragePolluted] = useState(0);
    const [cost, setCost] = useState(0);
    const [power, setPower] = useState(0);
    const [pollutedMsg, setPollutedMsg] = useState('');

    const handleSubmit = (e)=>{
        e.preventDefault()
        const calculatedPower = getPower(scale, time);
        const calculatedPollution = getPolluted(coolerSys, hydro, time);
        const calculatedEmmision = getEmmision(electricity);

        setPower(calculatedPower);
        setAveragePolluted(calculatedPollution);
        setEmmision(calculatedEmmision);

        if (averagePolluted <= 30){
            setPolutedWater('Aman');
        } else if (averagePolluted <= 70) {
            setPolutedWater('Sedang');
        } else if (averagePolluted > 70) {
            setPolutedWater("Tinggi");
        };
    }
    
    return (
        <div className='simulation-container'>
            <title>Simulation</title>
            <h1>Simulation</h1>
            <section className='input-section'>
                <h4>Skala Data Center</h4>
                <select onChange={(e)=>setScale(Number(e.target.value))}>
                    <option value={2}>Besar - Internasional (150MW)</option>
                    <option value={1}>Sedang - Sekolah (50MW)</option>
                    <option value={0}>Kecil - Rumahan (10MW)</option>
                </select>
                <hr></hr>
                <h4>Sumber Energi Listrik</h4>
                <select onChange={(e)=>setElectricity(e.target.value)}>
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
                <h4>Sumber Hidro atau Lokasi Server</h4>
                <select onChange={(e)=>setHydro(e.target.value)}>
                    <option value={"Tangki Penyimpanan Internal"}>Tangki Penyimpanan Internal</option>
                    <option value={"Tepi Pantai"}>Tepi Pantai</option>
                    <option value={"Waduk"}>Waduk/Bendungan</option>
                    <option value={"Laut Dalam"}>Air Laut Dalam</option>
                    <option value={"Sungai"}>Sungai/Danau</option>
                </select>
                <hr></hr>
                <h4>Pengolahan Limbah Air</h4>
                <select onChange={(e)=> setCoolerSys(e.target.value)}>
                    <option value={"Tertutup-IPAL"}>Menggunakan Metode Tertutup dan Instalasi Pengolahan Limbah</option>
                    <option value={"Terbuka-IPAL"}>Menggunakan Metode Terbuka dan Instalasi Pengolahan Limbah</option>
                    <option value={"Tertutup"}>Menggunakan Metode Tertutup tanpa Instalasi Pengolahan Limbah</option>
                    <option value={"Terbuka"}>Menggunakan Metode Terbuka tanpa Instalasi Pengolahan Limbah</option>
                    <option value={"None"}>Tanpa Menggunakan Metode Tertutup dan Instalasi Pengolahan Limbah</option>
                </select>
                <hr></hr>
                <h4>Biaya per Hari</h4>
                <CurrencyInput placeholder="Masukkan nominal biaya" defaultValue={100000} decimalsLimit={2} groupSeparator="." decimalSeparator="," onChange={(e)=>setCost(e.target.value)}></CurrencyInput>
                <button type="button" onClick={handleSubmit}>Periksa Hasil</button>
            </section>
        </div>
    )
};