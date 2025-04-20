import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { Client } from "@gradio/client";

// Ball component that animates when recording
function VisualizerBall({ onBallClick, animationState }) {
  const mesh = useRef();

  // Handle ball click
  const handleClick = () => {
    onBallClick();
  };

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    
    const time = clock.getElapsedTime();
    
    // Different animation states
    if (animationState === "recording") {
      // Fast pulsing animation during recording
      const dynamicScale = 1 + Math.sin(time * 2) * 0.1;
      mesh.current.scale.set(dynamicScale, dynamicScale, dynamicScale);
    } else if (animationState === "processing") {
      // Rotating animation during processing
      mesh.current.rotation.y = time * 0.5;
      const processingScale = 1 + Math.sin(time * 3) * 0.05;
      mesh.current.scale.set(processingScale, processingScale, processingScale);
    } else if (animationState === "completed") {
      // Slow gentle breathing animation after completion
      const gentleScale = 1 + Math.sin(time * 0.8) * 0.05;
      mesh.current.scale.set(gentleScale, gentleScale, gentleScale);
      mesh.current.rotation.y = time * 0.2;
    } else {
      // Idle state - minimal movement
      mesh.current.scale.set(1, 1, 1);
      mesh.current.rotation.y = time * 0.1;
    }
  });

  return (
    <Sphere
      ref={mesh}
      args={[3.5, 64, 64]}
      onClick={handleClick}
    >
      <MeshDistortMaterial
        color="#F7DC6F" // Yellow
        distort={animationState === "idle" ? 0.1 : 
                animationState === "recording" ? 0.3 : 
                animationState === "processing" ? 0.4 : 0.2}
        speed={animationState === "recording" ? 2 : 
              animationState === "processing" ? 3 : 0.8}
        wireframe
      />
    </Sphere>
  );
}

