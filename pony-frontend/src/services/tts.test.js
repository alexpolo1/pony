import { cancelSpeech, speakDanish } from './tts';
import { duckMusic } from '../SceneMusic';

jest.mock('../SceneMusic', () => ({ duckMusic: jest.fn() }));

describe('Danish text to speech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
    };
    window.speechSynthesis = {
      cancel: jest.fn(),
      getVoices: jest.fn(() => [{ lang: 'en-US' }, { lang: 'da-DK', name: 'Dansk' }]),
      speak: jest.fn(utterance => {
        utterance.onstart();
        utterance.onend();
      }),
    };
  });

  afterEach(cancelSpeech);

  it('selects a Danish voice and ducks music while speaking', async () => {
    await speakDanish('Er du klar?', 0.6);
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.lang).toBe('da-DK');
    expect(utterance.voice.lang).toBe('da-DK');
    expect(utterance.volume).toBe(0.6);
    expect(duckMusic.mock.calls).toContainEqual([true]);
    expect(duckMusic.mock.calls).toContainEqual([false]);
  });
});
