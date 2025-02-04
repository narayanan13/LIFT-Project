import '../App.css';
import Authenticate from './Authenticate';
import logo from '../assets/LIFT_Logo.png';

function Home() {

  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="header">
        <div className="logo-container">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo" className="logo" />
          </div>
          <span className="org-name">Leading India's Future Today</span>
        </div>
        <nav className="nav">
          <Authenticate />
        </nav>
      </header>
    
        <>
          <div className="content">
            <h1>Welcome to Our LIFT Family </h1>
            <p>The family is where we are formed as people. Every family is a brick in the building of society.</p>
          </div>
        </>
    
    </div>
  );
}

export default Home;
