import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const Authenticate = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // Redirect to profile after login
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div>
      {isAuthenticated ? (
        <button
          style={{
            background: "none",
            border: "none",
            color: "black",
            fontSize: "1.2rem",
            fontFamily: "Red Hat Display",
            fontWeight: "bold",
          }}
          onClick={() => navigate("/profile")}
        >
          Go to Profile
        </button>
      ) : (
        <button
          style={{
            backgroundColor: "#FDFDFD" /*egg white*/,
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
          onClick={() => loginWithRedirect()}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Authenticate;
