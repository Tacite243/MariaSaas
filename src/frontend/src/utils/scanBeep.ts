/** Bip synthétique léger via Web Audio — aucun fichier externe */
let audioCtx: AudioContext | null = null

export const playScanBeep = (): void => {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = 1200
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.08)
  } catch {
    // Silencieux si AudioContext indisponible
  }
}
