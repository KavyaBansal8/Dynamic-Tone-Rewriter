import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { Client } from "@gradio/client";

// Added a new component to receive the analysis data
function AnalysisReceiver({ transcribedText, predictedEmotion }) {
  // This component can do whatever you need with the data
  return (
    <div className="analysis-receiver p-4 bg-red-700 rounded-lg mt-4">
      <h3 className="text-xl font-bold text-white mb-2">Analysis Data</h3>
      <div className="mb-2">
        <span className="text-amber-300 font-semibold">Transcribed Text:</span> 
        <span className="text-white ml-2">{transcribedText || "No transcription available"}</span>
      </div>
      <div>
        <span className="text-amber-300 font-semibold">Predicted Emotion:</span> 
        <span className="text-white ml-2">{predictedEmotion || "No emotion detected"}</span>
      </div>
    </div>
  );
}

// Modal component for choosing input method
function ChoiceModal({ onClose, onUpload, onRecord }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Choose Input Method</h2>
        <div className="flex gap-6">
          <button
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            onClick={() => { onUpload(); onClose(); }}
          >
            Upload Audio
          </button>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            onClick={() => { onRecord(); onClose(); }}
          >
            Record Live
          </button>
        </div>
        <button
          className="mt-6 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Component to format and display analysis results
function AnalysisParagraph({ summary }) {
  if (!summary) return null;

  // Parse the summary text into sections
  const sections = parseAnalysisSummary(summary);

  return (
    <div>
      {sections.map((section, idx) => (
        <div key={idx} className="mb-4">
          {section.title && (
            <div className="font-bold text-amber-300 mb-2">{section.title}</div>
          )}
          <div>
            {section.items.map((item, i) => (
              <div key={i} className={i === 0 && section.title === "Predicted Emotion" ? "text-xl font-bold text-amber-200" : ""}>
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to parse analysis text into structured sections
function parseAnalysisSummary(summary) {
  if (!summary) return [];

  const lines = summary.split("\n");
  const sections = [];
  let currentSection = { title: "", items: [] };

  lines.forEach((line) => {
    if (!line.trim()) return; // Skip empty lines
    
    if (line.startsWith("Transcription:")) {
      if (currentSection.items.length) sections.push(currentSection);
      currentSection = { title: "Transcription", items: [line.replace("Transcription:", "").trim()] };
    } else if (line.startsWith("Predicted Emotion:")) {
      if (currentSection.items.length) sections.push(currentSection);
      currentSection = { title: "Predicted Emotion", items: [line.replace("Predicted Emotion:", "").trim()] };
    } else if (line.startsWith("Is Sarcastic:")) {
      currentSection.items.push(line);
    } else if (line.endsWith("Emotions:")) {
      if (currentSection.items.length) sections.push(currentSection);
      currentSection = { title: line, items: [] };
    } else if (line.trim().startsWith("  ")) {
      // Handle indented emotion probability lines
      currentSection.items.push(line.trim());
    } else {
      currentSection.items.push(line.trim());
    }
  });
  
  // Add the last section if it has items
  if (currentSection.items.length) sections.push(currentSection);

  return sections;
}

// Helper function to extract transcription and emotion from analysis text
function extractTranscriptionAndEmotion(summary) {
  if (!summary) return { transcription: null, emotion: null };
  
  let transcription = null;
  let emotion = null;
  
  const lines = summary.split("\n");
  
  lines.forEach(line => {
    if (line.startsWith("Transcription:")) {
      transcription = line.replace("Transcription:", "").trim();
    } else if (line.startsWith("Predicted Emotion:")) {
      emotion = line.replace("Predicted Emotion:", "").trim();
    }
  });
  
  return { transcription, emotion };
}

// 3D Ball Component
function VisualizerBall({ onBallClick, isActive }) {
  const mesh = useRef();
  const [scale, setScale] = useState(1);

  useFrame(({ clock }) => {
    if (isActive) {
      const time = clock.getElapsedTime();
      const dynamicScale = 1 + Math.sin(time * 2) * 0.1;
      setScale(dynamicScale);
      mesh.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    } else {
      mesh.current.scale.set(1, 1, 1);
    }
  });

  return (
    <Sphere
      ref={mesh}
      args={[3.5, 64, 64]}
      onClick={onBallClick}
    >
      <MeshDistortMaterial
        color="#FF3737"
        distort={isActive ? 0.3 : 0.1}
        speed={isActive ? 2 : 0.5}
        wireframe
      />
    </Sphere>
  );
}

// Main Component
export default function ClassifierModel({ onClose }) {
  // State management
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showText, setShowText] = useState(false);
  const [resultText, setResultText] = useState("");
  const [statusText, setStatusText] = useState("Click the ball to start speaking");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // New state variables to store transcription and emotion
  const [transcribedText, setTranscribedText] = useState(null);
  const [predictedEmotion, setPredictedEmotion] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Ball click handler - show choice modal
  const handleBallClick = () => {
    if (!isRecording && !isProcessing) {
      setShowChoiceModal(true);
    }
  };

  // File upload handler
  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  // File change handler - process uploaded audio
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setStatusText("Processing uploaded audio...");
    setShowText(false);
    setIsProcessing(true);
    setIsActive(true);
    
    // Reset previous analysis data
    setTranscribedText(null);
    setPredictedEmotion(null);

    try {
      const client = await Client.connect("KavyaBansal/EmotionClassifier");
      const result = await client.predict("/analyze_audio_1", {
        audio_path: file,
      });
      
      const analysisText = result.data[0] || "No analysis results available.";
      setResultText(analysisText);
      
      // Extract and set transcription and emotion
      const { transcription, emotion } = extractTranscriptionAndEmotion(analysisText);
      console.log("Transcribed Text:", transcription);
      console.log("Predicted Emotion:", emotion);
      
      // Update state with extracted data
      setTranscribedText(transcription);
      setPredictedEmotion(emotion);
      
      setShowText(true);
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setResultText("Error analyzing audio. Please try again.");
      setShowText(true);
    } finally {
      setIsProcessing(false);
      setIsActive(false);
      setStatusText("Click the ball to start speaking");
    }
  };

  // Live recording handler
  const handleRecordLive = async () => {
    setStatusText("Listening...");
    setShowText(false);
    setIsRecording(true);
    setIsActive(true);
    
    // Reset previous analysis data
    setTranscribedText(null);
    setPredictedEmotion(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setStatusText("Processing your speech...");
        setIsProcessing(true);
        setIsRecording(false);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const client = await Client.connect("KavyaBansal/EmotionClassifier");
          const result = await client.predict("/analyze_audio", {
            audio_path: audioBlob,
          });
          
          const analysisText = result.data[0] || "No analysis results available.";
          setResultText(analysisText);
          
          // Extract and set transcription and emotion
          const { transcription, emotion } = extractTranscriptionAndEmotion(analysisText);
          console.log("Transcribed Text:", transcription);
          console.log("Predicted Emotion:", emotion);
          
          // Update state with extracted data
          setTranscribedText(transcription);
          setPredictedEmotion(emotion);
          
          setShowText(true);
        } catch (err) {
          console.error("Error analyzing recording:", err);
          setResultText("Error analyzing your speech. Please try again.");
          setShowText(true);
        } finally {
          setIsProcessing(false);
          setIsActive(false);
          setStatusText("Click the ball to start speaking");
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      
      // Automatically stop after 5 seconds (can be adjusted)
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 5000);
    } catch (err) {
      console.error("Error recording audio:", err);
      setStatusText("Microphone access denied or not available.");
      setIsRecording(false);
      setIsActive(false);
    }
  };

  // Custom scrollbar styles
  const scrollbarStyles = `
    .themed-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .themed-scrollbar::-webkit-scrollbar-track {
      background: rgba(139, 0, 0, 0.3);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 55, 55, 0.7);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 55, 55, 1);
    }
  `;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-red-900 to-red-800 relative">
      <style>{scrollbarStyles}</style>
      
      {/* Hidden file input for audio uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      
      {/* Choice modal */}
      {showChoiceModal && (
        <ChoiceModal
          onClose={() => setShowChoiceModal(false)}
          onUpload={handleFileUpload}
          onRecord={handleRecordLive}
        />
      )}
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-20 right-5 bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded-full shadow-md transition z-10"
      >
        ✕
      </button>
      
      {/* 3D Ball Canvas */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5">
        <Canvas camera={{ position: [0, 0, 8] }} className="w-full h-full">
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} />
          <VisualizerBall onBallClick={handleBallClick} isActive={isActive} />
        </Canvas>
      </div>
      
      {/* Left Text */}
      <div className="absolute left-10 top-1/2 transform -translate-y-1/2 h-[70vh] flex flex-col justify-center">
        <p className="text-white text-5xl font-extrabold tracking-widest animate-pulse mb-6">
          Hello Kavya!
        </p>
        <p className="text-white text-4xl font-extrabold tracking-widest animate-pulse">
          How are you?
        </p>
      </div>
      
      {/* Status Text */}
      <div className="absolute left-10 bottom-10">
        <p className="text-white text-sm font-medium">
          {isRecording ? "Recording..." : isProcessing ? "Processing..." : statusText}
        </p>
      </div>
      
      {/* Right-Side Text Section - Analysis Results */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute right-10 top-30 transform -translate-y-1/2 w-1/3 max-h-[400px] overflow-hidden overflow-y-auto rounded-xl shadow-xl p-6 bg-red-900 text-white break-words themed-scrollbar"
        >
          <AnalysisParagraph summary={resultText} />
          
          {/* Add the AnalysisReceiver component here */}
          {(transcribedText || predictedEmotion) && (
            <AnalysisReceiver 
              transcribedText={transcribedText} 
              predictedEmotion={predictedEmotion} 
            />
          )}
        </motion.div>
      )}
    </div>
  );
}