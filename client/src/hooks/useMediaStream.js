import { useState, useCallback, useRef, useEffect } from 'react';

export function useMediaStream() {
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const streamRef = useRef(null);

  // ── Device check (AFTER permission is already granted) ──────────
  // enumerateDevices() only returns real labels after getUserMedia has run.
  // We call this after acquiring a stream so the device flags are accurate.
  const checkDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const camera = devices.some(d => d.kind === 'videoinput');
      const mic    = devices.some(d => d.kind === 'audioinput');
      setHasCamera(camera);
      setHasMicrophone(mic);
      return { camera, mic };
    } catch (err) {
      console.error('[Media] Error enumerating devices:', err);
      return { camera: false, mic: false };
    }
  }, []);

  // ── Start stream ─────────────────────────────────────────────────
  // Strategy: try video+audio first, fall back gracefully.
  const startStream = useCallback(async (video = true, audio = true) => {
    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // Try the requested combination first
    const tryGet = async (v, a) => {
      if (!v && !a) return null;
      try {
        return await navigator.mediaDevices.getUserMedia({ video: v, audio: a });
      } catch {
        return null;
      }
    };

    let stream = null;

    if (video && audio) {
      stream = await tryGet(true, true);
      if (!stream) stream = await tryGet(false, true);  // audio-only fallback
      if (!stream) stream = await tryGet(true, false);  // video-only fallback
    } else if (video) {
      stream = await tryGet(true, false);
    } else if (audio) {
      stream = await tryGet(false, true);
    }

    if (!stream) {
      console.warn('[Media] Could not acquire any media stream');
      return null;
    }

    streamRef.current = stream;
    setLocalStream(stream);

    const hasVideo = stream.getVideoTracks().length > 0;
    const hasAudio = stream.getAudioTracks().length > 0;
    setCameraOn(hasVideo);
    setMicOn(hasAudio);

    // Re-check device availability now that permission is granted
    await checkDevices();

    return stream;
  }, [checkDevices]);

  // ── Toggle Microphone ────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const stream = streamRef.current;

    // No stream yet — start one with audio
    if (!stream) {
      const s = await startStream(false, true);
      if (s) setMicOn(true);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];

    if (audioTrack) {
      // Toggle enabled — this mutes/unmutes without stopping the track.
      // NOTE: For remote peers to know about mute state we emit a socket event
      // from CosmosView via the micOn state change, so this is correct.
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    } else {
      // No audio track at all — try to add one
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        stream.addTrack(newTrack);
        // Emit a new stream reference so WebRTC hook sees the change
        const merged = new MediaStream(stream.getTracks());
        streamRef.current = merged;
        setLocalStream(merged);
        setMicOn(true);
        await checkDevices();
      } catch (err) {
        console.error('[Media] Error adding audio track:', err);
      }
    }
  }, [startStream, checkDevices]);

  // ── Toggle Camera ────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    const stream = streamRef.current;

    // No stream yet — start one with video
    if (!stream) {
      const s = await startStream(true, false);
      if (s) setCameraOn(true);
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      // Toggle enabled — keeps same stream reference so <video> elements
      // don't need to be re-attached, but we update state so UI reflects change.
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    } else {
      // No video track at all — try to add one
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        stream.addTrack(newTrack);
        // Emit a new stream reference so WebRTC hook sees the change
        const merged = new MediaStream(stream.getTracks());
        streamRef.current = merged;
        setLocalStream(merged);
        setCameraOn(true);
        await checkDevices();
      } catch (err) {
        console.error('[Media] Error adding video track:', err);
      }
    }
  }, [startStream, checkDevices]);

  // ── Device-change listener ───────────────────────────────────────
  useEffect(() => {
    checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
    };
  }, [checkDevices]);

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    localStream,
    micOn,
    cameraOn,
    hasCamera,
    hasMicrophone,
    toggleMic,
    toggleCamera,
    startStream,
  };
}
