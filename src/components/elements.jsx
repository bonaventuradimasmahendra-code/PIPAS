import React from 'react';

export default function Elements({ scale, electricity, cooler, pollutedStatus }) {
    const scaleClass = scale === 2 ? 'scale-large' : scale === 1 ? 'scale-medium' : 'scale-small';
    const statusClass = pollutedStatus === 'Aman' ? 'status-safe' : pollutedStatus === 'Sedang' ? 'status-warning' : 'status-danger';

    return (
        <div className={`simulation-scene-card ${statusClass}`}>
            <div className="scene-header">
                <h3>Visualisasi Arsitektur Data Center</h3>
                <div className="scene-badges">
                    <span className={`badge ${statusClass}`}>Status: {pollutedStatus}</span>
                    <span className="badge info">Skala: {scale === 2 ? 'Besar (150 MW)' : scale === 1 ? 'Sedang (10 MW)' : 'Kecil (1 MW)'}</span>
                </div>
            </div>

            <div className={`scene-canvas-box ${scaleClass}`}>
                {/* Sisi Kiwa: Pembangkit Listrik (Batubara vs Geothermal) */}
                <div className={`plant-unit ${electricity}`}>
                    <div className="plant-roof-area">
                        {electricity === 'geothermal' ? (
                            <div className="geo-steam">♨️ Geothermal Clean</div>
                        ) : (
                            <div className="coal-smoke">
                                <div className="smoke-circle s1"></div>
                                <div className="smoke-circle s2"></div>
                            </div>
                        )}
                    </div>
                    <div className="plant-info-text">
                        <span>{electricity === 'geothermal' ? '⚡ Pembangkit Geo' : '🏭 Pembangkit Batubara'}</span>
                    </div>
                </div>

                {/* Bagian Tengah: Ruang Server & Rak Server Dinamis */}
                <div className={`server-room-grid ${scaleClass}`}>
                    <div className="rack-column">
                        <div className="server-box"><span></span><span></span></div>
                        <div className="server-box"><span></span><span></span></div>
                        {scale > 0 && <div className="server-box"><span></span><span></span></div>}
                    </div>
                    <div className="corridor-path">
                        <span className="server-status-light blinking">●</span>
                        <p className="room-label">Server Room</p>
                    </div>
                    <div className="rack-column">
                        <div className="server-box"><span></span><span></span></div>
                        <div className="server-box"><span></span><span></span></div>
                        {scale > 0 && <div className="server-box"><span></span><span></span></div>}
                    </div>
                </div>

                {/* Sisi Tengen: Sistem Pendingin (Hydro / Air vs AC) */}
                <div className="cooling-unit-box">
                    {cooler === 'Air' ? (
                        <div className="cooling-badge-hydro">
                            <span className="icon">💧</span>
                            <div>
                                <strong>Liquid Cooling</strong>
                                <small>Sistem Hidro / Air</small>
                            </div>
                        </div>
                    ) : (
                        <div className="cooling-badge-ac">
                            <div className="ac-unit-header">❄️ Pendingin AC</div>
                            <div className="air-flow-waves">
                                <i></i><i></i><i></i>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}