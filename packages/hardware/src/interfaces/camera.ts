/**
 * Camera driver interface
 */

export interface CameraConfig {
	type: 'picamera' | 'usb' | 'mock';
	resolution: [number, number];
	fps: number;
}

export interface CameraDriver {
	/**
	 * Initialize the camera
	 */
	initialize(config: CameraConfig): Promise<void>;

	/**
	 * Capture a single image
	 * @returns Image buffer (JPEG format)
	 */
	captureImage(): Promise<Buffer>;

	/**
	 * Start streaming video frames
	 * @returns Async iterator of image buffers
	 */
	startStreaming(): AsyncIterableIterator<Buffer>;

	/**
	 * Stop streaming
	 */
	stopStreaming(): Promise<void>;

	/**
	 * Check if camera is ready
	 */
	isReady(): boolean;

	/**
	 * Close the camera
	 */
	close(): Promise<void>;
}
