import type { Class } from "../../utilityTypes";
import { componentExtractor } from "../decorators/component";
import { injectorFactory } from "../decorators/inject";
import { ServiceScope } from "../types";
import {
	AsyncResolver,
	IDIContainer,
	IResolverContainer,
	ServiceRegistration,
	SyncResolver,
} from "./IDIContainer";
import { Token } from "./Token";

export interface Initializable {
	init(): Promise<void>;
}

const scopeMismatchError = (key: Class | Token | string) => {
	const message = `Cannot provide [${key}] instance from this container!
A REQUEST scoped service cannot be provided by a top level container! M
ake sure you are not using [${key}] inside a service that is Singleton Scoped (or does not have scope specified)`;
	throw new Error(message);
};

export function isInitializable(cl: Object): cl is Initializable {
	return (
		Object.getOwnPropertyNames(Object.getPrototypeOf(cl)).includes(
			"init"
		) && typeof (cl as any)["init"] == "function"
	);
}

class DiContainer implements IDIContainer, IResolverContainer {
	private static instance?: DiContainer;
	private serviceMap: Map<Class | string | Token, any> = new Map();
	private parent?: IDIContainer & IResolverContainer;
	private syncResolvers: Map<
		Class | string | Token,
		{ resolver: SyncResolver; scope: ServiceScope }
	> = new Map();
	private asyncResolvers: Map<
		Class | string | Token,
		{ resolver: AsyncResolver; scope: ServiceScope }
	> = new Map();

	public getResolver<T>(
		key: string | Class<T> | Token<T>
	): { resolver: SyncResolver; scope: ServiceScope } | undefined {
		if (this.isChild) {
			return this.parent?.getResolver(key);
		}
		return this.syncResolvers.get(key);
	}

	public getAsyncResolver<T>(
		key: string | Class<T> | Token<T>
	): { resolver: AsyncResolver; scope: ServiceScope } | undefined {
		if (this.isChild) {
			return this.parent?.getAsyncResolver(key);
		}
		return this.syncResolvers.get(key);
	}

	public set<T>(key: string | Token<T>, value: T): void {
		this.serviceMap.set(key, value);
	}

	private get isChild(): boolean {
		return !!this.parent;
	}

	public createChildContainer(): IDIContainer {
		const child = new DiContainer();
		child.parent = this;
		return child;
	}

	public static getInstance(): DiContainer {
		if (!this.instance) {
			this.instance = new DiContainer();
		}
		return this.instance;
	}

	public getAsync<T>(key: Class<T>): Promise<T | undefined>;
	public getAsync<T>(key: Token<T>): Promise<T | undefined>;
	public getAsync<T>(key: string): Promise<T | undefined>;
	public async getAsync<T>(
		key: Class<T> | Token<T> | string
	): Promise<T | undefined> {
		const resolver = this.getAsyncResolver(key);
		if (resolver) {
			return this.getAndSaveFromResolverAsync(
				key,
				resolver.resolver,
				resolver.scope
			);
		}
		if (typeof key === "function") {
			const cl = key as Class<T>;
			const scope =
				componentExtractor.getValue(cl)?.options?.scope ||
				ServiceScope.SINGLETON;
			if (scope === ServiceScope.SINGLETON) {
				if (this.isChild) {
					return await this.parent?.getAsync(cl);
				}
				return await this.constructAndSaveAsync(cl);
			}
			if (scope === ServiceScope.REQUEST) {
				if (!this.isChild) {
					scopeMismatchError(key);
				}
				return await this.constructAndSaveAsync(cl);
			} else {
				return injectorFactory.with(this).constructAsync(cl);
			}
		} else {
			return (
				this.serviceMap.get(key) || (await this.parent?.getAsync(key))
			);
		}
	}

	public get<T>(key: Class<T>): T | undefined;
	public get<T>(key: Token<T>): T | undefined;
	public get<T>(key: string): T | undefined;
	public get<T>(key: Class<T> | Token<T> | string): T | undefined {
		const resolver = this.getResolver(key);
		if (resolver) {
			return this.getAndSaveFromResolverSync(
				key,
				resolver.resolver,
				resolver.scope
			);
		}
		if (typeof key === "function") {
			const cl = key as Class<T>;
			const scope =
				componentExtractor.getValue(cl)?.options?.scope ||
				ServiceScope.SINGLETON;
			if (scope === ServiceScope.SINGLETON) {
				if (this.isChild) {
					return this.parent?.get(cl);
				}
				return this.constructAndSave(cl);
			}
			if (scope === ServiceScope.REQUEST) {
				if (!this.isChild) {
					scopeMismatchError(key);
				}
				return this.constructAndSave(cl);
			} else {
				return injectorFactory.with(this).construct(cl);
			}
		} else {
			return this.serviceMap.get(key) || this.parent?.get(key);
		}
	}

