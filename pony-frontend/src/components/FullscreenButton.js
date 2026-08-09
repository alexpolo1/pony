import React, { useEffect, useState } from 'react';

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

export default function FullscreenButton() {
  const [active, setActive] = useState(() => !!fullscreenElement());
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const sync = () => {
      const browserFullscreen = !!fullscreenElement();
      setActive(browserFullscreen || document.documentElement.classList.contains('tablet-focus-mode'));
      if (browserFullscreen) setFallback(false);
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.documentElement.classList.remove('tablet-focus-mode');
    };
  }, []);

  const toggle = async () => {
    if (fullscreenElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      await exit?.call(document);
      return;
    }
    if (fallback) {
      document.documentElement.classList.remove('tablet-focus-mode');
      setFallback(false);
      setActive(false);
      return;
    }

    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (request) {
      try {
        await request.call(root, { navigationUI: 'hide' });
        setActive(true);
        return;
      } catch { /* use focus mode on browsers without element fullscreen */ }
    }
    root.classList.add('tablet-focus-mode');
    setFallback(true);
    setActive(true);
  };

  return (
    <button
      type="button" className={`fullscreen-button ${active ? 'is-active' : ''}`}
      onClick={toggle}
      aria-label={active ? 'Luk fuld skærm' : 'Åbn fuld skærm'}
      aria-pressed={active}
      title={active ? 'Luk fuld skærm' : 'Fuld skærm'}
    >
      <span aria-hidden="true">{active ? '⤢' : '⛶'}</span>
    </button>
  );
}
