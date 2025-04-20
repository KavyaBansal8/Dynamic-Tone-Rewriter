import * as THREE from 'three';
import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import GrammarModel from "./GrammarModel"; // Import the separate GrammarModel component

const Model = () => {
  // If you're using a custom GLB model
  const { scene } = useGLTF("/cube.glb");
  
  useEffect(() => {
    // Fix materials to ensure they render properly
    scene.traverse((node) => {
      if (node.isMesh) {
        // Ensure materials are properly configured
        node.material.needsUpdate = true;
        
        // Make sure materials receive light
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Force material to use correct encoding
        if (node.material.map) {
          node.material.map.encoding = THREE.sRGBEncoding;
        }
      }
    });
  }, [scene]);
  
  return <primitive object={scene} scale={1.0} rotation={[0, Math.PI/4, 0]} />;
};

const GrammarCheck = () => {
  const [showGrammarModel, setShowGrammarModel] = useState(false);

  const handleButtonClick = () => {
    setShowGrammarModel(true);
  };

  const handleCloseGrammarModel = () => {
    setShowGrammarModel(false);
  };

  return (
    <div id="grammar-check" className="h-screen w-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-700 text-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!showGrammarModel ? (
          <motion.div 
            key="main-content"
            className="w-full h-full flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left Section */}
            <div className="w-1/2 flex flex-col justify-center items-start p-10 space-y-6">
              <motion.h2 
                className="text-5xl font-extrabold"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Elevate Your English
              </motion.h2>
              <motion.p 
                className="text-lg text-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Unlock your potential with AI-powered grammar checks and personalized learning.
              </motion.p>
              <motion.button 
                onClick={handleButtonClick}
                className="bg-white text-purple-700 px-6 py-3 rounded-full shadow-lg hover:bg-gray-200 transition text-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Improving
              </motion.button>
            </div>

            {/* Right Section - 3D Model */}
            <div className="w-1/2 h-full flex items-center justify-center">
              <Suspense fallback={null}>
                <Canvas 
                  shadows 
                  camera={{ position: [3, 3, 3], fov: 50 }}
                  gl={{ 
                    antialias: true,
                    outputEncoding: THREE.sRGBEncoding,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0
                  }}
                >
                  {/* Lighting */}
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
                  <directionalLight position={[-5, 5, -5]} intensity={1.5} />
                  <directionalLight position={[0, 5, -5]} intensity={1} />
                  <hemisphereLight args={[0xffffff, 0x444444]} intensity={1} />

                  <Model />
                  <OrbitControls 
                    autoRotate 
                    autoRotateSpeed={1} 
                    enableZoom={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                  />
                </Canvas>
              </Suspense>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grammar-model"
            className="w-full h-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GrammarModel onClose={handleCloseGrammarModel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrammarCheck;