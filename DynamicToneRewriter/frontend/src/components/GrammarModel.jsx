import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { Client } from "@gradio/client";

// Text Input Component
function TextInputBox({ onSubmit, transcribedText }) {
  const [inputText, setInputText] = useState(transcribedText || "");

  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit(inputText);
    }
  };

  return (
    <div className="text-input-box p-4 bg-purple-700 rounded-lg">
      <textarea
        className="w-full p-3 rounded bg-purple-100 text-purple-900 mb-3"
        rows={5}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter your text here..."
      />
      <button
        onClick={handleSubmit}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
      >
        Analyze
      </button>
    </div>
  );
}

// Grammar Results Component
function GrammarResults({ correctedText, audioUrl, onAudioPlay, onAudioPause, onAudioEnd }) {
  const audioRef = useRef(null);
  
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('play', onAudioPlay);
      audioElement.addEventListener('pause', onAudioPause);
      audioElement.addEventListener('ended', onAudioEnd);
      
      return () => {
        audioElement.removeEventListener('play', onAudioPlay);
        audioElement.removeEventListener('pause', onAudioPause);
        audioElement.removeEventListener('ended', onAudioEnd);
      };
    }
  }, [onAudioPlay, onAudioPause, onAudioEnd]);

  if (!correctedText) return null;

  return (
    <div className="grammar-results p-4 bg-purple-800 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-2">Grammar Check Results</h3>
      <div className="mb-4">
        <div className="font-bold text-purple-200 mb-2">Corrected Text:</div>
        <div className="text-white p-3 bg-purple-900 rounded">
          {correctedText}
        </div>
      </div>
      {audioUrl && (
        <div className="mt-4">
          <div className="font-bold text-purple-200 mb-2">Audio Pronunciation:</div>
          <audio 
            ref={audioRef}
            controls 
            src={audioUrl} 
            className="w-full"
          ></audio>
        </div>
      )}
    </div>
  );
}

// Modal component for choosing input method
function ChoiceModal({ onClose, onUpload, onRecord, onTextInput }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Choose Input Method</h2>
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition"
            onClick={() => { onTextInput(); onClose(); }}
          >
            Text Input
          </button>
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition"
            onClick={() => { onUpload(); onClose(); }}
          >
            Upload Audio
          </button>
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition"
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

// 3D Ball Component - Input Ball (Left)
function InputBall({ onBallClick, isActive }) {
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
      args={[4.8, 64, 64]} // Increased size from 2.5 to 4
      onClick={onBallClick}
      position={[-5, 0, 0]}
    >
      <MeshDistortMaterial
        color="#9F7AEA" // Lighter purple
        distort={isActive ? 0.3 : 0.1}
        speed={isActive ? 2 : 0.5}
        wireframe
      />
    </Sphere>
  );
}

// 3D Ball Component - Output Ball (Right)
function OutputBall({ isActive, isAudioPlaying }) {
    const mesh = useRef();
  
    useFrame(({ clock }) => {
      if (isAudioPlaying) {
        // Only animate when audio is playing
        const time = clock.getElapsedTime();
        const dynamicScale = 1 + Math.sin(time * 2) * 0.1;
        mesh.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
        mesh.current.rotation.y = time * 0.5;
      } else {
        // No animation when audio isn't playing
        mesh.current.scale.set(1, 1, 1);
        mesh.current.rotation.y = 0;
      }
    });
  
    return (
      <Sphere
        ref={mesh}
        args={[4.8, 64, 64]}
        position={[5.5, 0, 0]}
      >
        <MeshDistortMaterial
          color={isAudioPlaying ? "#8B5CF6" : "#6B46C1"}
          distort={isAudioPlaying ? 0.5 : (isActive ? 0.2 : 0.1)}
          speed={isAudioPlaying ? 1 : (isActive ? 0.1 : 0.1)}
          wireframe
        />
      </Sphere>
    );
  }

// Main Component
export default function GrammarModel({ onClose }) {
  // State management
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctedText, setCorrectedText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [statusText, setStatusText] = useState("Click the left ball to start");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);
  const [isOutputActive, setIsOutputActive] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // State for transcribed text
  const [transcribedText, setTranscribedText] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Audio event handlers
  const handleAudioPlay = () => {
    setIsAudioPlaying(true);
    setStatusText("Playing pronunciation...");
  };

  const handleAudioPause = () => {
    setIsAudioPlaying(false);
    setStatusText("Click the left ball to start");
  };

  const handleAudioEnd = () => {
    setIsAudioPlaying(false);
    setStatusText("Click the left ball to start");
  };

  // Left ball click handler - show choice modal
  const handleInputBallClick = () => {
    if (!isRecording && !isProcessing) {
      setShowChoiceModal(true);
    }
  };

  // File upload handler
  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  // Text input handler
  const handleTextInput = () => {
    setShowTextInput(true);
    setShowResults(false);
  };

  // Function to handle the audio from Gradio API
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

  // Handle text submission - using GrammarCheck API
  const handleTextSubmit = async (text) => {
    setStatusText("Processing text...");
    setIsProcessing(true);
    setIsInputActive(false);
    setIsOutputActive(true);
    
    try {
      const client = await Client.connect("KavyaBansal/GrammarCheck");
      const result = await client.predict("/process_text_input", {
        text: text,
      });
      
      // Extract the corrected text and audio from the result
      const corrected = result.data[0];
      const audio = result.data[1];
      
      // Process the audio to get a playable URL
      const audioUrl = await processAudioFromAPI(audio);
      
      setCorrectedText(corrected);
      setAudioUrl(audioUrl);
      setShowResults(true);
    } catch (err) {
      console.error("Error processing text:", err);
      setCorrectedText("Error processing text. Please try again.");
      setShowResults(true);
    } finally {
      setIsProcessing(false);
      setStatusText("Click the left ball to start");
    }
  };

  // File change handler - process uploaded audio using GrammarCheck API
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setStatusText("Processing uploaded audio...");
    setShowTextInput(false);
    setShowResults(false);
    setIsProcessing(true);
    setIsInputActive(true);
    setIsOutputActive(false);
    
    // Reset previous analysis data
    setTranscribedText(null);

    try {
      const client = await Client.connect("KavyaBansal/GrammarCheck");
      const result = await client.predict("/process_audio_input", {
        audio_file: file,
      });
      
      // Extract the transcription, corrected text, and audio from the result
      const transcription = result.data[0];
      const corrected = result.data[1];
      const audio = result.data[2];
      
      // Process the audio to get a playable URL
      const audioUrl = await processAudioFromAPI(audio);
      
      setTranscribedText(transcription);
      setCorrectedText(corrected);
      setAudioUrl(audioUrl);
      
      setShowTextInput(true);
      setShowResults(true);
      setIsOutputActive(true);
    } catch (err) {
      console.error("Error processing audio:", err);
      setCorrectedText("Error processing audio. Please try again.");
      setShowResults(true);
    } finally {
      setIsProcessing(false);
      setIsInputActive(false);
      setStatusText("Click the left ball to start");
    }
  };

  // Live recording handler
  const handleRecordLive = async () => {
    setStatusText("Listening...");
    setShowTextInput(false);
    setShowResults(false);
    setIsRecording(true);
    setIsInputActive(true);
    setIsOutputActive(false);
    
    // Reset previous analysis data
    setTranscribedText(null);

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
          const client = await Client.connect("KavyaBansal/GrammarCheck");
          const result = await client.predict("/process_audio_input", {
            audio_file: audioBlob,
          });
          
          // Extract the transcription, corrected text, and audio from the result
          const transcription = result.data[0];
          const corrected = result.data[1];
          const audio = result.data[2];
          
          // Process the audio to get a playable URL
          const audioUrl = await processAudioFromAPI(audio);
          
          setTranscribedText(transcription);
          setCorrectedText(corrected);
          setAudioUrl(audioUrl);
          
          setShowTextInput(true);
          setShowResults(true);
          setIsOutputActive(true);
        } catch (err) {
          console.error("Error processing recording:", err);
          setCorrectedText("Error processing your speech. Please try again.");
          setShowResults(true);
        } finally {
          setIsProcessing(false);
          setIsInputActive(false);
          setStatusText("Click the left ball to start");
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
      setIsInputActive(false);
    }
  };

  // Custom scrollbar styles
  const scrollbarStyles = `
    .themed-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .themed-scrollbar::-webkit-scrollbar-track {
      background: rgba(107, 70, 193, 0.3);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(159, 122, 234, 0.7);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(159, 122, 234, 1);
    }
  `;

  return (
    <div className="w-screen h-screen mt-10 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800 relative">
      <style>{scrollbarStyles}</style>
      
      {/* Header */}
      <h1 className="text-4xl font-bold pt-10 text-white mb-10 absolute top-10">Improve your English!</h1>
      
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
          onTextInput={handleTextInput}
        />
      )}
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-10 right-10 bg-purple-500 hover:bg-purple-700 text-white px-3 py-2 rounded-full shadow-md transition z-10"
      >
        ✕
      </button>
      
      {/* 3D Balls Canvas */}
      <div className="w-full h-[60vh] relative">
        <Canvas camera={{ position: [0, 0, 12] }} className="w-full h-full">
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} />
          <InputBall onBallClick={handleInputBallClick} isActive={isInputActive} />
          <OutputBall isActive={isOutputActive} isAudioPlaying={isAudioPlaying} />
        </Canvas>
        
        {/* Text Input Box - Left Side */}
        {showTextInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute left-[9%] top-1/4 transform -translate-x-1/2 -translate-y-1/2 w-[300px]"
          >
            <TextInputBox onSubmit={handleTextSubmit} transcribedText={transcribedText} />
          </motion.div>
        )}
        
        {/* Results Box - Right Side */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute right-[9%] top-1/4 transform translate-x-1/2 -translate-y-1/2 w-[300px] max-h-[400px] overflow-y-auto themed-scrollbar"
          >
            <GrammarResults 
              correctedText={correctedText} 
              audioUrl={audioUrl}
              onAudioPlay={handleAudioPlay}
              onAudioPause={handleAudioPause}
              onAudioEnd={handleAudioEnd}
            />
          </motion.div>
        )}
      </div>
      
      {/* Status Text */}
      <div className="mt-4">
        <p className="text-white text-sm font-medium">
          {isRecording ? "Recording..." : isProcessing ? "Processing..." : statusText}
        </p>
      </div>
    </div>
  );
}