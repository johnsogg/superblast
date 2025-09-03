export class AudioUtils {
  private audioContext: AudioContext;
  private masterVolume: number = 0.3;

  constructor() {
    this.audioContext = new AudioContext();
  }

  private createOscillator(frequency: number, type: OscillatorType = 'sine'): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    return oscillator;
  }

  private createGain(volume: number = 1): GainNode {
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
    return gain;
  }


  public playSwapSound(): void {
    const oscillator = this.createOscillator(440, 'sine');
    const gain = this.createGain(0.4);
    
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.1);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  public playFailedSwapSound(): void {
    const oscillator = this.createOscillator(600, 'sine');
    const gain = this.createGain(0.5);
    
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5 * this.masterVolume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  }

  public playMatchSound(matchLength: number, isDirectMatch: boolean = true): void {
    if (matchLength === 3) {
      this.playThreeMatchSound(isDirectMatch);
    } else if (matchLength === 4) {
      this.playFourMatchSound();
    } else if (matchLength >= 5) {
      this.playFiveMatchSound();
    }
  }

  private playThreeMatchSound(isDirectMatch: boolean): void {
    const baseFreq = 523;
    const volume = isDirectMatch ? 0.6 : 0.8;
    const oscillator = this.createOscillator(baseFreq, 'sine');
    const gain = this.createGain(volume);
    
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * this.masterVolume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  private playFourMatchSound(): void {
    this.playBoopBOOOPSequence();
  }

  private playBoopBOOOPSequence(): void {
    const baseFreq = 330;
    const now = this.audioContext.currentTime;

    const osc1 = this.createOscillator(baseFreq, 'square');
    const gain1 = this.createGain(0.5);
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5 * this.masterVolume, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = this.createOscillator(baseFreq * 2, 'square');
    const gain2 = this.createGain(0.7);
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);

    const secondNoteStart = now + 0.18;
    gain2.gain.setValueAtTime(0, secondNoteStart);
    gain2.gain.linearRampToValueAtTime(0.7 * this.masterVolume, secondNoteStart + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, secondNoteStart + 0.25);

    osc2.start(secondNoteStart);
    osc2.stop(secondNoteStart + 0.25);
  }

  private playFiveMatchSound(): void {
    const baseFreq = 220;
    const now = this.audioContext.currentTime;
    const timings = [0, 0.2, 0.4];
    const frequencies = [baseFreq, baseFreq * 2, baseFreq * 4];
    const volumes = [0.5, 0.6, 0.8];

    timings.forEach((timing, index) => {
      const osc = this.createOscillator(frequencies[index], 'sawtooth');
      const gain = this.createGain(volumes[index]);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const startTime = now + timing;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volumes[index] * this.masterVolume, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }
}