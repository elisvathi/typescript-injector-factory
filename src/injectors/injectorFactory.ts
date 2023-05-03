import "reflect-metadata";
type Class<T = unknown> = (new (...args: any[]) => T) & Function;
type CreateInjectorPayloadBase<
	TContext,
	TClass extends Record<string, unknown>
> = {
	context: TContext;
	type?: Class;
	target: Class;
	runtimeClassInstance: TClass;
	returnType?: Class;
	propertyKey: string | symbol | undefined;
};
type CreateInjectorPayloadField<
	TContext,
	TClass extends Record<string, unknown>
> = CreateInjectorPayloadBase<TContext, TClass>;
type CreateInjectorPayloadParameter<
	TContext,
	TClass extends Record<string, unknown>
> = CreateInjectorPayloadBase<TContext, TClass> & { parameterIndex: number };
type CreateInjectorPayload<TContext, TClass extends Record<string, unknown>> =
	| CreateInjectorPayloadField<TContext, TClass>
	| CreateInjectorPayloadParameter<TContext, TClass>;

type CreateInjectorFn<TContext, TReturn, TArgs extends unknown[] = []> = <
	TClass extends Record<string, unknown>
>(
	payload: CreateInjectorPayload<TContext, TClass>,
	...args: TArgs
) => TReturn;

type DefaultInjector<TContext> = <
	TReturn,
	TClass extends Record<string, unknown>
>(
	payload: CreateInjectorPayload<TContext, TClass>
) => TReturn | undefined;
type MethodOf<TClass> = keyof TClass; // TODO: fix this type

type InjectorDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (
	target: Record<string, unknown>,
	propertyKey?: string | symbol,
	parameterIndex?: number
) => void;
type Getter<
	TContext,
	T extends Record<string, unknown> = Record<string, unknown>
