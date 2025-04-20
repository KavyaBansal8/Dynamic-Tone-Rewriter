import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import EnhancerModel from "./EnhancerModel"; // Import the EnhancerModel component

const Model = ({ isHovered, isClicked }) => {
  const { scene } = useGLTF("/hug_sculpture_photoscan.glb");
  const modelRef = useRef();
  const radius = -0.3;
  const speed = 0.6;

  useFrame(({ clock }) => {
    if (modelRef.current) {
      const angle = clock.getElapsedTime() * speed;
      modelRef.current.position.x = Math.sin(angle) * radius;
      modelRef.current.position.z = Math.cos(angle) * radius;
      modelRef.current.rotation.y = -angle;
    }
  });

  return <primitive ref={modelRef} object={scene} scale={3} />;
};

const MoodEnhancer = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <div
      id="mood-enhancer"
      className="relative w-screen h-screen bg-gradient-to-b from-cyan-100 to-white"
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [-3, 2, 12], fov: 90 }}>
          <ambientLight intensity={1} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <Model isHovered={isHovered} isClicked={isClicked} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={1.5} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Centered Text Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          className="flex flex-col items-center space-y-6 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <h2
            className="text-5xl font-extrabold text-cyan-700 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              setIsClicked(true);
              setTimeout(() => setIsClicked(false), 300);
            }}
          >
            Mood Enhancer
          </h2>
          <p className="text-lg text-gray-600">I've got you!</p>
          <button
            onClick={() => setIsFullScreen(true)}
            className="bg-cyan-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg hover:bg-cyan-500 transition transform hover:scale-105"
          >
            I've got you!!
          </button>
        </motion.div>
      </div>

      {/* EnhancerModel */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-0 left-0 w-screen h-screen bg-black flex items-center justify-center z-50"
          >
            <button
              onClick={handleCloseFullScreen}
              className="absolute top-4 right-4 text-white bg-red-600 px-4 py-2 rounded-full hover:bg-red-800"
            >
              Close
            </button>
            <EnhancerModel onClose={handleCloseFullScreen} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodEnhancer;
