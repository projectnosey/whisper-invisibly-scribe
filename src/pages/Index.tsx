
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff, Copy, Download } from "lucide-react";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [runInBackground, setRunInBackground] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast({
        title: "Error",
        description: `Speech recognition error: ${event.error}`,
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current?.start();
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const handleToggleListening = () => {
    setIsListening(!isListening);
  };

  const handleCopyText = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      toast({
        title: "Copied",
        description: "Transcript copied to clipboard",
      });
    }
  };

  const handleDownloadText = () => {
    if (transcript) {
      const element = document.createElement("a");
      const file = new Blob([transcript], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleClearText = () => {
    setTranscript("");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Real-time Speech Transcription</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Transcription Controls</CardTitle>
          <CardDescription>
            Start listening to transcribe speech to text in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleToggleListening}
                variant={isListening ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {isListening ? "Stop Listening" : "Start Listening"}
              </Button>
              {isListening && <span className="animate-pulse text-red-500">●</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="background-mode"
                checked={runInBackground}
                onCheckedChange={setRunInBackground}
              />
              <Label htmlFor="background-mode">Run in background</Label>
            </div>
          </div>
          
          {runInBackground && (
            <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 border border-yellow-200">
              <p>Note: Background mode in a web application is limited by browser permissions and visibility. For full background functionality, this app would need to be converted to a desktop application using Electron.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            Your speech will appear here as text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto bg-white">
            {transcript ? (
              <p className="whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-gray-400 italic">Start speaking to see the transcript...</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleClearText}
            disabled={!transcript}
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleCopyText}
              disabled={!transcript}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleDownloadText}
              disabled={!transcript}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This is a web application. For a complete Windows background application, it would need to be wrapped with Electron.</p>
      </div>
    </div>
  );
};

export default Index;
