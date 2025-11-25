/**
 * Telegram notification helper
 * Sends notifications to the standalone claude-telegram-bridge service
 */

const BRIDGE_URL = 'http://localhost:3456';

export type NotifyPriority = 'info' | 'success' | 'warning' | 'error' | 'question';

export async function notify(
  message: string,
  priority: NotifyPriority = 'info'
): Promise<boolean> {
  try {
    const response = await fetch(`${BRIDGE_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, priority }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      console.log(`Telegram bridge error: ${error.error}`);
      return false;
    }

    return true;
  } catch (error) {
    // Bridge not running or not available - fail silently
    return false;
  }
}

// Convenience wrappers
export const notifySuccess = (message: string) => notify(message, 'success');
export const notifyError = (message: string) => notify(message, 'error');
export const notifyWarning = (message: string) => notify(message, 'warning');
export const notifyQuestion = (message: string) => notify(message, 'question');
