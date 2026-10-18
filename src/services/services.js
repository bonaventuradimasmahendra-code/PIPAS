export function getPower (scale, time){
    let powerScale = 0
    if (scale === 0){
        powerScale = 10*(time*24)*1000;
    } else if (scale === 1){
        powerScale = 50*(time*24)*1000;
    } else if (scale === 2){
        powerScale = 150*(time*24)*1000;
    };
    return powerScale
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

export function getPolluted (coolerSys, hydro, time){
    let coolerPolluted = 0;
    let locationPolluted = 0;
    let duration = 0;
    const msg = {
        "msg": "",
        "cooler_risk": "",
        "location_risk" : ""
    };

    if (!coolerSys.includes("None")){
        if (coolerSys.toUpperCase().includes("IPAL")){
            if (coolerSys.toLowerCase().includes("tertutup")){
                coolerPolluted = 10;
                msg["cooler_risk"] = "Polutan yang masuk masih bisa diolah kembali oleh alam";
            } else {
                coolerPolluted = 35;
                msg["cooler_risk"] = "Kenaikan suhu dan penurunan kadar oksigen secara bertahap";
            };
        } else {
            if (coolerSys.toLowerCase().includes("tertutup")){
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

export function totalCost (power, cost, time){
    const powerKwh = power * 1000;
    const duration = time * 24;
    const total = (powerKwh * duration) * cost;
    return total;
};