/** Remove decorative symbols that TTS engines otherwise announce by Unicode name. */
export function cleanNarrationText(text = '') {
  return String(text)
    .replace(/[\u2600-\u27BF\u2B00-\u2BFF]/g, ' ')
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, ' ')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildResultNarration(lastResult) {
  if (!lastResult) return '';
  const action = lastResult.dice?.length
    ? `Terningerne viser ${lastResult.dice.join(' og ')}.`
    : `Du valgte ${lastResult.selection}.`;
  return cleanNarrationText(`${action} ${lastResult.result} ${lastResult.story || ''}`);
}

export function buildCurrentSceneNarration(data, { afterResult = false } = {}) {
  const interaction = data.interaction || { type: 'dice' };
  const usesDice = interaction.type === 'dice';
  const labels = (interaction.options || [])
    .map((option, index) => option.label ? `mulighed ${index + 1}: ${option.label}` : '')
    .filter(Boolean);
  const spokenOptions = labels.length
    ? `Lyt nu til de fire muligheder. ${labels.slice(0, -1).join('. ')}. ${labels[labels.length - 1]}.`
    : '';
  const question = usesDice
    ? data.voice?.question?.text
    : interaction.prompt || data.voice?.question?.text;
  const instruction = usesDice
    ? 'Du kan svare med stemmen eller trykke på den store terning.'
    : 'Du kan sige dit valg eller trykke på en af de fire muligheder.';
  return cleanNarrationText([
    afterResult ? 'Nu fortsætter eventyret.' : '',
    data.sceneText,
    data.actionText ? `Din opgave er: ${data.actionText}.` : '',
    question,
    spokenOptions,
    instruction,
  ].filter(Boolean).join(' '));
}

export function buildSceneNarration(data) {
  const lastResult = data.history?.[data.history.length - 1];
  return cleanNarrationText([
    buildResultNarration(lastResult),
    buildCurrentSceneNarration(data),
  ].filter(Boolean).join(' '));
}

export function buildEndNarration(data) {
  const lastResult = data.history?.[data.history.length - 1];
  return cleanNarrationText([
    buildResultNarration(lastResult),
    data.endText,
    data.score,
    'Tryk på den store terningknap for at spille igen, eller på huset for at gå til forsiden.',
  ].filter(Boolean).join(' '));
}
