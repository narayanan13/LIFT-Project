import React from "react";

const About = () => {
  const aboutStyles = {
    maxWidth: "800px",
    margin: "50px auto",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.8)",
    color: "#333",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
  };

  const headingStyles = {
    fontSize: "2rem",
    color: "#222",
  };

  const paragraphStyles = {
    fontSize: "1.2rem",
    lineHeight: "1.6",
  };

  return (
    <div style={aboutStyles}>
      <h1 style={headingStyles}>About Our Community</h1>
      <p style={paragraphStyles}>
        Welcome to our community! We believe in staying connected, supporting
        each other, and growing together. Our platform is built for people who
        value relationships and meaningful connections.
      </p>
      <p style={paragraphStyles}>
        Whether you're here to share experiences, seek advice, or just feel part
        of something bigger, you're in the right place.
      </p>
    </div>
  );
};

export default About;
