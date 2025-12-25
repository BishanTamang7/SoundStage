import React from 'react';
import { Music, Search, CreditCard, QrCode, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-semibold text-gray-900">SoundStage</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
              Sign In
            </button>
            <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-2">
          Experience Music
        </h1>
        <h2 className="text-5xl font-bold text-red-500 mb-6">
          Like Never Before
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-10">
          Discover concerts, book tickets instantly with eSewa & Khalti, and get
          your QR e-ticket in seconds. The future of live music is here.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center gap-2">
            <Music className="w-5 h-5" />
            Find Concerts
          </button>
          <button className="px-8 py-3 bg-white text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-50 font-medium">
            Host an Event
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-bold text-center mb-3">
          How It <span className="text-red-500">Works</span>
        </h2>
        <p className="text-center text-gray-600 mb-16">
          From discovery to entry, your concert experience is seamless.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Discover Events
            </h3>
            <p className="text-gray-600">
              Browse upcoming concerts by city, artist, or genre. Find the perfect show for you.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">
              <CreditCard className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Book & Pay
            </h3>
            <p className="text-gray-600">
              Select your seats, choose ticket type, and pay securely with eSewa or Khalti.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">
              <QrCode className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Get Your E-Ticket
            </h3>
            <p className="text-gray-600">
              Receive your unique QR code ticket instantly via email and in-app.
            </p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Enjoy the Show
            </h3>
            <p className="text-gray-600">
              Show your QR code at the venue for quick, contactless entry.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-semibold text-gray-900">SoundStage</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a>
          </div>
          <div className="text-gray-600">
            © 2025 SoundStage
          </div>
        </div>
      </footer>
    </div>
  );
}