	public setAsyncResolver<T>(
		key: Class<T>,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void;
	public setAsyncResolver<T>(
		key: Token<T>,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void;
	public setAsyncResolver(
		key: string,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void;
	public setAsyncResolver(
		key: Class | Token | string,
		resolver: AsyncResolver,
		scope: ServiceScope
	): void {
		if (this.isChild) {
			this.parent?.setAsyncResolver(key, resolver, scope);
		} else {
			this.asyncResolvers.set(key, {
				resolver,
				scope,
			});
		}
	}

	public setResolver<T>(
		key: Class<T>,
		resolver: SyncResolver,
		scope: ServiceScope
	): void;
	public setResolver<T>(
		key: Token<T>,
		resolver: SyncResolver,
		scope: ServiceScope
	): void;
	public setResolver(
		key: string,
		resolver: SyncResolver,
		scope: ServiceScope
	): void;
	public setResolver(
		key: Class | Token | string,
		resolver: SyncResolver,
		scope: ServiceScope
	): void {
		if (this.isChild) {
			this.parent?.setResolver(key, resolver, scope);
		} else {
			this.syncResolvers.set(key, {
				resolver,
				scope,
			});
		}
	}

	private async getAndSaveFromResolverAsync<T>(
		key: Class<T> | Token<T> | string,
		resolver: AsyncResolver,
		scope: ServiceScope
	): Promise<T | undefined> {
		switch (scope) {
		case ServiceScope.TRANSIENT: {
			return await resolver<T>(this);
		}
		case ServiceScope.SINGLETON: {
			if (this.isChild) {
				return await this.parent?.getAsync(key);
			} else {
				const existing = this.serviceMap.get(key);
				if (existing) {
					return existing;
				}
				const value = await resolver<T>(this);
				this.serviceMap.set(key, value);
				return value;
			}
		}
		case ServiceScope.REQUEST: {
			if (this.isChild) {
				const existing = this.serviceMap.get(key);
				if (existing) {
					return existing;
				}
				const value = await resolver<T>(this);
				this.serviceMap.set(key, value);
				return value;
			} else {
				scopeMismatchError(key);
			}
		}
		}
	}

	private getAndSaveFromResolverSync<T>(
		key: Class<T> | Token<T> | string,
		resolver: SyncResolver,
		scope: ServiceScope
	): T | undefined {
		switch (scope) {
		case ServiceScope.TRANSIENT: {
			return resolver<T>(this);
		}
		case ServiceScope.SINGLETON: {
			if (this.isChild) {
				return this.parent?.get(key);
			} else {
				const existing = this.serviceMap.get(key);
				if (existing) {
					return existing;
				}
				const value = resolver<T>(this);
				this.serviceMap.set(key, value);
				return value;
			}
		}
		case ServiceScope.REQUEST: {
			if (this.isChild) {
				const existing = this.serviceMap.get(key);
				if (existing) {
					return existing;
				}
				const value = resolver<T>(this);
				this.serviceMap.set(key, value);
				return value;
			} else {
				scopeMismatchError(key);
			}
		}
		}
	}

	private async constructAndSaveAsync<T>(key: Class<T>): Promise<T> {
		const constructed =
			this.serviceMap.get(key) ||
			(await injectorFactory.with(this).constructAsync(key));
		if (isInitializable(constructed)) {
			await constructed.init();
		}
		this.serviceMap.set(key, constructed);
		return constructed;
	}

	private constructAndSave<T>(key: Class<T>): T {
		const constructed =
			this.serviceMap.get(key) ||
			injectorFactory.with(this).construct(key);
		this.serviceMap.set(key, constructed);
		return constructed;
	}

	public listServices(scope: ServiceScope): Array<ServiceRegistration> {
		type Key = Class | Token | string;
		const map: Map<Key, ServiceRegistration> = new Map();
		componentExtractor
			.getClasses()
			.map((cl) => {
				const key = componentExtractor.getValue(cl)?.options?.key || cl;
				const scope =
					componentExtractor.getValue(cl)?.options?.scope ||
					ServiceScope.SINGLETON;
				return {
					key,
					scope,
				};
			})
			.filter(service=>service.scope === scope)
			.forEach(service=>map.set(service.key, service));
		Array.from( this.syncResolvers.entries())
			.map(([key, value]) => {
				return {
					key,
					scope: value.scope,
				};
			})
			.filter(service=>service.scope === scope)
			.forEach(service=>map.set(service.key, service));
		Array.from( this.syncResolvers.entries())
			.map(([key, value]) => {
				return {
					key,
					scope: value.scope,
				};
			})
			.filter(service=>service.scope === scope)
			.forEach(service=>map.set(service.key, service));
		return Array.from(map.values());
	}
}

export { component as Component } from "../decorators/component";
export { inject as Inject } from "../decorators/inject";
export const GlobalDiContainer: IDIContainer = DiContainer.getInstance();
