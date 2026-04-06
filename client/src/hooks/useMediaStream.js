import { useState, useCallback, useRef, useEffect } from 'react';

export function useMediaStream() {
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [devices, setDevices] = useState([]);
  const streamRef = useRef(null);

  const checkDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
      const camera = allDevices.some(device => device.kind === 'videoinput');
      const mic = allDevices.some(device => device.kind === 'audioinput');
      setHasCamera(camera);
      setHasMicrophone(mic);
      return { camera, mic };
    } catch (err) {
      console.error("Error enumerating devices:", err);
      return { camera: false, mic: false };
    }
  }, []);

  const startStream = useCallback(async (video = true, audio = true, videoId = null, audioId = null) => {
    const { camera, mic } = await checkDevices();

    const constraints = {
      video: video && camera ? (videoId ? { deviceId: { exact: videoId } } : true) : false,
      audio: audio && mic ? (audioId ? { deviceId: { exact: audioId } } : true) : false
    };

    if (!constraints.video && !constraints.audio) {
      console.warn("No camera or microphone found");
      return null;
    }

    try {
      // If we already have a stream, stop existing tracks of the same kind to prevent conflicts
      if (streamRef.current) {
        if (constraints.video) {
          streamRef.current.getVideoTracks().forEach(t => t.stop());
        }
        if (constraints.audio) {
          streamRef.current.getAudioTracks().forEach(t => t.stop());
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (streamRef.current) {
        // Merge with existing stream if only one kind was requested
        if (constraints.video && !constraints.audio) {
          const oldAudio = streamRef.current.getAudioTracks()[0];
          if (oldAudio) stream.addTrack(oldAudio);
        } else if (!constraints.video && constraints.audio) {
          const oldVideo = streamRef.current.getVideoTracks()[0];
          if (oldVideo) stream.addTrack(oldVideo);
        }
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setMicOn(audio && mic);
      setCameraOn(video && camera);
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      // Fallback: try audio only if video+audio failed
      if (video && audio) return startStream(false, true);
      return null;
    }
  }, [checkDevices]);

  const switchDevice = useCallback(async (kind, deviceId) => {
    if (kind === 'videoinput') {
      return startStream(true, micOn, deviceId, null);
    } else {
      return startStream(cameraOn, true, null, deviceId);
    }
  }, [startStream, micOn, cameraOn]);

  const toggleMic = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) {
      const s = await startStream(cameraOn, true);
      if (s) setMicOn(true);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    } else if (!micOn && hasMicrophone) {
      startStream(cameraOn, true);
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
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    } else if (!cameraOn && hasCamera) {
      startStream(true, micOn);
    }
  }, [cameraOn, micOn, hasCamera, startStream]);

  useEffect(() => {
    checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
    };
  }, [checkDevices]);

  return { 
    localStream, micOn, cameraOn, hasCamera, hasMicrophone, devices,
    toggleMic, toggleCamera, startStream, switchDevice 
  };
}
