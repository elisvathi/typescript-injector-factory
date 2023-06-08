import type { Class, MethodOf } from "../../utilityTypes";

export interface InjectorResolver {
	call<T extends Object, M extends MethodOf<T>, TReturn>(
		cl: T,
		name: string
	): TReturn;
	callAsync<T extends Object, M extends MethodOf<T>, TReturn>(
		cl: T,
		name: string,
		options?: {
			sequential?: boolean;
		}
	): Promise<TReturn>;
	construct<T>(cl: Class<T>): T;
	constructAsync<T>(
		cl: Class<T>,
		options?: { sequential: boolean }
	): Promise<T>;
}
