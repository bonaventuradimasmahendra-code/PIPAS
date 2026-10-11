import { useState } from "react";

export default function Simulation(){
    const [scale, setScale] = useState(0); // 0 untuk kecil, 1 untuk sedang, 2 untuk besar
    const [time, setTime] = useState(1); // 30 untuk sebulan, 365 untuk setahun, 1 untuk sehari
    const [electricity, setElectricity] = useState('konvesional');
    const [hydro, setHydro] = useState('');
    const [coolerSys, setCoolerSys] = useState('');
    const [pollutedWater, setPolutedWater] = useState(false);
    const [emmision, setEmmision] = useState(0);
    const [cost, setCost] = useState(0);
    const [power, setPower] = useState(0);

    const getPower = ()=>{
        if (scale === 0){
            const powerScale = 10*(time*24)*1000;
            setPower(powerScale);
        } else if (scale === 1){
            const powerScale = 50*(time*24)*1000;
            setPower(powerScale);
        } else if (scale === 2){
            const powerScale = 150*(time*24)*1000;
            setPower(powerScale);
        };
    };

    const getEmmision = ()=>{
        if (electricity.toLowerCase() === 'geothermal') {
            const emmisionPrecentage = 5;
            setEmmision(emmisionPrecentage);
        } else {
            const emmisionPrecentage = 100;
            setEmmision(emmisionPrecentage);
        };
    };
    
    return (
        <div className='simulation-container'>
            <title>Simulation</title>
            <h1>Simulation</h1>
            <section className='input-section'>
                <h4>Skala Data Center</h4>
                <select>
                    <option value={scale} onChange={setScale(2)}>Besar - Internasional</option>
                    <option value={scale} onChange={setScale(1)}>Sedang - Sekolah</option>
                    <option value={scale} onChange={setScale(0)}>Kecil - Rumahan</option>
                </select>
                <hr></hr>
                <h4>Sumber Energi Listrik</h4>
                <select>
                    <option value={electricity} onChange={setElectricity('konvesional')}>Konvesional (Batubara)</option>
                    <option value={electricity} onChange={setElectricity('geothermal')}>Energi Geothermal</option>
                </select>
                <hr></hr>
                <h4></h4>
            </section>
        </div>
    )
}