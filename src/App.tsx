import React, { useRef, useEffect, useState } from 'react';
import './App.css'

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('Not Recording');
  const [recordingLength, setRecordingLength] = useState<number>(0);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          let startTime: number;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks((prev) => [...prev, event.data]);
            }
          };

          mediaRecorder.onstart = () => {
            setRecordingStatus('Recording...');
            startTime = Date.now();
          };

          mediaRecorder.onstop = () => {
            setRecordingStatus('Recording Stopped');
            setRecordingLength(Math.round((Date.now() - startTime) / 1000)); // Calculate recording length in seconds
          };

          setCameraPermission(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setCameraPermission(false);
      }
    };

    initCamera();

    return () => {
      const srcObject = videoRef.current?.srcObject as MediaStream;
      srcObject?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = () => {
    if (mediaRecorderRef.current && cameraPermission) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingStatus('Recording...');
      setRecordingLength(0);
    } else {
      console.log('Camera permission not granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadVideo = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'reflect-video.webm';
    a.click();
    window.URL.revokeObjectURL(url);
    setRecordedChunks([]);
    setRecordingStatus('Not Recording');
    setRecordingLength(0);
  };

  return (
    <div className='container'>
      <h1>Reflect</h1>
      {cameraPermission === false && <p>Give camera permission to use this app.</p>}
      {cameraPermission !== false && <video ref={videoRef} autoPlay playsInline muted />}
      <div className='buttons'>
        <p>Status: {recordingStatus}</p>
        <p>Recording Length: {recordingLength} seconds</p>
        <button onClick={startRecording} disabled={isRecording || cameraPermission === false}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={downloadVideo} disabled={recordedChunks.length === 0}>
          Download Video
        </button>
      </div>
    </div>
  );
};

export default App;
