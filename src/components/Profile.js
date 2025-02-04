import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import logo from '../assets/LIFT_Logo.png';
import '../App.css';

const Profile = () => {
    const { user, isAuthenticated, isLoading, logout } = useAuth0();

    if (isLoading) {
        return <div>Loading ...</div>;
    }

    return (
        isAuthenticated && (
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
                        <button onClick={() => logout({ logoutParams: { returnTo: 'http://localhost:3000/' } })}>
                            Logout
                        </button>
                    </nav>
                </header>

                <>
                    <div className="content">
                        <img src={user.picture}></img>
                        <h1>Welcome {user.name} </h1>
                        <p>You logged in using {user.email}</p>
                    </div>
                </>

            </div>
        )
    );
};

export default Profile;