export default function ToneRewriterApp({ onClose }) {
  // State for recording and processing
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Click the ball to start speaking");
  
  // State for audio recording
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // State for model outputs
  const [transcription, setTranscription] = useState("");
  const [detectedEmotion, setDetectedEmotion] = useState("");
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [responseAudio, setResponseAudio] = useState(null);
  
  // State for UI control
  const [showResults, setShowResults] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("motivational");
  const [previousStyle, setPreviousStyle] = useState("motivational");
  const [error, setError] = useState(null);
  
  // State for popup
  const [showPopup, setShowPopup] = useState(false);
  
  // Ball animation state
  const [ballAnimationState, setBallAnimationState] = useState("idle");
  
  // State for audio playback
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const responseAudioRef = useRef(null);

  // Setup audio recording
  useEffect(() => {
    if (isRecording) {
      startRecording();
      setBallAnimationState("recording");
    } else if (audioChunksRef.current.length > 0) {
      stopRecording();
    }
  }, [isRecording]);
  
  // Update ball animation state based on app state
  useEffect(() => {
    if (isProcessing) {
      setBallAnimationState("processing");
    } else if (showResults) {
      setBallAnimationState("completed");
    } else if (!isRecording && !showPopup) {
      setBallAnimationState("idle");
    }
  }, [isProcessing, showResults, isRecording, showPopup]);
  
  // Reprocess audio when style changes after results are shown
  useEffect(() => {
    // Only reprocess if we have results and the style has changed
    if (showResults && audioBlob && selectedStyle !== previousStyle) {
      setPreviousStyle(selectedStyle);
      setIsProcessing(true);
      setShowResults(false);
      setStatusText(`Reprocessing with ${selectedStyle} style...`);
      
      // Small delay to ensure UI updates before processing
      setTimeout(() => {
        processAudio(audioBlob);
      }, 100);
    }
  }, [selectedStyle]);
  
  // Set up audio event listeners for response audio
  useEffect(() => {
    const audioElement = responseAudioRef.current;
    if (audioElement) {
      const handlePlay = () => {
        setIsAudioPlaying(true);
        setStatusText("Playing response audio...");
      };
      
      const handlePause = () => {
        setIsAudioPlaying(false);
        setStatusText("Click the ball to start speaking");
      };
      
      const handleEnded = () => {
        setIsAudioPlaying(false);
        setStatusText("Click the ball to start speaking");
      };
      
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [responseAudio]);

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setStatusText("Listening... Click the ball again to stop");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
      setIsRecording(false);
      setBallAnimationState("idle");
    }
  };

  // Stop audio recording and process the audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setPreviousStyle(selectedStyle); // Store the current style
        setIsProcessing(true);
        setStatusText("Processing your speech...");
        
        try {
          await processAudio(audioBlob);
        } catch (err) {
          console.error("Error processing audio:", err);
          setError("Error processing audio. Please try again.");
          setIsProcessing(false);
          setBallAnimationState("idle");
          setStatusText("Click the ball to start speaking");
        }
      };
      
      // Stop all tracks on the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Process audio data from API to get playable URL
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

  // Process audio with the ToneRewriter API
  const processAudio = async (audioBlob) => {
    try {
      // Check if we need to convert the audio format
      let processableBlob = audioBlob;
      
      // If the uploaded file isn't in WAV format (which the API might require),
      // you might need to convert it. This is a simplified example:
      if (audioBlob.type !== 'audio/wav') {
        // You might need to use a library like audio-recorder-polyfill
        // or handle this conversion on the server side
        console.log("Note: File is not in WAV format. Processing as-is.");
      }
      
      const client = await Client.connect("KavyaBansal/ToneRewriter");
      const result = await client.predict("/process_audio_wrapper", {
        audio_path: processableBlob,
        style: selectedStyle,
      });
      
      // Extract results
      setTranscription(result.data[0]);
      setDetectedEmotion(result.data[1]);
      setGeneratedResponse(result.data[2]);
      
      // Handle audio response if available
      if (result.data[3]) {
        const processedAudioUrl = await processAudioFromAPI(result.data[3]);
        setResponseAudio(processedAudioUrl);
      }
      
      setIsProcessing(false);
      setShowResults(true);
      setStatusText(`Analysis complete in ${selectedStyle} style. Change style or click the ball to start again.`);
    } catch (err) {
      console.error("API Error:", err);
      setError("Error connecting to the ToneRewriter API. Please try again later.");
      setIsProcessing(false);
      setBallAnimationState("idle");
      setStatusText("Click the ball to start speaking");
    }
  };

  // Handle ball click events
  const handleBallClick = () => {
    if (!isRecording && !isProcessing) {
      setShowPopup(true);
    } else if (isRecording) {
      // If already recording, stop the recording
      setIsRecording(false);
      setShowResults(false);
    }
  };
  
  // Handle option selection from popup
  const handleOptionSelect = (option) => {
    setShowPopup(false);
    
    if (option === 'record') {
      // Start recording
      setIsRecording(true);
      setShowResults(false);
      setError(null);
    } else if (option === 'upload') {
      // Trigger file upload input
      document.getElementById('file-upload').click();
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is audio
      if (!file.type.startsWith('audio/')) {
        setError("Please upload an audio file");
        return;
      }
      
      setUploadedFileName(file.name);
      setAudioBlob(file);
      setPreviousStyle(selectedStyle); // Store the current style
      setIsProcessing(true);
      setBallAnimationState("processing");
      setStatusText(`Processing "${file.name}"...`);
      
      try {
        await processAudio(file);
      } catch (err) {
        console.error("Error processing audio:", err);
        setError("Error processing audio file. Please try again.");
        setIsProcessing(false);
        setBallAnimationState("idle");
        setStatusText("Click the ball to start speaking");
      }
    }
  };
  
  // Handle style change
  const handleStyleChange = (e) => {
    const newStyle = e.target.value;
    setSelectedStyle(newStyle);
  };

  // Custom scrollbar styles
  const scrollbarStyles = `
    .themed-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .themed-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 0, 0.3);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(247, 220, 111, 0.7);
      border-radius: 10px;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(247, 220, 111, 1);
    }
  `;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-yellow-900 to-yellow-800 relative">
      <style>{scrollbarStyles}</style>
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 bg-yellow-500 hover:bg-yellow-700 text-white px-3 py-2 rounded-full shadow-md transition z-10"
      >
        ✕
      </button>

      {/* Style selector */}
      <div className="absolute top-5 left-5 z-10">
        <label className="text-white font-medium mb-2 block">Response Style:</label>
        <select 
          value={selectedStyle}
          onChange={handleStyleChange}
          className={`bg-yellow-800 text-white border border-yellow-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
            showResults && selectedStyle !== previousStyle ? "animate-pulse ring-2 ring-yellow-400" : ""
          }`}
          disabled={isRecording || isProcessing}
        >
          <option value="motivational">Motivational</option>
          <option value="calm">Calm</option>
          <option value="energetic">Energetic</option>
          <option value="angry">Angry</option>
        </select>
        
        {/* Style change indicator */}
        {showResults && selectedStyle !== previousStyle && (
          <p className="text-yellow-300 text-xs mt-1 animate-pulse">
            Changing style...
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input 
        type="file" 
        id="file-upload" 
        accept="audio/*" 
        onChange={handleFileUpload} 
        style={{ display: 'none' }} 
      />

      {/* 3D Visualizer Ball */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5">
        <Canvas
          camera={{ position: [0, 0, 8] }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} />
          <VisualizerBall 
            onBallClick={handleBallClick} 
            animationState={isAudioPlaying ? "processing" : ballAnimationState} 
          />
        </Canvas>
      </div>

      {/* Status and instructions */}
      <div className="absolute left-10 bottom-10">
        <p className="text-white text-sm font-medium">
          {statusText}
        </p>
        {error && (
          <p className="text-red-300 text-sm font-medium mt-2">
            Error: {error}
          </p>
        )}
      </div>

      {/* Welcome message when no results */}
      {!showResults && !isProcessing && !showPopup && (
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 h-[70vh] flex flex-col justify-center">
          <p className="text-white text-5xl font-extrabold tracking-widest animate-pulse mb-6">
            Hello there!
          </p>
          <p className="text-white text-2xl font-medium tracking-wide">
            Click the yellow ball to get started
          </p>
        </div>
      )}

      {/* Option Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-yellow-800 rounded-xl p-6 shadow-2xl max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Choose an Option</h3>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => handleOptionSelect('record')}
                className="bg-yellow-600 hover:bg-yellow-500 text-white py-4 px-6 rounded-lg flex flex-col items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-medium">Record Live</span>
              </button>
              
              <button
                onClick={() => handleOptionSelect('upload')}
                className="bg-yellow-600 hover:bg-yellow-500 text-white py-4 px-6 rounded-lg flex flex-col items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium">Upload File</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowPopup(false)}
              className="mt-6 w-full bg-yellow-900 hover:bg-yellow-700 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Loading indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 bg-yellow-900 rounded-xl p-6 shadow-xl"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">
              {selectedStyle !== previousStyle 
                ? `Reprocessing with ${selectedStyle} style...` 
                : "Analyzing your audio..."}
            </p>
          </div>
        </motion.div>
      )}

      {/* Results panel */}
      {showResults && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute right-10 top-1/6 transform -translate-y-1/2 w-1/3 max-h-[70vh] overflow-hidden overflow-y-auto rounded-xl shadow-xl p-6 bg-yellow-900 text-white break-words themed-scrollbar"
        >
          <h2 className="text-2xl font-bold mb-4 border-b border-yellow-600 pb-2">
            Analysis Results
            <span className="text-sm font-normal ml-2 text-yellow-300">
              ({selectedStyle} style)
            </span>
          </h2>
          
          {uploadedFileName && (
            <div className="mb-4">
              <p className="text-yellow-300 text-sm">Processed file: {uploadedFileName}</p>
            </div>
          )}
          
          {/* Transcription */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Your Speech</h3>
            <div className="bg-yellow-950 p-3 rounded-lg">
              <p className="text-white">{transcription || "No transcription available"}</p>
            </div>
          </div>
          
          {/* Detected Emotion */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Detected Emotion</h3>
            <div className="bg-yellow-950 p-3 rounded-lg">
              <p className="text-white font-medium">{detectedEmotion || "No emotion detected"}</p>
            </div>
          </div>
          
          {/* Generated Response */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Generated Response</h3>
            <div className="bg-yellow-950 p-3 rounded-lg">
              <p className="text-white">{generatedResponse || "No response generated"}</p>
            </div>
          </div>
          
          {/* Audio Response */}
          {responseAudio && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2 text-yellow-300">Audio Response</h3>
              <audio 
                ref={responseAudioRef}
                controls 
                className="w-full"
              >
                <source src={responseAudio} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          {/* Original Audio */}
          {audioBlob && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-yellow-300">Your Recording</h3>
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          {/* Style switcher hint */}
          <div className="mt-6 pt-4 border-t border-yellow-600">
            <p className="text-yellow-300 text-sm italic">
              Try changing the response style above to see how your speech gets responded differently!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}