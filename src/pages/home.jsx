import { ArrowBigRightDash } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home(){
    return (
        <div className="home-container">
            <section className="home-layer-1">
                <div className="image-layer-1-container">
                    <img src="src/assets/Home.png" alt="home.png"></img>
                </div>
                <div className="right-image-container-layer-1">
                    <h1>GEOTHERMAL DAN HIDRO SEBAGAI SOLUSI ENERGI DATA CENTER</h1>
                    <h3>By Kelompok 3</h3>
                    <h4>Scroll untuk lanjut</h4>
                </div>
            </section>
            {/* Per div/section, dibawah image (scroll dibawahnya) */}
            <section className="home-layer-2">
                <div className="image-layer-2-container">
                    <img src="src/assets/datacenter.png" alt="datacenter.png"></img>
                </div>
                <div className="right-image-container-layer-2">
                    <h2>Data Center</h2>
                    <p>Data center membutuhkan banyak energi untuk beroperasi. Mulai dari listrik hingga air. Lalu, apakah energi yang tersedia sebanding dengan kebutuhan energi?</p>
                    <Link to={'/problems-and-solution'} className="btn-next-layer-2"><ArrowBigRightDash />Selengkapnya</Link>
                </div>
            </section>

            <section className="home-layer-3">
                <div className="image-layer-3-container">
                    <img src="src/assets/geothermal.png" alt="geothermal.png"></img>
                </div>
                <div className="left-image-container-layer-3">
                    <h2>Geothermal</h2>
                    <p>Indonesia adalah negara yang kaya akan energi geothermal. hal ini disebabkan oleh karakteristik geografis Indonesia yang dikelilingi banyak gunung berapi. Lantas, apakah energi ini dapat dimanfaatkan sebagai pembangkit listrik data center?</p>
                    <Link to={'/geothermal'} className="btn-next-layer-3"><ArrowBigRightDash />Selengkapnya</Link>
                </div>
            </section>

            <section className="home-layer-4">
                <div className="image-layer-4-container">
                    <img src="src/assets/hydro.png" alt="hydro.png"></img>
                </div>
                <div className="right-image-container-layer-3">
                    <h2>Geothermal</h2>
                    <p>Data center membutuhkan air. Air digunakan sebagai pendingin data center. Namun, air yang dibutuhkan juga tidak kalah sedikit. Bagaimana polusi dan pencemarannya?</p>
                    <Link to={'/hydro'} className="btn-next-layer-4"><ArrowBigRightDash />Selengkapnya</Link>
                </div>
            </section>

            <section className="home-layer-5">
                <div className="image-layer-5-container">
                    <img src="src/assets/simulation.png" alt="simulation.png"></img>
                </div>
                <div className="left-image-container-layer-3">
                    <h2>Simulasi</h2>
                    <p>Ingin tahu bagaiamana simulasi dan perbandingannya?</p>
                    <Link to={'/simulation'} className="btn-next-layer-4"><ArrowBigRightDash />Coba simulasi</Link>
                </div>
            </section>

        </div>
    )
}