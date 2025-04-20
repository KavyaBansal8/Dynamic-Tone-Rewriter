import React, { Suspense, useState } from "react";
// import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import FaceModel from "../components/FaceModel";
import ClassifierModel from "../components/ClassifierModel";

const ToneClassifier = () => {
  // const { openAuthModal } = useAuth();
  const [showClassifier, setShowClassifier] = useState(false);

  const handleButtonClick = () => {
    setShowClassifier(true);
  };

  const handleCloseClassifier = () => {
    setShowClassifier(false);
  };

  return (
    <div
      id="tone-classifier"
      className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-black to-red-900 relative overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {!showClassifier ? (
          <motion.div 
            key="main-content"
            className="w-full h-full flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 3D Face Model on the Left */}
            <div className="w-1/2 h-full flex items-center justify-center">
              <Suspense fallback={null}>
                <FaceModel />
              </Suspense>
            </div>

            {/* Content on the Right */}
            <div className="w-1/2 flex items-center justify-center">
              <div className="text-red-100 text-center p-10 max-w-2xl backdrop-blur-md bg-red-800/30 rounded-xl shadow-xl border border-red-600/50">
                <h2 className="text-5xl font-extrabold mb-6 drop-shadow-lg text-red-300">
                  Discover Your Tone
                </h2>
                <p className="text-lg mb-6 opacity-90 text-red-200">
                  Analyze and classify your writing tone with advanced AI. Understand your
                  emotions and improve communication effortlessly.
                </p>
                <motion.button
                  className="bg-red-600 text-white px-8 py-3 rounded-full shadow-lg text-lg font-semibold hover:bg-red-700 transition relative overflow-hidden"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleButtonClick}
                >
                  Know about your tone!
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="classifier-model"
            className="w-full h-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ClassifierModel onClose={handleCloseClassifier} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToneClassifier;
