import React from "react";
import "tailwindcss/tailwind.css";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import ToneClassifier from "./components/ToneClassifier";
import ToneRewriter from "./components/ToneRewriter";
import MoodEnhancer from "./components/MoodEnhancer";
import GrammarCheck from "./components/GrammarCheck";
import Footer from "./components/Footer";
import Bubble from "./components/Bubble";


const App = () => {
  return (
    <AuthProvider>
      <Bubble/>
      <Navbar />
      <AuthModal />
      <ToneClassifier />
      <ToneRewriter />
      <MoodEnhancer />
      <GrammarCheck />
      <Footer />
    </AuthProvider>
  );
};

export default App;
