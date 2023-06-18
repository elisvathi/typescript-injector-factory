import { PromiseExecutor } from "./PromiseExecutor";

export class LockablePromiseExecutor<TKey = unknown> implements PromiseExecutor {

	private keymap: Map<unknown, Promise<unknown>> = new Map();
	execute<T, TKey = unknown> (key: TKey, promiseTrigger: () => Promise<T>): Promise<T> {
		if (this.keymap.has(key)) {
			return this.keymap.get(key) as Promise<T>;
		} else {
			const promise = promiseTrigger();
			this.keymap.set(key, promiseTrigger());
			return promise;
		}
	}
	public clear (): void {
		this.keymap = new Map();
	}
}
