import { buildCurrentSceneNarration, buildEndNarration, buildResultNarration, buildSceneNarration, cleanNarrationText } from './narration';

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

test('oplæser alle fire muligheder i en valgscene', () => {
  const spoken = buildCurrentSceneNarration({
    sceneText: 'Twilight finder fire stier.',
    voice: {
      question: {
        text: 'Hvad vælger du? Vær modig, tænk dig om, bed en ven om hjælp eller brug pony-magi?',
      },
    },
    interaction: {
      type: 'choice',
      prompt: 'Hvad vælger du?',
      options: [
        { label: 'Vær modig' }, { label: 'Tænk dig om' },
        { label: 'Bed en ven om hjælp' }, { label: 'Brug pony-magi' },
      ],
    },
  });
  expect(spoken).toContain('Vær modig');
  expect(spoken).toContain('Brug pony-magi');
  expect(spoken).toContain('Lyt nu til de fire muligheder');
  expect(spoken).toContain('mulighed 1: Vær modig');
  expect(spoken).toContain('mulighed 4: Brug pony-magi');
  expect(spoken).toContain('en af de fire muligheder');
  expect(spoken).not.toContain('store terning');
});

test('binder resultat, sceneindledning, opgave og muligheder flydende sammen', () => {
  const spoken = buildCurrentSceneNarration({
    sceneText: 'Fluttershy finder et grønt blad i Angels spor.',
    actionText: 'Vælg farven på Angels kaninspor',
    interaction: {
      type: 'color', prompt: 'Find det grønne potemærke.',
      options: [
        { label: 'Rød' }, { label: 'Blå' }, { label: 'Gul' }, { label: 'Grøn' },
      ],
    },
  }, { afterResult: true });

  expect(spoken).toBe(
    'Nu fortsætter eventyret. Fluttershy finder et grønt blad i Angels spor. '
    + 'Din opgave er: Vælg farven på Angels kaninspor. Find det grønne potemærke. '
    + 'Lyt nu til de fire muligheder. mulighed 1: Rød. mulighed 2: Blå. '
    + 'mulighed 3: Gul. mulighed 4: Grøn. '
    + 'Du kan sige dit valg eller trykke på en af de fire muligheder.'
  );
});

test('læser ikke visuelle status-emojiers Unicode-navne op', () => {
  const spoken = buildResultNarration({
    dice: [4],
    result: '✅ Succes!',
    story: 'Twilight fandt bogen. ✨',
  });

  expect(spoken).toBe('Terningerne viser 4. Succes! Twilight fandt bogen.');
  expect(cleanNarrationText('❌ Prøv igen ⭐')).toBe('Prøv igen');
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
