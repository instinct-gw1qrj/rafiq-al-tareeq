// Loud arrival alarm built with the Web Audio API: no sound file, no network,
// and the volume is not limited by the media-clip trick — it sweeps like a siren.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AC = window.AudioContext ?? w.webkitAudioContext;
  if (!AC) return null;
  if (!ctx || ctx.state === "closed") ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * A sweeping siren for `seconds`, then three short beeps.
 * Browsers only allow sound after a user gesture — the trip alarm fires from a
 * GPS event on a page the user already touched, and the settings panel offers a
 * manual test button for the first time.
 */
export function playAlarm(seconds = 4): void {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;

  const out = ac.createGain();
  out.gain.value = 0.6;
  out.connect(ac.destination);

  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  const cycle = 0.45;
  for (let t = 0; t < seconds; t += cycle * 2) {
    osc.frequency.setValueAtTime(620, now + t);
    osc.frequency.linearRampToValueAtTime(1240, now + t + cycle);
    osc.frequency.linearRampToValueAtTime(620, now + t + cycle * 2);
  }
  osc.connect(out);
  osc.start(now);
  osc.stop(now + seconds);

  // Three loud beeps on top so it cuts through noise.
  const beep = ac.createOscillator();
  const beepGain = ac.createGain();
  beep.type = "square";
  beep.frequency.value = 880;
  beepGain.gain.value = 0;
  beep.connect(beepGain);
  beepGain.connect(ac.destination);
  for (let i = 0; i < 3; i++) {
    const t = now + seconds + i * 0.35;
    beepGain.gain.setValueAtTime(0.5, t);
    beepGain.gain.setValueAtTime(0, t + 0.2);
  }
  beep.start(now + seconds);
  beep.stop(now + seconds + 1.2);

  if ("vibrate" in navigator) navigator.vibrate?.([400, 150, 400, 150, 700]);
}

/** Short version for the "test the sound" button. */
export function testAlarm(): void {
  playAlarm(1.5);
}
