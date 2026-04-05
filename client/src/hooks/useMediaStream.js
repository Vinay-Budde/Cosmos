import { useState, useCallback, useRef, useEffect } from 'react';

export function useMediaStream() {
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const streamRef = useRef(null);

  const checkDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const camera = devices.some(device => device.kind === 'videoinput');
      const mic = devices.some(device => device.kind === 'audioinput');
      setHasCamera(camera);
      setHasMicrophone(mic);
      return { camera, mic };
    } catch (err) {
      console.error("Error enumerating devices:", err);
      return { camera: false, mic: false };
    }
  }, []);

  const startStream = useCallback(async (video = true, audio = true) => {
    const { camera, mic } = await checkDevices();
    
    // Adjust request based on actual hardware
    const constraints = {
      video: video && camera,
      audio: audio && mic
    };

    if (!constraints.video && !constraints.audio) {
      console.warn("No camera or microphone found");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setLocalStream(stream);
      setMicOn(audio && mic);
      setCameraOn(video && camera);
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      // Fallback if full request fails
      if (video && audio) return startStream(false, true); // Try audio only
      return null;
    }
  }, [checkDevices]);

  const toggleMic = useCallback(async () => {
    if (!streamRef.current) {
      const stream = await startStream(cameraOn, true);
      if (stream) setMicOn(true);
      return;
    }
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    } else if (!micOn && hasMicrophone) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        streamRef.current.addTrack(newTrack);
        setMicOn(true);
      } catch (err) {
        console.error("Error adding audio track:", err);
      }
    }
    // Refresh the stream object to trigger updates
    setLocalStream(new MediaStream(streamRef.current.getTracks()));
  }, [micOn, cameraOn, hasMicrophone, startStream]);

  const toggleCamera = useCallback(async () => {
    if (!streamRef.current) {
      const stream = await startStream(true, micOn);
      if (stream) setCameraOn(true);
      return;
    }
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    } else if (!cameraOn && hasCamera) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        streamRef.current.addTrack(newTrack);
        setCameraOn(true);
      } catch (err) {
        console.error("Error adding video track:", err);
      }
    }
    // Refresh the stream object to trigger updates
    setLocalStream(new MediaStream(streamRef.current.getTracks()));
  }, [cameraOn, micOn, hasCamera, startStream]);

  useEffect(() => {
    checkDevices();
    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
    };
  }, [checkDevices]);

  return { localStream, micOn, cameraOn, hasCamera, hasMicrophone, toggleMic, toggleCamera, startStream };
}
