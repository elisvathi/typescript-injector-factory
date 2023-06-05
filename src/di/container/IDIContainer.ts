import type { Class } from "../../utilityTypes";
import type { Token } from "./Token";

export interface IDIContainer {
	get<T>(key: Class<T>): T | undefined;
	get<T>(key: Token<T>): T | undefined;
	get<T>(key: string): T | undefined;

	set<T>(key: string | Token<T>, value: T): void;

	getAsync<T>(key: Class<T>): Promise<T | undefined>;
	getAsync<T>(key: Token<T>): Promise<T | undefined>;
	getAsync<T>(key: string): Promise<T | undefined>;
}
