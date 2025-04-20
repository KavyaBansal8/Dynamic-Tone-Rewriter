import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "@gradio/client";

function VisualizerBall({ onBallClick, isProcessing }) {
  const mesh = useRef();
  const [scale, setScale] = useState(1);

  // Handle ball click
  const handleClick = () => {
    onBallClick();
  };

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (isProcessing) {
      // More intense animation during processing
      const dynamicScale = 1 + Math.sin(time * 2) * 0.2;
      setScale(dynamicScale);
      mesh.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    } else {
      // Gentle pulsing in idle state
      const idleScale = 1 + Math.sin(time * 0.5) * 0.05;
      mesh.current.scale.set(idleScale, idleScale, idleScale);
    }
  });

  return (
    <Sphere
      ref={mesh}
      args={[3.5, 64, 64]}
      onClick={handleClick}
    >
      <MeshDistortMaterial
        color="#00FFFF" // Cyan
        distort={isProcessing ? 0.3 : 0.1}
        speed={isProcessing ? 2 : 0.5}
        wireframe
      />
    </Sphere>
  );
}

export default function EnhancerModel({ onClose }) {
  const [showText, setShowText] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Click the ball to start");
  const [responseData, setResponseData] = useState({
    detectedMood: "",
    moodScore: "",
    response: "",
    audioResponse: null
  });
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);
  const [showPopup, setShowPopup] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // Added audio ref to control and monitor the audio playback
  const audioRef = useRef(null);

  // Initialize media recorder
  useEffect(() => {
    async function setupRecorder() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.current.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          setAudioBlob(audioBlob);
          audioChunks.current = [];
          
          // Process audio with Gradio API
          await processAudioWithAPI(audioBlob);
        };
        
        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setStatusText("Microphone access denied. Please enable microphone access.");
      }
    }
    
    setupRecorder();
  }, []);

  // Audio event handlers - new functions to handle audio playback
  const handleAudioPlay = () => {
    setIsAudioPlaying(true);
    setStatusText("Playing audio response...");
  };

  const handleAudioPause = () => {
    setIsAudioPlaying(false);
    setStatusText("Click the ball to start");
  };

  const handleAudioEnd = () => {
    setIsAudioPlaying(false);
    setStatusText("Click the ball to start");
  };

  // New function to process audio from API (similar to GrammarModel)
  const processAudioFromAPI = async (audioData) => {
    if (!audioData) return null;
    
    try {
      // Check if audioData is a data URL
      if (typeof audioData === 'string' && audioData.startsWith('data:')) {
        return audioData;
      }
      
      // If it's a blob or file object from the API
      if (audioData instanceof Blob) {
        return URL.createObjectURL(audioData);
      }
      
      // If it's a base64 string without the data URL prefix
      if (typeof audioData === 'string') {
        // Determine the MIME type (assuming it's mp3 if not specified)
        const mimeType = 'audio/mp3';
        return `data:${mimeType};base64,${audioData}`;
      }
      
      // For other formats that might come from Gradio
      if (audioData.url) {
        return audioData.url;
      }
      
      if (audioData.data) {
        const blob = new Blob([audioData.data], { type: 'audio/mp3' });
        return URL.createObjectURL(blob);
      }
      
      console.error("Unknown audio data format:", audioData);
      return null;
    } catch (err) {
      console.error("Error processing audio data:", err);
      return null;
    }
  };

  // Process text input with Gradio API
  const processTextWithAPI = async (text) => {
    try {
      setStatusText("Processing your text...");
      setIsProcessing(true);
      const client = await Client.connect("KavyaBansal/MoodEnhancer");
      const result = await client.predict("/text_interface", { 
        text: text 
      });
      
      // Process the audio to get a playable URL
      const audioUrl = await processAudioFromAPI(result.data[3]);
      
      setResponseData({
        detectedMood: result.data[0],
        moodScore: result.data[1],
        response: result.data[2],
        audioResponse: audioUrl // Use the processed audio URL
      });
      
      setShowText(true);
      setIsProcessing(false);
      setStatusText("Click the ball to start");
    } catch (error) {
      console.error("Error processing text:", error);
      setStatusText("Error processing your text. Please try again.");
      setIsProcessing(false);
    }
  };

  // Process audio with Gradio API
  const processAudioWithAPI = async (audioBlob) => {
    try {
      setStatusText("Processing your audio...");
      setIsProcessing(true);
      const client = await Client.connect("KavyaBansal/MoodEnhancer");
      const result = await client.predict("/audio_interface", { 
        audio: audioBlob 
      });
      
      setTranscribedText(result.data[0]);
      
      // Process the audio to get a playable URL
      const audioUrl = await processAudioFromAPI(result.data[4]);
      
      setResponseData({
        detectedMood: result.data[1],
        moodScore: result.data[2],
        response: result.data[3],
        audioResponse: audioUrl // Use the processed audio URL
      });
      
      setShowText(true);
      setIsProcessing(false);
      setStatusText("Click the ball to start");
    } catch (error) {
      console.error("Error processing audio:", error);
      setStatusText("Error processing your audio. Please try again.");
      setIsProcessing(false);
    }
  };

  // Handle ball click to show popup
  const handleBallClick = () => {
    if (!isProcessing && !isRecording) {
      setShowPopup(true);
    } else if (isRecording) {
      stopRecording();
    }
  };

  // Start recording function
  const startRecording = () => {
    setShowPopup(false);
    setIsRecording(true);
    setStatusText("Listening... Click the ball again to stop.");
    setShowText(false);
    
    if (mediaRecorder) {
      audioChunks.current = [];
      mediaRecorder.start();
    }
  };

  // Stop recording function
  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    setStatusText("Processing your speech...");
    
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setShowPopup(false);
      setIsProcessing(true);
      setStatusText("Processing your audio file...");
      await processAudioWithAPI(file);
    }
  };

  // Handle text input option
  const handleTextInputOption = () => {
    setShowPopup(false);
    setShowTextInput(true);
  };

  // Handle text submission
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      setShowTextInput(false);
      setIsProcessing(true);
      processTextWithAPI(textInput);
      setTextInput("");
    }
  };

  const scrollbarStyles = `
    .themed-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .themed-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 255, 255, 0.3);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(0, 255, 255, 0.7);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 255, 255, 1);
    }
  `;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-800 relative">
      <style>{scrollbarStyles}</style>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-20 right-5 bg-cyan-500 hover:bg-cyan-700 text-white px-3 py-2 rounded-full shadow-md transition z-10"
      >
        ✕
      </button>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5">
        <Canvas
          camera={{ position: [0, 0, 8] }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} />
          <VisualizerBall 
            onBallClick={handleBallClick} 
            isProcessing={isProcessing || isRecording || isAudioPlaying} 
          />
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

      {/* Bottom Left Text */}
      <div className="absolute left-10 bottom-10">
        <p className="text-white text-sm font-medium">
          {statusText}
        </p>
      </div>

      {/* Popup Menu */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-800 rounded-xl shadow-2xl p-6 z-20 w-80"
          >
            <h3 className="text-white text-xl font-bold mb-4 text-center">Choose Input Method</h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleTextInputOption}
                className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <span>✏️</span> Text Input
              </button>
              
              <label className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer">
                <span>📁</span> Upload Audio
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              
              <button 
                onClick={startRecording}
                className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <span>🎙️</span> Record Live
              </button>
            </div>
            
            <button 
              onClick={() => setShowPopup(false)}
              className="mt-4 text-cyan-300 hover:text-white text-sm w-full text-center"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Form */}
      <AnimatePresence>
        {showTextInput && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-800 rounded-xl shadow-2xl p-6 z-20 w-96"
          >
            <h3 className="text-white text-xl font-bold mb-4">Enter Your Text</h3>
            
            <form onSubmit={handleTextSubmit}>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-3 rounded-lg bg-cyan-700 text-white placeholder-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-4"
                placeholder="Type your message here..."
                rows={4}
                required
              />
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition flex-1"
                >
                  Submit
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Controls */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-cyan-800 rounded-full shadow-lg px-6 py-3 flex items-center gap-4"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Recording...</span>
          <button
            onClick={stopRecording}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1 rounded-full transition"
          >
            Stop
          </button>
        </motion.div>
      )}

      {/* Right-Side Text Section */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute right-10 top-1/4 transform -translate-y-1/2 w-1/3 max-h-[400px] overflow-hidden overflow-y-auto rounded-xl shadow-xl p-6 bg-cyan-900 text-white break-words themed-scrollbar"
        >
          {transcribedText && (
            <div className="mb-4">
              <h3 className="text-cyan-300 font-bold mb-1">You said:</h3>
              <p className="text-white">{transcribedText}</p>
            </div>
          )}
          
          {responseData.detectedMood && (
            <div className="mb-4">
              <h3 className="text-cyan-300 font-bold mb-1">Detected Mood:</h3>
              <p className="text-white">{responseData.detectedMood}</p>
            </div>
          )}
          
          {responseData.moodScore && (
            <div className="mb-4">
              <h3 className="text-cyan-300 font-bold mb-1">Mood Score:</h3>
              <p className="text-white">{responseData.moodScore}</p>
            </div>
          )}
          
          {responseData.response && (
            <div className="mb-4">
              <h3 className="text-cyan-300 font-bold mb-1">Response:</h3>
              <p className="text-lg font-medium leading-relaxed">{responseData.response}</p>
            </div>
          )}
          
          {responseData.audioResponse && (
            <div className="mt-4">
              <h3 className="text-cyan-300 font-bold mb-1">Audio Response:</h3>
              <audio 
                ref={audioRef}
                controls 
                src={responseData.audioResponse} 
                className="w-full mt-2"
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onEnded={handleAudioEnd}
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
