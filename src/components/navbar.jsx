import { Link } from "react-router-dom"
import { Cpu, Droplets, FileText, Flame, Home, Lightbulb, Users } from "lucide-react"

export default function Navbar(){
    return (
        <nav className="navbar-container">
            {/* Left -> Disusun Vertikal (Menurun) */}
            <div className="navbar-left"> 
                <h1>Kelompok 5</h1>
                <Link to={'/about-us'} className="navbar-aboutus"><Users />About Us</Link>
            </div>
            {/* Right -> Disusun Horizontal (Mendatar) */}
            <div className="navbar-right">
                <Link to={'/'} className="navbar-home"><Home />Home</Link>
                <Link to={'/problems-and-solution'} className="navbar-problemsolution"><Lightbulb />Problems & Solutions</Link>
                <Link to={'/geothermal'} className="navbar-geothermal"><Flame />Geothermal Energy</Link>
                <Link to={'/hydro'} className="navbar-hydro"><Droplets />Hydro Energy</Link>
                <Link to={'/simulation'} className="navbar-simulation"><Cpu />Simulation</Link>
                <Link to={'/conclusion'} className="navbar-conclusion"><FileText />Conclusion</Link>
            </div>
        </nav>
    )
}