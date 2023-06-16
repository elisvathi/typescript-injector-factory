/**
 * Use this with caution.
 * This class persists promises and their results so it might result in leaks.
 * You have been warned!
 */
export class PromiseLock {
	private keymap: Map<unknown, Promise<unknown>> = new Map();
	public async lock<T>(
		key: unknown,
		promiseTrigger: () => Promise<T>
	): Promise<T> {
		if (this.keymap.has(key)) {
			return this.keymap.get(key) as Promise<T>;
		} else {
			const promise = promiseTrigger();
			this.keymap.set(key, promiseTrigger());
			return promise;
		}
	}

	public clear(): void {
		this.keymap = new Map();
	}
}
