import "reflect-metadata";
import { type Class } from "../../utilityTypes";
import { BoundFactory } from "./BoundFactory";
import type { InjectorBuilder } from "./InjectorBuilder";
import { type InjectorResolver } from "./InjectorResolver";
import type {
	CreateInjectorFn,
	DefaultInjector,
	InjectorDecorator,
} from "../types";
import { ValueGetter } from "../getters/ValueGetter";
import { ValueGetterRepository } from "../getters/ValueGetterRepository";

export class InjectorFactory<TContext> implements InjectorBuilder<TContext> {
	private readonly getterRepository;

	public constructor(
		readonly fn?: DefaultInjector<TContext>,
	) {
		this.getterRepository = new ValueGetterRepository<TContext>(fn);
	}

	public createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs> {
		return (...args: TArgs) =>
			(
				// eslint-disable-next-line @typescript-eslint/ban-types
				target: Object,
				propertyKey?: string | symbol,
				parameterIndex?: number
			) => {
				// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
				const targetConstructor: Class = propertyKey
					? (target.constructor as Class)
					: (target as Class);
				if (!!parameterIndex || parameterIndex === 0) {
					this.getterRepository.setParameterGetter(
						targetConstructor,
						propertyKey,
						parameterIndex,
						new ValueGetter(fn, propertyKey, parameterIndex, args)
					);
				} else if (propertyKey) {
					this.getterRepository.setPropertyGetter(
						targetConstructor,
						propertyKey,
						new ValueGetter(fn, propertyKey, parameterIndex, args)
					);
				}
			};
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	public methodArguments<T extends Object>(
		ctx: TContext,
		runtimeClassInstance: T,
		methodName: string | symbol | undefined
	): unknown[] {
		const parametersLength: number = this.getMethodParametersLength(
			runtimeClassInstance,
			methodName
		);
		return new Array(parametersLength).fill(0).map((_parameter, index) => {
			const getter = this.getterRepository.getParameterGetter(
				runtimeClassInstance.constructor as Class<T>,
				methodName,
				index
			);
			return getter.call(ctx, runtimeClassInstance, false);
		});
	}

	public fields<T extends Object>(
		ctx: TContext,
		runtimeClassInstance: T
	): Record<string, unknown> {
		const clMap = this.getterRepository.getAllPropertyGetters(
			runtimeClassInstance.constructor as Class<T>
		);
		const returnValue: Record<string | symbol, unknown> = {};
		clMap?.forEach((getter, key) => {
			if (key) {
				returnValue[key] = getter.call(
					ctx,
					runtimeClassInstance,
					false
				);
			}
		});
		return returnValue;
	}

	public async methodArgumentsAsync<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		methodName: string | symbol | undefined,
	): Promise<unknown[]> {
		const parametersLength: number = this.getMethodParametersLength(
			runtimeClassInstance,
			methodName
		);
		const args: unknown[] = [];
		for (let index = 0; index < parametersLength; index++) {
			const getter = this.getterRepository.getParameterGetter(
					runtimeClassInstance.constructor as Class<T>,
					methodName,
					index
			);
			args.push(await getter.call(context, runtimeClassInstance, true));
		}
		return args;
	}

	public async fieldsAsync<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
	): Promise<Record<string | symbol, unknown>> {
		const clMap = this.getterRepository.getAllPropertyGetters(
			runtimeClassInstance.constructor as Class<T>
		);
		const returnValue: Record<string | symbol, unknown> = {};
		for (const [key, getter] of (
			clMap || new Map<string, ValueGetter<TContext>>()
		).entries()) {
			if (key) {
				returnValue[key] = await getter.call(
					context,
					runtimeClassInstance,
					true
				);
			}
		}
		return returnValue;
		return returnValue;
	}

	public with(ctx: TContext): InjectorResolver {
		return new BoundFactory<TContext>(this, ctx);
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
				methodName)
			: Reflect.getMetadata(
				PARAM_TYPES_KEY,
				runtimeClassInstance.constructor);
		return meta?.length || 0;
	}
}
