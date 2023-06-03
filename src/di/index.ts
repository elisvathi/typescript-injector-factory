import { createClassDecorator } from "../decorators/class-decorator";
import { createInjectorFactory } from "../injectors";
import { Class } from "../utilityTypes";

export enum ServiceScope {
	SINGLETON,
	TRANSIENT,
	REQUEST,
}
const [service, extractors] = createClassDecorator(
	false,
	(_payload, options: { scope: ServiceScope }) => {
		return options;
	}
);

interface IContainer {
	get<T>(key: Class<T>): T | undefined;
	get<T>(key: Token<T>): T | undefined;
	get<T>(key: string): T | undefined;
	set<T>(key: string | Token<T>, value: T): void;
}

const factory = createInjectorFactory<IContainer>((p) => {
	return p.context.get(p.type) as any;
});

const inject = factory.createInjector(
	(payload, key?: string | Class | Token) => {
		return payload.context.get(key || payload.type);
	}
);

class Token<_T = unknown> {}

export function createToken<T>() {
	return new Token<T>();
}

class DiContainer implements IContainer {
	private static instance?: DiContainer;
	private map: Map<Class | string | Token, any> = new Map();
	private constructor() {}

	public set<T>(key: string | Token<T>, value: T): void {
		this.map.set(key, value);
	}

	public static getInstance(): DiContainer {
		if (!this.instance) {
			this.instance = new DiContainer();
		}
		return this.instance;
	}

	public get<T>(key: Class<T>): T | undefined;
	public get<T>(key: Token<T>): T | undefined;
	public get<T>(key: string): T | undefined;
	public get<T>(key: Class<T> | Token<T> | string): T | undefined {
		if (typeof key === "function") {
			const cl = key as Class<T>;
			let scope = extractors.getValue(cl)?.scope;
			if (!scope) {
				scope = ServiceScope.SINGLETON;
			}
			if (scope === ServiceScope.SINGLETON) {
				const constructed =
					this.map.get(cl) || factory.with(this).construct(cl);
				this.map.set(cl, constructed);
				return constructed;
			} else {
				return factory.with(this).construct(cl);
			}
		} else {
			return this.map.get(key);
		}
	}
}

export const Container = DiContainer.getInstance();
export const Service = service;
export const Inject = inject;
