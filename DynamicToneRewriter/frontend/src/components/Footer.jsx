import React from 'react';
import { Twitter, Facebook, Instagram, Linkedin, Mail, Phone, MapPin, ArrowUpCircle } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="w-full bg-blue-900 text-blue-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Company Name. All rights reserved.
        </p>
        <div className="flex space-x-4">
          <Twitter className="w-5 h-5 hover:text-blue-400 cursor-pointer transition-colors" />
          <Facebook className="w-5 h-5 hover:text-blue-600 cursor-pointer transition-colors" />
          <Instagram className="w-5 h-5 hover:text-pink-500 cursor-pointer transition-colors" />
          <Linkedin className="w-5 h-5 hover:text-blue-500 cursor-pointer transition-colors" />
        </div>
        <div className="flex space-x-4">
          <span className="text-sm hover:text-white cursor-pointer">Privacy Policy</span>
          <span className="text-sm hover:text-white cursor-pointer">Terms of Service</span>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-black p-2 rounded-full hover:bg-gray-900 transition-colors"
        aria-label="Scroll to top"
      >
        <ArrowUpCircle className="w-6 h-6 text-white" />
      </button>
    </footer>
  );
};

export default Footer;
