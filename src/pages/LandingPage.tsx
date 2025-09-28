import React from "react";

const LandingPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">LIFT Alumni Hub</h1>
          <nav className="space-x-6">
            <a
              href="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Login
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-white">Together We Give Back</h2>
          <p className="mt-4 text-lg text-indigo-100">
            A transparent platform for LIFT alumni to contribute, track expenses,
            and support new students — all in one place.
          </p>
          <div className="mt-6">
            <a
              href="#cta"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50"
            >
              Join Now
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-800">Why This Platform?</h3>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            LIFT Alumni Network makes it simple to contribute financially, track
            budgets, and ensure every rupee is used for nurturing future talent.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500">
          © {new Date().getFullYear()} LIFT Alumni Network. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
