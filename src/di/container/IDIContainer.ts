import type { Class } from "../../utilityTypes";
import { ServiceScope } from "../types";
import type { Token } from "./Token";

export type SyncResolver = <T>(context: IDIContainer) => T;
export type AsyncResolver = <T>(context: IDIContainer) => Promise<T>;

export interface IResolverContainer {
	getResolver<T>(
		key: Class<T> | Token<T> | string
	): { resolver: SyncResolver; scope: ServiceScope } | undefined;
	getAsyncResolver<T>(
		key: Class<T> | Token<T> | string
	): { resolver: AsyncResolver; scope: ServiceScope } | undefined;
}

export interface IDIContainer {
	get<T>(key: Class<T>): T | undefined;
	get<T>(key: Token<T>): T | undefined;
	get<T>(key: string): T | undefined;

	set<T>(key: string | Token<T>, value: T): void;

	getAsync<T>(key: Class<T>): Promise<T | undefined>;
	getAsync<T>(key: Token<T>): Promise<T | undefined>;
	getAsync<T>(key: string): Promise<T | undefined>;

	setAsyncResolver<T>(
		key: Class<T>,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void;
	setAsyncResolver<T>(
		key: Token<T>,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void;
	setAsyncResolver(
		key: string,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void;

	setResolver<T>(
		key: Class<T>,
		resolver: SyncResolver,
		scope: ServiceScope
	): void;
	setResolver<T>(
		key: Token<T>,
		resolver: SyncResolver,
		scope: ServiceScope
	): void;
	setResolver(key: string, resolver: SyncResolver, scope: ServiceScope): void;
}
