import { type Class, type MethodOf } from "../../utilityTypes";
import { type InjectorFactory } from "./injectorFactory";
import type { InjectorResolver } from "./InjectorResolver";

/**
 * Given a factory and a context this class has methods to construct classes and / or call methods on given instances
 */
export class BoundFactory<TContext> implements InjectorResolver {
	public constructor(
		private readonly factory: InjectorFactory<TContext>,
		private readonly context: TContext
	) {}

	/**
	 * Call a method on a given instance
	 * @param cl
	 * @param name
	 */
	public call<T extends Object, M extends MethodOf<T>, TReturn>(
		cl: T,
		name: string
	): TReturn {
		// TODO: Fix return type
		const args = this.factory.methodArguments(this.context, cl, name);
		// TODO: Fix type
		return (cl as any)[name](...args);
	}

	/**
	 * Construct an instance of a given class
	 * @param cl
	 */
	public construct<T>(cl: Class<T>): T {
		const proto = Object.create(cl.prototype);
		const properties = this.factory.fields(this.context, proto);
		const constructorArgs = this.factory.methodArguments(
			this.context,
			proto,
			undefined
		);
		return this.constructInstance(cl, constructorArgs, properties, proto);
	}

	public async callAsync<T extends Object, M extends keyof T, TReturn>(
		cl: T,
		name: string,
	): Promise<TReturn> {
		// TODO: Fix return type
		const args = await this.factory.methodArgumentsAsync(
			this.context,
			cl,
			name,
		);
		// TODO: Fix type
		return (cl as any)[name](...args);
	}

	public async constructAsync<T>(
		cl: Class<T>,
	): Promise<T> {
		const proto = Object.create(cl.prototype);
		const properties = await this.factory.fieldsAsync(
			this.context,
			proto,
		);
		const constructorArgs = await this.factory.methodArgumentsAsync(
			this.context,
			proto,
			undefined,
		);
		return this.constructInstance(cl, constructorArgs, properties, proto);
	}

	private constructInstance<T extends Object, TArgs extends unknown[]>(
		cl: Class<T>,
		constructorArgs: TArgs,
		properties: Record<string, unknown>,
		proto: T
	): T {
		const applyProps = (): void => {
			Object.entries(properties).forEach(([key, value]) => {
				proto[key as keyof T] = value as T[keyof T];
			});
		};

		const applyConstructor = () => {
			const instance = new cl(...constructorArgs);
			Object.assign(proto, instance);
		};

		applyConstructor();
		applyProps();

		return proto;
	}
}
