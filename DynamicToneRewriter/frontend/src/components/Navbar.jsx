import React, { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { useAuth } from "../AuthContext";
import logo from "../assets/logo.png";

const tabThemes = {
  "tone-classifier": "bg-red-600",
  "tone-rewriter": "bg-yellow-500",
  "mood-enhancer": "bg-cyan-500",
  "grammar-check": "bg-purple-500",
  "footer": "bg-navy-700"
};

const Navbar = () => {
  const { openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState("tone-classifier");
  const [theme, setTheme] = useState(tabThemes["tone-rewriter"]);

  useEffect(() => {
    setTheme(tabThemes[activeTab]);
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      // Get all sections
      const sections = Object.keys(tabThemes).map(id => {
        const element = document.getElementById(id);
        if (!element) return { id, top: 0, bottom: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
          id,
          top: rect.top,
          bottom: rect.bottom
        };
      });

      // Find the section that is currently most visible in the viewport
      const viewportHeight = window.innerHeight;
      let maxVisibleSection = null;
      let maxVisibleArea = 0;

      sections.forEach(section => {
        // Calculate how much of the section is visible
        const visibleTop = Math.max(0, section.top);
        const visibleBottom = Math.min(viewportHeight, section.bottom);
        const visibleArea = Math.max(0, visibleBottom - visibleTop);

        if (visibleArea > maxVisibleArea) {
          maxVisibleArea = visibleArea;
          maxVisibleSection = section.id;
        }
      });

      if (maxVisibleSection && maxVisibleSection !== activeTab) {
        setActiveTab(maxVisibleSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  return (
    <nav className={`fixed top-0 left-0 w-full text-white flex justify-between items-center px-6 py-4 shadow-lg z-50 transition-all duration-300 ${theme}`}>
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Logo" className="h-10 w-10" />
        <span className="text-xl font-bold">Tone Rewriter</span>
      </div>

      {/* Navigation Links */}
      <div className="space-x-6 hidden md:flex">
        {Object.keys(tabThemes).map((tab) => (
          <Link
            key={tab}
            to={tab}
            smooth={true}
            duration={500}
            className={`cursor-pointer px-3 py-2 rounded-lg transition-all ${activeTab === tab ? "bg-white text-black" : "hover:text-gray-300"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        ))}
      </div>

      {/* Sign In / Sign Up Button */}
      <button onClick={openAuthModal} className="bg-white text-black px-4 py-2 rounded-2xl hover:opacity-80 transition">
        Sign In / Sign Up
      </button>
    </nav>
  );
};

export default Navbar;
