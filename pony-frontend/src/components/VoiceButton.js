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

const STATUS_ICON = {
  idle: '🎤',
  requesting_permission: '⏳',
  listening: '👂',
  processing: '✨',
  understood: '✅',
  need_retry: '❓',
  error: '⚠️',
};

function preferredMimeType() {
  if (!window.MediaRecorder) return '';
  return ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm']
    .find(type => MediaRecorder.isTypeSupported(type)) || '';
}

export default function VoiceButton({ enabled, onAnswer, speaking = false, disabled = false }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const autoStopRef = useRef(null);

  const clearAutoStop = () => {
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
  };

  const closeStream = () => {
    clearAutoStop();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  if (!enabled) return null;

  const start = async () => {
    if (speaking) return;
    setMessage('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('error');
      return;
    }
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
        clearAutoStop();
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
          setStatus(result.gameState || result.matched ? 'understood' : 'need_retry');
        } catch {
          setStatus('need_retry');
        }
      };
      recorder.start();
      autoStopRef.current = window.setTimeout(() => {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      }, 5000);
      setStatus('listening');
    } catch {
      closeStream();
      setStatus('error');
    }
  };

  const stop = () => {
    clearAutoStop();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const active = status === 'listening';
  const busy = disabled || speaking || status === 'requesting_permission' || status === 'processing';
  const statusText = disabled
    ? 'Vent på terningerne...'
    : speaking
      ? 'Ponyen taler...'
      : message || STATUS_TEXT[status];
  const statusIcon = disabled ? '⏳' : speaking ? '🔊' : STATUS_ICON[status];
  return (
    <section
      className={`voice-control voice-${status}`} aria-live="polite"
      aria-label={statusText}
    >
      <motion.button
        type="button"
        className="btn-voice"
        onClick={active ? stop : start}
        disabled={busy}
        aria-label={active ? 'Stop optagelse' : 'Svar med stemmen'}
        animate={active ? { scale: [1, 1.12, 1] } : { scale: [1, 1.04, 1] }}
        transition={{ duration: active ? 0.8 : 2, repeat: Infinity }}
      >
        {active ? '⏹️' : speaking ? '🔊' : busy ? '✨' : '🎤'}
      </motion.button>
      <p className="voice-status" aria-hidden="true">{statusIcon}</p>
      {status === 'listening' && (
        <div
          className="voice-activity voice-activity-listening"
          role="progressbar" aria-valuemin="0" aria-valuemax="5"
          aria-label="Mikrofonen lytter i højst fem sekunder"
        >
          <div className="voice-activity-track" aria-hidden="true">
            <span className="voice-activity-fill" />
          </div>
          <div className="voice-activity-steps" aria-hidden="true">
            <span>🎤</span><i /><i /><i /><i /><i />
          </div>
        </div>
      )}
      {status === 'processing' && (
        <div
          className="voice-activity voice-activity-processing"
          role="progressbar"
          aria-label="Whisper lytter og sender beskeden til Hermes"
        >
          <div className="voice-activity-track" aria-hidden="true">
            <span className="voice-activity-fill" />
          </div>
          <div className="voice-processing-steps" aria-hidden="true">
            <span><b>👂</b> Whisper</span>
            <i>➜</i>
            <span><b>💭</b> Hermes</span>
          </div>
        </div>
      )}
      {process.env.NODE_ENV === 'development' && transcript && (
        <small className="voice-transcript">Hørt: {transcript}</small>
      )}
    </section>
  );
}
