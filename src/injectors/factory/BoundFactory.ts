import { Class, MethodOf } from "../../utilityTypes";
import { InjectorFactory } from "./injectorFactory";
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
		options?: { sequential: boolean }
	): Promise<TReturn> {
		// TODO: Fix return type
		const args = await this.factory.methodArgumentsAsync(
			this.context,
			cl,
			name,
			options
		);
		// TODO: Fix type
		return (cl as any)[name](...args);
	}

	public async constructAsync<T>(
		cl: Class<T>,
		options: { sequential: boolean }
	): Promise<T> {
		const proto = Object.create(cl.prototype);
		const properties = await this.factory.fieldsAsync(
			this.context,
			proto,
			options
		);
		const constructorArgs = await this.factory.methodArgumentsAsync(
			this.context,
			proto,
			undefined,
			options
		);
		return this.constructInstance(cl, constructorArgs, properties, proto);
	}

	private constructInstance<T extends Object, TArgs extends unknown[]>(
		cl: Class<T>,
		constructorArgs: TArgs,
		properties: Record<string, unknown>,
		proto: T
	): T {
		const applyProps = () => {
			Object.entries(properties).forEach(([key, value]) => {
				proto[key as keyof T] = value as T[keyof T];
			});
		};

		const applyConstructor = () => {
			const instance = new cl(...constructorArgs);
			Object.assign(proto, instance);
		};

		if (this.factory.options.injectPropertiesBeforeConstructor) {
			applyProps();
			applyConstructor();
		} else {
			applyProps();
			applyConstructor();
		}

		return proto;
	}
}
