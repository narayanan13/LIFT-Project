import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import logo from "../assets/LIFT_Logo.png";
import "../App.css";

const Profile = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const url = "https://lifthome20.vercel.app/";
  // const url = "http://localhost:3000/";

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
              <img src={logo} alt="Profile" className="logo" />
            </div>
            <span className="org-name">Leading India's Future Today</span>
          </div>
          <nav className="nav">
            <button
              style={{
                backgroundColor: "#FDFDFD" /* egg white*/,
                border: "2px solid brown",
                color: "brown!important",
                padding: "5px 20px",
                textAlign: "center",

                display: "inline-block",
                fontSize: "16px",
                margin: "4px 2px",
                cursor: "pointer",
                fontfamily: "Red Hat Display",
                borderRadius: "30px",
                height: "30px",
                width: "90px",
              }}
              onClick={() =>
                logout({ logoutParams: { returnTo: url } })
              }
            >
              Logout
            </button>
          </nav>
        </header>

        <>
          <div className="content">
            <img src={user.picture} alt="profile "></img>
            <h1>Welcome {user.name} </h1>
            <p>You logged in using {user.email}</p>
          </div>
        </>
      </div>
    )
  );
};

export default Profile;
