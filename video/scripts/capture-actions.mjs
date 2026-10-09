/** App-specific Playwright actions. Never insert fabricated transcriptions. */
export async function performScene(page, scene, demoAudio) {
  switch (scene.id) {
    case 'intro':
      await page.getByText('Client-Side Audio Transcription', {exact:true}).first().scrollIntoViewIfNeeded();
      break;
    case 'model': {
      const input = page.getByLabel('Whisper model', {exact:true});
      await input.scrollIntoViewIfNeeded();
      // Select an actually offered model, never assume a fixed model ID.
      const options = await input.locator('option').evaluateAll(elements => elements.map(el=>el.value));
      if (options.length > 1) await input.selectOption(options[0]);
      break;
    }
    case 'language':
      await page.getByLabel('Transcription language', {exact:true}).selectOption('english');
      break;
    case 'microphone':
      await page.getByRole('button',{name:'Start microphone'}).scrollIntoViewIfNeeded();
      // Do not start a real microphone without audio input or browser permission.
      break;
    case 'upload':
      await page.locator('input[type="file"]').setInputFiles({
        name:'demo-voice.wav', mimeType:'audio/wav', buffer:demoAudio,
      });
      break;
    case 'result':
      await page.getByText('Step 3 - Transcription', {exact:true}).scrollIntoViewIfNeeded();
      break;
    case 'outro':
      await page.getByText('Client-Side Audio Transcription', {exact:true}).first().scrollIntoViewIfNeeded();
      break;
    default:
      throw new Error(`Unknown scene: ${scene.id}`);
  }
}
