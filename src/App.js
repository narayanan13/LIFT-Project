import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Authenticate from "./components/Authenticate";
import Profile from "./components/Profile";
import About from "./components/About";
import Home from "./components/Home";

function App() {
  return (
    <Router>
        {/* Routing */}
        <Routes>
          <Route path="*" element={<Home />} />
          <Route path="/login" element={<Authenticate />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
        </Routes>
    </Router>
  );
}

export default App;
