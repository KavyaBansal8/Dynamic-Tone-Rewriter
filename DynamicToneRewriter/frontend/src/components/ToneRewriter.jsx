import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import TryNowComponent from "./TryNowComponent"; // New component to open in fullscreen

const Model = () => {
  const { scene } = useGLTF("/smile.glb"); // Replace with your actual model path
  const modelRef = useRef();

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01; // Adjust rotation speed as needed
    }
  });

  return <primitive ref={modelRef} object={scene} scale={0.8} />;
};

const ToneRewriter = () => {
  const [showTryNow, setShowTryNow] = useState(false);

  return (
    <div id="tone-rewriter" className="h-screen w-screen flex items-center justify-between bg-gradient-to-r from-yellow-200 to-pink-200 relative overflow-hidden">
      {/* Zoom-in Effect for Try Now Component */}
      <AnimatePresence>
        {showTryNow && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TryNowComponent onClose={() => setShowTryNow(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Background */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full shadow-md"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: Math.random(),
            }}
          ></div>
        ))}
      </div>

      {/* Left Section - 3D Styled Text */}
      <motion.div
        className="w-1/2 pl-20 text-left relative z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h2
          className="text-6xl font-extrabold text-yellow-800"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            textShadow: "2px 2px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          Tone Rewriter
        </motion.h2>
        <p className="text-lg text-black mt-4">
          Learn the art of expressing your thoughts.
        </p>
        <button
          onClick={() => setShowTryNow(true)}
          className="mt-6 bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-900 transition text-lg"
        >
          Try Now
        </button>
      </motion.div>

      {/* Right Section - 3D Model */}
      <div className="w-1/2 h-full flex justify-center items-center relative z-10">
        <Canvas camera={{ position: [7, 5, 3] }}>
          <ambientLight intensity={0.5} />
          <Environment preset="sunset" />
          <OrbitControls enableZoom={false} />
          <Model />
        </Canvas>
      </div>
    </div>
  );
};

export default ToneRewriter;
