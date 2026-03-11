import type { STTDriver, STTConfig } from "../interfaces/stt.js";
import type { TTSDriver, TTSConfig } from "../interfaces/tts.js";
import type {
	AudioRecorder,
	AudioPlayer,
	AudioConfig,
} from "../interfaces/audio.js";

// STT drivers
import { MockSTTDriver } from "../drivers/stt/mock-stt.js";
import { WhisperSTTDriver } from "../drivers/stt/whisper-stt.js";

// TTS drivers
import { MockTTSDriver } from "../drivers/tts/mock-tts.js";
import { PiperTTSDriver } from "../drivers/tts/piper-tts.js";

// Audio drivers
import {
	MockAudioRecorder,
	MockAudioPlayer,
} from "../drivers/audio/mock-audio.js";

/**
 * Factory for creating voice drivers
 */
export class VoiceFactory {
	/**
	 * Create an STT driver instance
	 */
	static createSTT(config: STTConfig): STTDriver {
		switch (config.engine) {
			case "mock":
				return new MockSTTDriver();
			case "whisper":
				return new WhisperSTTDriver();
			default:
				throw new Error(`Unknown STT engine: ${config.engine}`);
		}
	}

	/**
	 * Create a TTS driver instance
	 */
	static createTTS(config: TTSConfig): TTSDriver {
		switch (config.engine) {
			case "mock":
				return new MockTTSDriver();
			case "piper":
				return new PiperTTSDriver();
			default:
				throw new Error(`Unknown TTS engine: ${config.engine}`);
		}
	}

	/**
	 * Create an audio recorder instance
	 */
	static createRecorder(config: AudioConfig): AudioRecorder {
		switch (config.device) {
			case "mock":
				return new MockAudioRecorder();
			case "alsa":
			case "pulseaudio":
				// Real audio drivers would be implemented here
				throw new Error(
					`Real audio drivers not yet implemented. Use 'mock' device for testing.`,
				);
			default:
				throw new Error(`Unknown audio device: ${config.device}`);
		}
	}

	/**
	 * Create an audio player instance
	 */
	static createPlayer(config: AudioConfig): AudioPlayer {
		switch (config.device) {
			case "mock":
				return new MockAudioPlayer();
			case "alsa":
			case "pulseaudio":
				// Real audio drivers would be implemented here
				throw new Error(
					`Real audio players not yet implemented. Use 'mock' device for testing.`,
				);
			default:
				throw new Error(`Unknown audio device: ${config.device}`);
		}
	}

	/**
	 * Create and initialize an STT driver
	 */
	static async createAndInitializeSTT(config: STTConfig): Promise<STTDriver> {
		const driver = VoiceFactory.createSTT(config);
		await driver.initialize(config);
		return driver;
	}

	/**
	 * Create and initialize a TTS driver
	 */
	static async createAndInitializeTTS(config: TTSConfig): Promise<TTSDriver> {
		const driver = VoiceFactory.createTTS(config);
		await driver.initialize(config);
		return driver;
	}

	/**
	 * Create and initialize an audio recorder
	 */
	static async createAndInitializeRecorder(
		config: AudioConfig,
	): Promise<AudioRecorder> {
		const recorder = VoiceFactory.createRecorder(config);
		await recorder.initialize(config);
		return recorder;
	}

	/**
	 * Create and initialize an audio player
	 */
	static async createAndInitializePlayer(
		config: AudioConfig,
	): Promise<AudioPlayer> {
		const player = VoiceFactory.createPlayer(config);
		await player.initialize(config);
		return player;
	}
}
