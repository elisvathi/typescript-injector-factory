import "reflect-metadata";
interface Class<T = unknown> extends Function {
	new (...args: any[]): T;
}
type CreateInjectorPayloadBase<TContext, TClass extends Object> = {
	context: TContext;
	type?: Class;
	target: Class;
	runtimeClassInstance: TClass;
	returnType?: Class;
	propertyKey: string | symbol | undefined;
};
type CreateInjectorPayloadField<
	TContext,
	TClass extends Object
> = CreateInjectorPayloadBase<TContext, TClass>;
type CreateInjectorPayloadParameter<
	TContext,
	TClass extends Object
> = CreateInjectorPayloadBase<TContext, TClass> & { parameterIndex: number };
type CreateInjectorPayload<TContext, TClass extends Object> =
	| CreateInjectorPayloadField<TContext, TClass>
	| CreateInjectorPayloadParameter<TContext, TClass>;

type CreateInjectorFn<TContext, TReturn, TArgs extends unknown[] = []> = <
	TClass extends Object
>(
	payload: CreateInjectorPayload<TContext, TClass>,
	...args: TArgs
) => TReturn;

type DefaultInjector<TContext> = <TReturn, TClass extends Object>(
	payload: CreateInjectorPayload<TContext, TClass>
) => TReturn | undefined;
type MethodOf<TClass> = keyof TClass; // TODO: fix this type

type InjectorDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (
	target: Object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) => void;
type Getter<TContext, T extends Object = Object> = (
	ctx: TContext,
	instance: T
) => unknown;
interface InjectorBuilder<TContext> {
	createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs>;
	with(ctx: TContext): InjectorResolver<TContext>;
}
interface InjectorResolver<TContext> {
	call<T extends Object, M extends MethodOf<T>, TReturn>(
		cl: T,
		name: string
	): TReturn;
	construct<T>(cl: Class<T>): T;
}

type InjectorFactoryOptions = {
	injectPropertiesBeforeConstructor: boolean;
};

class InjectorFactory<TContext> implements InjectorBuilder<TContext> {
	public constructor(
		private fn?: DefaultInjector<TContext>,
		private _options: InjectorFactoryOptions = {
			injectPropertiesBeforeConstructor: true,
		}
	) {
		Object.seal(this._options);
	}
	public get options(): InjectorFactoryOptions {
		return this._options;
	}
	private propertyMap: Map<
		Class,
		Map<string | symbol | undefined, Getter<TContext>>
	> = new Map();
	private parameterMap: Map<
		Class,
		Map<string | symbol | undefined, Array<Getter<TContext>>>
	> = new Map();

	private buildInjectorPayload<T extends Object>(
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
			// type: //TODO
		};
	}
	public createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs> {
		const decorator =
			(...args: TArgs) =>
			(
				target: Object,
				propertyKey?: string | symbol,
				propertyIndex?: number
			) => {
				const targetConstructor = propertyKey
					? target.constructor
					: target;
				const isParameterDecorator =
					!!propertyIndex || propertyIndex === 0;
				if (isParameterDecorator) {
					const targetMap =
						this.parameterMap.get(target.constructor as Class) ||
						new Map<string | symbol, Array<Getter<TContext>>>();
					const methodData = targetMap.get(propertyKey) || [];
					const transformedFn = <T extends Object>(
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
					const transformedFn = <T extends Object>(
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
	public methodArguments<T extends Object>(
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
	getMethodParametersLength<T extends Object>(
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

	public fields<T extends Object>(
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

	private getDefalt<T extends Object, TReturn>(
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

	public with(ctx: TContext): InjectorResolver<TContext> {
		return new BoundFactory<TContext>(this, ctx);
	}
}
class BoundFactory<TContext> implements InjectorResolver<TContext> {
	public constructor(
		private factory: InjectorFactory<TContext>,
		private context: TContext
	) {}

	public call<T extends Object, M extends MethodOf<T>, TReturn>(
		cl: T,
		name: string
	): TReturn {
		// TODO: Fix return type
		const args = this.factory.methodArguments(this.context, cl, name);
		//TODO: Fix type
		return ((cl as any)[name] as any)(...args);
	}
	public construct<T>(cl: Class<T>): T {
		const proto = Object.create(cl.prototype);
		const properties = this.factory.fields(this.context, proto);
		const constructorArgs = this.factory.methodArguments(
			this.context,
			proto
		);
		const applyProps = () => {
			Object.entries(properties).forEach(([key, value]) => {
				proto[key] = value;
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
export function createInjectorFactory<TContext>(
	defaultInjector?: DefaultInjector<TContext>,
	options: InjectorFactoryOptions = {
		injectPropertiesBeforeConstructor: true,
	}
): InjectorBuilder<TContext> {
	return new InjectorFactory<TContext>(defaultInjector, options);
}
