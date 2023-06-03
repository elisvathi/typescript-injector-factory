import "reflect-metadata";
import { Class } from "../utilityTypes";
import { BoundFactory } from "./BoundFactory";
import type { InjectorBuilder } from "./InjectorBuilder";
import { InjectorResolver } from "./InjectorResolver";
import type {
	CreateInjectorFn,
	CreateInjectorPayload,
	DefaultInjector,
	Getter,
	InjectorDecorator,
	InjectorFactoryOptions,
} from "./types";
import { extractParameterType, extractPropertyType } from "../extractors";

export class InjectorFactory<TContext> implements InjectorBuilder<TContext> {
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
			type:
				parameterIndex !== undefined
					? extractParameterType(
							runtimeClassInstance,
							propertyKey,
							parameterIndex
					  )
					: propertyKey !== undefined
					? extractPropertyType(runtimeClassInstance, propertyKey)
					: Object,
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
				if (propertyIndex || propertyIndex === 0) {
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

	private getMethodParametersLength<T extends Object>(
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

	public async methodArgumentsAsync<T extends Object>(
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
	public async fieldsAsync<T extends Object>(
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

	public with(ctx: TContext): InjectorResolver {
		return new BoundFactory<TContext>(this, ctx);
	}
}
