// import './App.css';
// import Login from './components/Authenticate';
// import logo from './assets/LIFT_Logo.png';

// function App() {

//   return (
//     <div className="app-container">
//       {/* Header Section */}
//       <header className="header">
//         <div className="logo-container">
//           <div className="logo-wrapper">
//             <img src={logo} alt="Logo" className="logo" />
//           </div>
//           <span className="org-name">Leading India's Future Today</span>
//         </div>
//         <nav className="nav">
//           <Login />
//         </nav>
//       </header>

//       {/* Conditional Rendering for About Page */}
    
//         <>
//           <div className="content">
//             <h1>Welcome to Our LIFT Family </h1>
//             <p>The family is where we are formed as people. Every family is a brick in the building of society.</p>
//           </div>
//         </>
    
//     </div>
//   );
// }

// export default App;


import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
