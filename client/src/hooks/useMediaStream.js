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
      if (video && audio) return startStream(false, true);
      return null;
    }
  }, [checkDevices]);

  const toggleMic = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) {
      const s = await startStream(cameraOn, true);
      if (s) setMicOn(true);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      // Simply toggle enabled — keeps the same MediaStream reference intact
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    } else if (!micOn && hasMicrophone) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        stream.addTrack(newTrack);
        // Force React to see the updated stream (same reference, new track)
        setLocalStream(prev => prev); // triggers useEffects that depend on stream tracks
        setMicOn(true);
      } catch (err) {
        console.error("Error adding audio track:", err);
      }
    }
  }, [micOn, cameraOn, hasMicrophone, startStream]);

  const toggleCamera = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) {
      const s = await startStream(true, micOn);
      if (s) setCameraOn(true);
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      // Simply toggle enabled — keeps the same MediaStream reference intact
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    } else if (!cameraOn && hasCamera) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        stream.addTrack(newTrack);
        // Force React to see the updated stream (same reference, new track)
        setLocalStream(prev => prev); // triggers useEffects that depend on stream tracks
        setCameraOn(true);
      } catch (err) {
        console.error("Error adding video track:", err);
      }
    }
  }, [cameraOn, micOn, hasCamera, startStream]);

  useEffect(() => {
    checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
    };
  }, [checkDevices]);

  return { localStream, micOn, cameraOn, hasCamera, hasMicrophone, toggleMic, toggleCamera, startStream };
}
