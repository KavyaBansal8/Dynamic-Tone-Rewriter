import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import speech_recognition as sr
from gtts import gTTS
import os
import tempfile
import pygame

class GrammarCorrector:
    def __init__(self, model_name="prithivida/grammar_error_correcter_v1", use_gpu=None):
        """
        Initialize the grammar correction model
        Args:
        model_name: HuggingFace model name
        use_gpu: Whether to use GPU acceleration (None for auto-detection)
        """
        print(f"Loading model: {model_name}")
        # Auto-detect GPU if not specified
        if use_gpu is None:
            use_gpu = torch.cuda.is_available()
        self.device = 'cuda' if use_gpu and torch.cuda.is_available() else 'cpu'
        print(f"Using device: {self.device}")
        
        # Load model and tokenizer
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Move model to appropriate device
        self.model.to(self.device)
        print("Model loaded successfully")
        
        # Initialize speech recognizer
        self.recognizer = sr.Recognizer()
        
        # Initialize pygame for audio playback
        pygame.mixer.init()
    
    def correct(self, input_text, max_length=512, num_beams=5):
        """
        Correct grammar errors in the input text
        Args:
        input_text: Text with potential grammar errors
        max_length: Maximum sequence length
        num_beams: Number of beams for beam search
        Returns:
        Corrected text
        """
        # Skip empty inputs
        if not input_text.strip():
            return input_text
            
        # Tokenize the input text
        inputs = self.tokenizer(input_text, return_tensors="pt", padding=True, truncation=True, max_length=max_length)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Generate corrected text
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids=inputs['input_ids'],
                attention_mask=inputs['attention_mask'],
                max_length=max_length,
                num_beams=num_beams,
                early_stopping=True
            )
            
        # Decode the output tokens to text
        corrected_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return corrected_text
    
    def listen_audio(self, timeout=5):
        """
        Listen to audio input and convert to text
        Args:
        timeout: Maximum listening time in seconds
        Returns:
        Transcribed text from speech
        """
        print("Listening for audio input...")
        with sr.Microphone() as source:
            # Adjust for ambient noise
            self.recognizer.adjust_for_ambient_noise(source)
            try:
                # Listen for audio
                audio = self.recognizer.listen(source, timeout=timeout)
                print("Processing audio...")
                
                # Convert speech to text
                text = self.recognizer.recognize_google(audio)
                print(f"Recognized: {text}")
                return text
            except sr.WaitTimeoutError:
                print("No speech detected within timeout period")
                return ""
            except sr.UnknownValueError:
                print("Could not understand audio")
                return ""
            except sr.RequestError as e:
                print(f"Could not request results; {e}")
                return ""
    
    def text_to_speech(self, text):
        """
        Convert text to speech and play it
        Args:
        text: Text to convert to speech
        """
        # Create a temporary file for the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            temp_filename = temp_file.name
        
        # Generate speech from text
        tts = gTTS(text=text, lang='en')
        tts.save(temp_filename)
        
        # Play the audio
        print("Playing audio output...")
        pygame.mixer.music.load(temp_filename)
        pygame.mixer.music.play()
        
        # Wait for playback to finish
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        
        # Clean up the temporary file
        os.unlink(temp_filename)

def main():
    # Initialize the model
    print("Initializing Grammar Correction Model...")
    model = GrammarCorrector(use_gpu=False)
    
    print("\nWelcome to Grammar Correction Tool with Audio Support!")
    print("Enter 't' for text input, 'a' for audio input, or 'q' to quit\n")
    
    while True:
        # Get input method
        choice = input("Choose input method (t/a/q): ").lower()
        
        # Check if user wants to quit
        if choice == 'q':
            print("Exiting grammar correction tool. Goodbye!")
            break
        
        user_text = ""
        if choice == 't':
            # Get text input
            user_text = input("Enter text: ")
        elif choice == 'a':
            # Get audio input
            user_text = model.listen_audio()
        else:
            print("Invalid choice. Please try again.\n")
            continue
        
        # Process the input
        if user_text.strip():
            print("\nCorrecting...")
            corrected = model.correct(user_text)
            
            print(f"\nOriginal: {user_text}")
            print(f"Corrected: {corrected}\n")
            
            # Convert corrected text to speech
            model.text_to_speech(corrected)
        else:
            print("Empty input. Please try again.\n")

if __name__ == "__main__":
    main()