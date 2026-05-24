// Simple Audio Service using Web Audio API
// Procedural sounds - no external files needed

class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private initialized = false;
    private muted = false;

    // Initialize on first user interaction (browser requirement)
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    }

    setMuted(muted: boolean) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 0.3;
        }
    }

    // Collision/damage sound - harsh noise burst
    playHit() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Power-up collect - bright ascending tone
    playPowerUp() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    // Sonic boom - deep whoosh with reverb feel
    playSonicBoom() {
        if (!this.ctx || !this.masterGain || this.muted) return;

        // Low bass hit
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(80, this.ctx.currentTime);
        bass.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.4);
        bassGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start();
        bass.stop(this.ctx.currentTime + 0.4);

        // High sweep
        const sweep = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweep.type = 'sawtooth';
        sweep.frequency.setValueAtTime(1000, this.ctx.currentTime);
        sweep.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        sweepGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        sweepGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        sweep.connect(sweepGain);
        sweepGain.connect(this.masterGain);
        sweep.start();
        sweep.stop(this.ctx.currentTime + 0.3);
    }

    // Shield activate - sci-fi shimmer
    playShield() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(605, this.ctx.currentTime); // Slight detune for shimmer

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.5);
        osc2.stop(this.ctx.currentTime + 0.5);
    }

    // UI click - simple blip
    playClick() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Level complete - triumphant chord
    playLevelComplete() {
        if (!this.ctx || !this.masterGain || this.muted) return;

        const notes = [523, 659, 784, 1047]; // C major chord ascending
        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.1);

            gain.gain.setValueAtTime(0, this.ctx!.currentTime);
            gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.1 + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(this.ctx!.currentTime + i * 0.1);
            osc.stop(this.ctx!.currentTime + i * 0.1 + 0.6);
        });
    }

    // Game over - descending sad tone
    playGameOver() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }

    // Shield deflects asteroid - electric zap
    playShieldDeflect() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // Shield about to expire - warning beep
    playShieldWarning() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // Warp engage - rising sweep
    playWarp() {
        if (!this.ctx || !this.masterGain || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    // Asteroid passes by - subtle whoosh
    playAsteroidPass() {
        if (!this.ctx || !this.masterGain || this.muted) return;

        // Create noise using oscillator trick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}

// Singleton export
export const audioService = new AudioService();