> = (ctx: TContext, instance: T) => unknown;
interface InjectorBuilder<TContext> {
	createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs>;
	with(ctx: TContext): InjectorResolver;
}
interface InjectorResolver {
	call<T extends Record<string, unknown>, M extends MethodOf<T>, TReturn>(
		cl: T,
		name: string
	): TReturn;
	callAsync<
		T extends Record<string, unknown>,
		M extends MethodOf<T>,
		TReturn
	>(
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

type InjectorFactoryOptions = {
	injectPropertiesBeforeConstructor: boolean;
};

class InjectorFactory<TContext> implements InjectorBuilder<TContext> {
	public constructor(
		private readonly fn?: DefaultInjector<TContext>,
		private readonly _options: InjectorFactoryOptions = {
			injectPropertiesBeforeConstructor: true,
		}
	) {
		Object.seal(this._options);
	}

	public get options(): InjectorFactoryOptions {
		return this._options;
	}

	private readonly propertyMap = new Map<
		Class,
		Map<string | symbol | undefined, Getter<TContext>>
	>();

	private readonly parameterMap = new Map<
		Class,
		Map<string | symbol | undefined, Array<Getter<TContext>>>
	>();

	private buildInjectorPayload<T extends Record<string, unknown>>(
		context: TContext,
		runtimeClassInstance: T,
		propertyKey: string | symbol | undefined,
		parameterIndex?: number
	): CreateInjectorPayload<TContext, T> {
		return {
			target: runtimeClassInstance.constructor as Class<T>,
			context,
			propertyKey,
			runtimeClassInstance,
			parameterIndex,
			// Type: //TODO
		};
	}

	public createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs> {
		const decorator =
			(...args: TArgs) =>
			(
				target: Record<string, unknown>,
				propertyKey?: string | symbol,
				propertyIndex?: number
			) => {
				const targetConstructor = propertyKey
					? target.constructor
					: target;
				if (propertyIndex || propertyIndex === 0) {
					const targetMap =
						this.parameterMap.get(target.constructor as Class) ||
						new Map<string | symbol, Array<Getter<TContext>>>();
					const methodData = targetMap.get(propertyKey) || [];
					const transformedFn = <T extends Record<string, unknown>>(
						context: TContext,
						runtimeClassInstance: T
					) =>
						fn(
							this.buildInjectorPayload(
								context,
								runtimeClassInstance,
								propertyKey,
								propertyIndex
							),
							...args
						);
					methodData[propertyIndex] = transformedFn;
					targetMap.set(propertyKey, methodData);
					this.parameterMap.set(
						targetConstructor as Class,
						targetMap
					);
				} else {
					const targetMap =
						this.propertyMap.get(target.constructor as Class) ||
						new Map<string | symbol, Getter<TContext>>();
					const transformedFn = <T extends Record<string, unknown>>(
						context: TContext,
						runtimeClassInstance: T
					) =>
						fn(
							this.buildInjectorPayload(
								context,
								runtimeClassInstance,
								propertyKey
							),
							...args
						);
					targetMap.set(propertyKey, transformedFn);
					this.propertyMap.set(targetConstructor as Class, targetMap);
				}
			};

		return decorator;
	}

	public methodArguments<T extends Record<string, unknown>>(
		ctx: TContext,
		runtimeClassInstance: T,
		methodName?: string | symbol
	): unknown[] {
		const parametersLength: number = this.getMethodParametersLength(
			runtimeClassInstance,
			methodName
		);
		const clMap = this.parameterMap
			.get(runtimeClassInstance.constructor as Class<T>)
			?.get(methodName);
		return new Array(parametersLength).fill(0).map((_parameter, index) => {
			const injector = clMap?.at(index);
			if (!injector) {
				return this.getDefalt(
					ctx,
					runtimeClassInstance,
					methodName,
					index
				);
			}

			return injector(ctx, runtimeClassInstance);
		});
	}

	private getMethodParametersLength<T extends Record<string, unknown>>(
		runtimeClassInstance: T,
		methodName?: string | symbol | undefined
	): number {
		const PARAM_TYPES_KEY = "design:paramtypes";
		const meta: Class[] = methodName
			? Reflect.getMetadata(
					PARAM_TYPES_KEY,
					runtimeClassInstance,
					methodName
			  )
			: Reflect.getMetadata(
					PARAM_TYPES_KEY,
					runtimeClassInstance.constructor
			  );
		return meta?.length || 0;
	}

	public fields<T extends Record<string, unknown>>(
		ctx: TContext,
		runtimeClassInstance: T
	): Record<string, unknown> {
		const clMap = this.propertyMap.get(
			runtimeClassInstance.constructor as Class<T>
		);
		const returnValue: Record<string | symbol, unknown> = {};
		clMap?.forEach((fn, key) => {
			if (key) {
				returnValue[key] = fn(ctx, runtimeClassInstance);
			}
		});
		return returnValue;
	}

	public async methodArgumentsAsync<T extends Record<string, unknown>>(
		context: TContext,
		runtimeClassInstance: T,
		methodName?: string | symbol,
		options?: { sequential: boolean }
	): Promise<unknown[]> {
		const parametersLength: number = this.getMethodParametersLength(
			runtimeClassInstance,
			methodName
		);
		const clMap = this.parameterMap
			.get(runtimeClassInstance.constructor as Class<T>)
			?.get(methodName);
		if (options && options.sequential) {
			const args: unknown[] = [];
			for (let i = 0; i < parametersLength; i++) {
				const injector = clMap?.at(i);
				if (!injector) {
					args.push(
						await this.getDefalt(
							context,
							runtimeClassInstance,
							methodName,
							i
						)
					);
				} else {
					args.push(injector(context, runtimeClassInstance));
				}
			}
			return args;
		} else {
			return await Promise.all(
				new Array(parametersLength)
					.fill(0)
					.map(async (_parameter, index) => {
						const injector = clMap?.at(index);
						if (!injector) {
							return await this.getDefalt(
								context,
								runtimeClassInstance,
								methodName,
								index
							);
						}

						return await injector(context, runtimeClassInstance);
					})
			);
		}
	}
	public async fieldsAsync<T extends Record<string, unknown>>(
		context: TContext,
		runtimeClassInstance: T,
		options?: { sequential: boolean }
	) {
		const clMap = this.propertyMap.get(
			runtimeClassInstance.constructor as Class<T>
		);
		const returnValue: Record<string | symbol, unknown> = {};
		if (options && options.sequential) {
			for (const [key, fn] of (
				clMap || new Map<string, Getter<TContext>>()
			).entries()) {
				if (key) {
					returnValue[key] = await fn(context, runtimeClassInstance);
				}
			}
			return returnValue;
		} else {
			await Promise.all(
				Array.from(
					(clMap || new Map<string, Getter<TContext>>()).entries()
				).map(async ([key, fn]) => {
					if (key) {
						returnValue[key] = await fn(
							context,
							runtimeClassInstance
						);
					}
				})
			);
		}
		return returnValue;
	}

	private getDefalt<T extends Record<string, unknown>, TReturn>(
		ctx: TContext,
		runtimeClassInstance: T,
		name?: string | symbol,
		index?: number
	): TReturn | undefined {
		if (!this.fn) {
			name = name || "constructor";
			console.log(this.parameterMap);
			if (Number.isFinite(index)) {
				throw new Error(
					`No injector for the argument number [${index}] on method [${String(
						name
					)}] for class [${
						runtimeClassInstance.constructor.name
					}] and the default injector is not specified!`
				);
			} else {
				throw new Error(
					`No injector for field [${String(name)}] on the class [${
						runtimeClassInstance.constructor.name
					}] and the default injector is not specified!`
				);
			}
		}

		return this.fn(
			this.buildInjectorPayload(ctx, runtimeClassInstance, name, index)
		);
	}

	public with(ctx: TContext): InjectorResolver {
		return new BoundFactory<TContext>(this, ctx);
	}
}
class BoundFactory<TContext> implements InjectorResolver {
	public constructor(
		private readonly factory: InjectorFactory<TContext>,
		private readonly context: TContext
	) {}

	public call<
		T extends Record<string, unknown>,
		M extends MethodOf<T>,
		TReturn
	>(cl: T, name: string): TReturn {
		// TODO: Fix return type
		const args = this.factory.methodArguments(this.context, cl, name);
		// TODO: Fix type
		return (cl as any)[name](...args);
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

	public construct<T>(cl: Class<T>): T {
		const proto = Object.create(cl.prototype);
		const properties = this.factory.fields(this.context, proto);
		const constructorArgs = this.factory.methodArguments(
			this.context,
			proto
		);
		return this.constructInstance(cl, constructorArgs, properties, proto);
	}

	public async callAsync<
		T extends Record<string, unknown>,
		M extends keyof T,
		TReturn
	>(
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
}
export function createInjectorFactory<TContext>(
	defaultInjector?: DefaultInjector<TContext>,
	options: InjectorFactoryOptions = {
		injectPropertiesBeforeConstructor: true,
	}
): InjectorBuilder<TContext> {
	return new InjectorFactory<TContext>(defaultInjector, options);
}
