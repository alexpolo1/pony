import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const STATUS_TEXT = {
  idle: 'Tryk og fortæl mig dit svar!',
  requesting_permission: 'Et lille øjeblik...',
  listening: 'Jeg lytter...',
  processing: 'Hmm, lad mig tænke...',
  understood: 'Ja!',
  need_retry: 'Jeg hørte dig ikke helt. Vil du prøve igen?',
  error: 'Mikrofonen virker ikke lige nu. Brug knappen nedenunder.',
};

function preferredMimeType() {
  if (!window.MediaRecorder) return '';
  return ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm']
    .find(type => MediaRecorder.isTypeSupported(type)) || '';
}

export default function VoiceButton({ enabled, onAnswer }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const closeStream = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    closeStream();
  }, []);

  if (!enabled || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return null;

  const start = async () => {
    setMessage('');
    setStatus('requesting_permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = preferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        closeStream();
        if (!blob.size) {
          setStatus('need_retry');
          return;
        }
        setStatus('processing');
        try {
          const result = await onAnswer(blob);
          setTranscript(result.transcript || '');
          setMessage(result.child_response || '');
          setStatus(result.matched ? 'understood' : 'need_retry');
        } catch {
          setStatus('need_retry');
        }
      };
      recorder.start();
      setStatus('listening');
    } catch {
      closeStream();
      setStatus('error');
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const active = status === 'listening';
  const busy = status === 'requesting_permission' || status === 'processing';
  return (
    <section className={`voice-control voice-${status}`} aria-live="polite">
      <motion.button
        type="button"
        className="btn-voice"
        onClick={active ? stop : start}
        disabled={busy}
        aria-label={active ? 'Stop optagelse' : 'Svar med stemmen'}
        animate={active ? { scale: [1, 1.12, 1] } : { scale: [1, 1.04, 1] }}
        transition={{ duration: active ? 0.8 : 2, repeat: Infinity }}
      >
        {active ? '⏹️' : busy ? '✨' : '🎤'}
      </motion.button>
      <p className="voice-status">{message || STATUS_TEXT[status]}</p>
      {process.env.NODE_ENV === 'development' && transcript && (
        <small className="voice-transcript">Hørt: {transcript}</small>
      )}
    </section>
  );
}
