export function buildResultNarration(lastResult) {
  if (!lastResult) return '';
  return `Terningerne viser ${lastResult.dice.join(' og ')}. ${lastResult.result} ${lastResult.story || ''}`;
}

export function buildCurrentSceneNarration(data) {
  return [
    data.sceneText,
    data.voice?.question?.text,
    'Du kan svare med stemmen eller trykke på den store terning.',
  ].filter(Boolean).join(' ');
}

export function buildSceneNarration(data) {
  const lastResult = data.history?.[data.history.length - 1];
  return [
    buildResultNarration(lastResult),
    buildCurrentSceneNarration(data),
  ].filter(Boolean).join(' ');
}

export function buildEndNarration(data) {
  const lastResult = data.history?.[data.history.length - 1];
  return [
    lastResult && `Terningerne viser ${lastResult.dice.join(' og ')}. ${lastResult.result} ${lastResult.story || ''}`,
    data.endText,
    data.score,
    'Tryk på den store terningknap for at spille igen, eller på huset for at gå til forsiden.',
  ].filter(Boolean).join(' ');
}
