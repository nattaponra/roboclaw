import { Command } from 'commander';
import { RobotAgent, loadConfig } from '@nattaponra/roboclaw-core';
import { TUI, Container, Text, Editor, Markdown, Spacer, ProcessTerminal, type MarkdownTheme } from '@mariozechner/pi-tui';
import chalk from 'chalk';

// Markdown theme
const markdownTheme: MarkdownTheme = {
	heading: (s) => chalk.bold.cyan(s),
	link: (s) => chalk.blue.underline(s),
	linkUrl: (s) => chalk.gray(s),
	code: (s) => chalk.yellow(s),
	codeBlock: (s) => chalk.gray(s),
	codeBlockBorder: (s) => chalk.dim(s),
	quote: (s) => chalk.italic.gray(s),
	quoteBorder: (_s) => chalk.dim('│'),
	hr: (s) => chalk.dim(s),
	listBullet: (s) => chalk.cyan(s),
	bold: (s) => chalk.bold(s),
	italic: (s) => chalk.italic(s),
	strikethrough: (s) => chalk.strikethrough(s),
	underline: (s) => chalk.underline(s),
};

export function registerChatCommand(program: Command): void {
	program
		.command('chat')
		.description('Start interactive chat with the robot (TUI)')
		.option('-c, --config <path>', 'Path to config file', './config.yaml')
		.action(async (options) => {
			let robot: RobotAgent | null = null;
			let tui: TUI | null = null;

			try {
				// Load config (silently for clean TUI start)
				const config = await loadConfig(options.config);

				// Create robot
				robot = new RobotAgent(config);
				await robot.start();

				// Messages array
				const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

				// Create terminal and TUI
				const terminal = new ProcessTerminal();
				tui = new TUI(terminal);

				// Main container
				const container = new Container();

				// Title
				const title = new Text(
					chalk.bold(`🤖 ${config.robot.name} - ${config.llm.provider}/${config.llm.model}`)
				);
				container.addChild(title);
				container.addChild(new Spacer(1));

				// Messages container
				const messagesContainer = new Container();

				const updateMessages = () => {
					// Clear messages
					while (messagesContainer['children']?.length > 0) {
						messagesContainer.removeChild(messagesContainer['children'][0]);
					}

					// Add latest messages (last 10)
					for (const msg of messages.slice(-10)) {
						const icon = msg.role === 'user' ? '👤' : '🤖';
						const markdown = new Markdown(
							`**${icon}** ${msg.content}`,
							1,  // paddingX
							0,  // paddingY
							markdownTheme
						);
						messagesContainer.addChild(markdown);
						messagesContainer.addChild(new Spacer(1));
					}
					
					tui?.requestRender();
				};

				container.addChild(messagesContainer);

				// Editor theme
				const editorTheme = {
					borderColor: (s: string) => chalk.gray(s),
					selectList: {
						selectedPrefix: (s: string) => chalk.cyan(s),
						selectedText: (s: string) => chalk.cyan(s),
						description: (s: string) => chalk.gray(s),
						scrollInfo: (s: string) => chalk.gray(s),
						noMatch: (s: string) => chalk.red(s),
					},
				};

				// Create promise that resolves when user exits
				let resolveExit: () => void;
				const exitPromise = new Promise<void>((resolve) => {
					resolveExit = resolve;
				});

				// Input editor
				const editor = new Editor(tui, editorTheme);
				editor.onSubmit = async (text: string) => {
					if (!text.trim()) return;

					// Handle commands
					if (text.startsWith('/')) {
						const cmd = text.substring(1).toLowerCase();
						
						if (cmd === 'exit' || cmd === 'quit') {
							resolveExit();
							return;
						}

						if (cmd === 'status') {
							messages.push({
								role: 'assistant',
								content: `Status: ${robot!.status}, Messages: ${robot!.memory.conversation.getMessageCount()}`,
							});
							updateMessages();
							return;
						}

						if (cmd === 'clear') {
							messages.length = 0;
							updateMessages();
							return;
						}

						// Unknown command
						messages.push({
							role: 'assistant',
							content: `Unknown command: ${cmd}\n\nAvailable: /status, /clear, /exit`,
						});
						updateMessages();
						return;
					}

					// Add user message
					messages.push({ role: 'user', content: text });
					updateMessages();

					// Show thinking
					messages.push({ role: 'assistant', content: '_Thinking..._' });
					updateMessages();

					try {
						// Get AI response
						const response = await robot!.chat(text);

						// Replace thinking with response
						messages.pop();
						messages.push({ role: 'assistant', content: response });
						updateMessages();
					} catch (error) {
						messages.pop();
						messages.push({
							role: 'assistant',
							content: `❌ Error: ${(error as Error).message}`,
						});
						updateMessages();
					}
				};
				
				container.addChild(editor);

				// Add container to TUI
				tui.addChild(container);
				
				// Welcome message
				messages.push({
					role: 'assistant',
					content: `Welcome! I'm ${config.robot.name}. How can I help you?\n\nCommands: /status, /clear, /exit\n\nPress Enter to submit, Shift+Enter for new line.`,
				});
				updateMessages();

				// Start TUI
				tui.start();
				
				// Handle Ctrl+C
				process.on('SIGINT', () => {
					resolveExit();
				});
				
				// Wait until user exits
				await exitPromise;
			} catch (error) {
				console.error('❌ Error:', (error as Error).message);
				process.exit(1);
			} finally {
				// Cleanup
				if (tui) {
					tui.stop();
				}
				if (robot) {
					await robot.stop();
				}
			}
		});
}
