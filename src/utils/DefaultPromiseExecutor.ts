import { PromiseExecutor } from "./PromiseExecutor";

export class DefaultPromiseExecutor implements PromiseExecutor {
	execute<T, TKey = unknown> (key: TKey, promiseTrigger: () => Promise<T>): Promise<T> {
		return promiseTrigger();
	}
}
