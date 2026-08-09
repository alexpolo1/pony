/** Wait for the spoken Hermes reply, but never let missing audio events block the story. */
export function waitForSpokenReply(speakResponse, text, maxWaitMs = 12000) {
  if (!speakResponse || !text) return Promise.resolve();
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve();
    };
    const timeout = window.setTimeout(finish, maxWaitMs);
    Promise.resolve()
      .then(() => speakResponse(text))
      .then(finish, finish);
  });
}
