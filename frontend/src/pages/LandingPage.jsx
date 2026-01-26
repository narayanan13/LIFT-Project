import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      const userData = JSON.parse(user);
      if (userData.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/alumni', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div className="bg-very-light-peach min-h-screen flex flex-col">
      <div className="flex-grow">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-b from-warm-red via-bright-orange to-soft-peach bg-clip-text text-transparent">LIFT Alumni Hub</h1>
            <nav className="space-x-6">
              <a
                href="/login"
                className="bg-deep-red text-white px-4 py-2 rounded-lg hover:bg-warm-red"
              >
                Login
              </a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{backgroundColor: 'rgba(246, 175, 82, 1)'}}>
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <h2 className="text-4xl font-bold text-white animate-highlight">Together We Give Back</h2>
            <p className="mt-4 text-lg text-deep-red">
              A transparent platform for LIFT alumni to contribute, track expenses,
              and support new students — all in one place.
            </p>
            <div className="mt-6">
              <a
                href="/login"
                className="bg-soft-peach text-deep-red px-6 py-3 rounded-lg font-semibold hover:bg-very-light-peach"
              >
                Sign In
              </a>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-deep-red">Why This Platform?</h3>
            <p className="mt-4 text-soft-peach max-w-2xl mx-auto">
              LIFT Alumni Network makes it simple to contribute financially, track
              budgets, and ensure every rupee is used for nurturing future talent.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-deep-red">
          © {new Date().getFullYear()} LIFT Alumni Network. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
