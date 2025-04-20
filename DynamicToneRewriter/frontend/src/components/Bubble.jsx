// Bubble.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Bubble = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed w-10 h-10 bg-white opacity-30 rounded-full z-50 pointer-events-none"
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "bubble", stiffness: 100, damping: 10 }}
    />
  );
};

export default Bubble;