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
    if (!coolerSys.includes("None")){
        if (coolerSys.toUpperCase().includes("IPAL")){
            if (coolerSys.toLowerCase().includes("tertutup")){
                coolerPolluted = 10;
            } else {
                coolerPolluted = 35;
            };
        } else {
            if (coolerSys.toLowerCase().includes("tertutup")){
                coolerPolluted = 60;
            } else {
                coolerPolluted = 85;
            };
        };
    } else {
        coolerPolluted = 100;
    };

    if (hydro.toLowerCase().includes("internal")){
        locationPolluted = 10;
    } else if (hydro.toLowerCase().includes("dalam")){
        locationPolluted = 30;
    } else if (hydro.toLowerCase().includes("waduk")){
        locationPolluted = 50;
    } else if (hydro.toLowerCase().includes("pantai")){
        locationPolluted = 70;
    } else if (hydro.toLowerCase().includes("sungai")){
        locationPolluted = 90;
    };

    if (time >= 30){
        duration = 10;
    } else if (time >= 365){
        duration = 60;
    } else {
        duration = 100;
    };

    return (coolerPolluted + locationPolluted + duration)/3
};
