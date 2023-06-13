import type { Class } from "../../utilityTypes";
import { componentExtractor } from "../decorators/component";
import { injectorFactory } from "../decorators/inject";
import { ServiceScope } from "../types";
import { IDIContainer } from "./IDIContainer";
import { Token } from "./Token";

export interface Initializable {
	init(): Promise<void>;
}

export function isInitializable(cl: Object): cl is Initializable {
	return (
		Object.getOwnPropertyNames(cl).includes("init") &&
		typeof (cl as any)["init"] == "function"
	);
}

class DiContainer implements IDIContainer {
	private static instance?: DiContainer;
	private serviceMap: Map<Class | string | Token, any> = new Map();
	private parent?: IDIContainer;
	private constructor() {}

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

	public getAsync<T>(key: Class<T>): Promise<T | undefined>;
	public getAsync<T>(key: Token<T>): Promise<T | undefined>;
	public getAsync<T>(key: string): Promise<T | undefined>;
	public async getAsync<T>(
		key: Class<T> | Token<T> | string
	): Promise<T | undefined> {
		if (typeof key === "function") {
			const cl = key as Class<T>;
			let scope =
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
					throw new Error(
						`
Cannot provide [${cl.name}] instance from this container!
A REQUEST scoped service cannot be provided by a top level container! M
ake sure you are not using [${cl.name}] inside a service that is Singleton Scoped (or does not have scope specified)
						`
					);
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
		if (typeof key === "function") {
			const cl = key as Class<T>;
			let scope =
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
					throw new Error(
						`
Cannot provide [${cl.name}] instance from this container!
A REQUEST scoped service cannot be provided by a top level container! M
ake sure you are not using [${cl.name}] inside a service that is Singleton Scoped (or does not have scope specified)
						`
					);
				}
				return this.constructAndSave(cl);
			} else {
				return injectorFactory.with(this).construct(cl);
			}
		} else {
			return this.serviceMap.get(key) || this.parent?.get(key);
		}
	}
}

export { component as Component } from "../decorators/component";
export { inject as Inject } from "../decorators/inject";
export const GlobalDiContainer = DiContainer.getInstance();
