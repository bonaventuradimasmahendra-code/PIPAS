export function getPower (scale, time, cooler, airCooler){
    let powerScale = 0;
    let powerValue = 0; // khusus udara
    let returnValue = [];

    if (scale === 0){
        powerScale = 1*(time*24)*1000;
        } else if (scale === 1){
            powerScale = 10*(time*24)*1000;
        } else if (scale === 2){
            powerScale = 150*(time*24)*1000;
        };

    if (String(cooler).toLowerCase() === "udara"){
        let rawWatt = 0;

        if (String(airCooler).toLowerCase().includes("presisi kecil")) {
            rawWatt = 220 * 10 * 0.8;
        } else if (String(airCooler).toLowerCase().includes("presisi besar")) {
            rawWatt = 415 * 25 * 0.85;
        } else {
            rawWatt = 220 * 6 * 0.8;
        };
        powerValue = (rawWatt / 1000) * (time * 24) * 1000;

        const value = {
            "power-scale" : powerScale,
            "AC-power" : powerValue
        };
        returnValue.push(value)
    } else {
        const value = {
            "power-scale" : powerScale,
            "AC-power" : 0
        };
        returnValue.push(value)
    };
    return returnValue;
};

export function getEmmision (electricity){
    let emmisionPrecentage = 0;
    if (electricity.toLowerCase() === 'geothermal') {
        emmisionPrecentage = 5;
    } else {
        emmisionPrecentage = 100;
    };
    return emmisionPrecentage
};

export function getPolluted (cooler, waterCoolerSys, hydro, time){
    let coolerPolluted = 0;
    let locationPolluted = 0;
    let duration = 0;

    const msg = {
        "msg": "",
        "cooler_risk": "",
        "location_risk" : ""
    };

    if (String(cooler).toLowerCase() === "air"){
        if (!waterCoolerSys.includes("None")){
            if (waterCoolerSys.toUpperCase().includes("IPAL")){
                if (waterCoolerSys.toLowerCase().includes("tertutup")){
                    coolerPolluted = 10;
                    msg["cooler_risk"] = "Polutan yang masuk masih bisa diolah kembali oleh alam";
                } else {
                    coolerPolluted = 35;
                    msg["cooler_risk"] = "Kenaikan suhu dan penurunan kadar oksigen secara bertahap";
                };
            } else {
                if (waterCoolerSys.toLowerCase().includes("tertutup")){
                    coolerPolluted = 60;
                    msg["cooler_risk"] = "Air terkontaminasi material bersifat korosif dan berbahaya";
                } else {
                    coolerPolluted = 85;
                    msg["cooler_risk"] = "Air menjadi sangat beracun";
                };
            };
        } else {
            coolerPolluted = 100;
            msg["cooler_risk"] = "Air menjadi limbah B3";
        };

        if (hydro.toLowerCase().includes("internal")){
            locationPolluted = 10;
            msg["location_risk"] = "Tidak ada dampak lingkungan yang disebabkan.";
        } else if (hydro.toLowerCase().includes("dalam")){
            locationPolluted = 30;
            msg["location_risk"] = "Gangguan ekosistem berskala kecil yang belum mempengaruhi hidup orang banyak.";
        } else if (hydro.toLowerCase().includes("waduk")){
            locationPolluted = 50;
            msg["location_risk"] = "Memunculkan risiko sedimentasi dan kualitas air menurun.";
        } else if (hydro.toLowerCase().includes("pantai")){
            locationPolluted = 70;
            msg["location_risk"] = "Dapat merusak biota laut tepi pantai dan mengganggu mata pencaharian masyarakat.";
        } else if (hydro.toLowerCase().includes("sungai")){
            locationPolluted = 90;
            msg["location_risk"] = "Mengontaminasi sumber air warga dan kerusakan lingkungan permanen.";
        };
    } else {
        msg["cooler_risk"] = "Menggunakan pendingin udara (AC), tidak menghasilkan limbah cair langsung.";
        msg["location_risk"] = "Risiko utama adalah pembuangan panas (heat rejection) ke udara.";
    };

    if (time >= 365){
        duration = 60;
    } else if (time >= 30){
        duration = 10;
    } else {
        duration = 100;
    };

    return { 
        score: (coolerPolluted + locationPolluted + duration)/3,
        msg:msg
    }
};

export function totalCost (power, cost){
    const total = power * cost;
    return total;
};