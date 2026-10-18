import { useState } from "react";
import About from "./pages/aboutus";
import Conclusion from "./pages/conclusion";
import Cooler from "./pages/cooler";
import Navbar from "./components/navbar";
import Geothermal from "./pages/geothermal";
import ProblemsAndSolutions from "./pages/problemandsolution";
import Simulation from "./pages/simulation";
import Home from "./pages/home";
import Footer from "./components/footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App(){
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route index element={Home}></Route>
                <Route path="/about-us" element={About}></Route>
                <Route path="/hydro" element={Cooler}></Route>
                <Route path="/problems-and-solution" element={ProblemsAndSolutions}></Route>
                <Route path="/geothermal" element={Geothermal}></Route>
                <Route path="/conclusion" element={Conclusion}></Route>
                <Route path="/simulation" element={Simulation}></Route>
            </Routes>
            <Footer />
        </BrowserRouter>
    )
}