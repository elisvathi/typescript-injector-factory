export interface PromiseExecutor {
	execute<T, TKey = unknown> (key: TKey, promiseTrigger: () => Promise<T>): Promise<T>;
}

