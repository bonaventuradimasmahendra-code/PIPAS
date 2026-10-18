import { useState } from "react";
import Simulation from "./pages/simulation";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import { BrowserRouter, Link, Routes, Route } from "react-router-dom";

export default function App(){
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route index element={Home}></Route>
                <Route path="/simulation" element={Simulation}></Route>
            </Routes>
        </BrowserRouter>
    )
}