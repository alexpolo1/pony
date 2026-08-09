import { buildCurrentSceneNarration, buildEndNarration, buildResultNarration, buildSceneNarration } from './narration';

const result = {
  dice: [4, 5, 6],
  result: 'Succes!',
  story: 'Ponyen fandt den skjulte nøgle og åbnede døren.',
};

test('scene narration tells the roll, varied outcome, and next story beat in order', () => {
  const spoken = buildSceneNarration({
    history: [result],
    sceneText: 'Bag døren står en venlig drage.',
    voice: { question: { text: 'Vil du hilse på dragen?' } },
  });
  expect(spoken).toBe(
    'Terningerne viser 4 og 5 og 6. Succes! Ponyen fandt den skjulte nøgle og åbnede døren. '
    + 'Bag døren står en venlig drage. Vil du hilse på dragen? '
    + 'Du kan svare med stemmen eller trykke på den store terning.'
  );
});

test('kan oplæse resultat og næste scene hver for sig', () => {
  const data = {
    sceneText: 'Den næste sti ligger foran dig.',
    voice: { question: { text: 'Vil du gå videre?' } },
  };
  const result = { dice: [4, 6], result: 'Succes!', story: 'Du fandt stien.' };
  expect(buildResultNarration(result)).toContain('4 og 6');
  expect(buildCurrentSceneNarration(data)).toContain('Vil du gå videre?');
});

test('ending narration includes the final roll variation and ending', () => {
  const spoken = buildEndNarration({
    history: [result], endText: 'Equestria er reddet!', score: '5 succeser ud af 5',
  });
  expect(spoken).toContain('Terningerne viser 4 og 5 og 6.');
  expect(spoken).toContain(result.story);
  expect(spoken).toContain('Equestria er reddet!');
  expect(spoken).toContain('5 succeser ud af 5');
});
