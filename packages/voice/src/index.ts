/**
 * @package @nattaponra/roboclaw-voice
 * @description Voice interaction (STT/TTS) for RoboClaw using Whisper and Piper
 */

export const VERSION = "0.1.0";

// Export interfaces
export * from "./interfaces/index.js";

// Export drivers
export * from "./drivers/index.js";

// Export factory
export * from "./factory/index.js";

// Export voice manager
export { VoiceManager, type VoiceManagerConfig } from "./voice-manager.js";
