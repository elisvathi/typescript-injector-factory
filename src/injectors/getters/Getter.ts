import type { CreateInjectorFn } from "../types";
import { IGetter } from "./IGetter";

export class Getter<
	TContext,
	TArgs extends unknown[] = unknown[],
	TReturn = unknown
> extends IGetter<TContext> {
	private fn: (
		async: boolean
	) => <T extends Object>(
		ctx: TContext,
		instance: T
	) => TReturn | Promise<TReturn>;

	public constructor(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>,
		propertyKey: string | symbol | undefined,
		parameterIndex: number | undefined,
		args: TArgs
	) {
		super();
		this.fn =
			(async: boolean) =>
			<T extends Object>(ctx: TContext, instance: T) =>
				fn(
					this.buildInjectorPayload(
						async,
						ctx,
						instance,
						propertyKey,
						parameterIndex
					),
					...args
				);
	}

	public call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: true
	): Promise<TReturn>;
	public call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: false
	): TReturn;
	public call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: boolean
	): TReturn | Promise<TReturn> {
		return this.fn(async)(context, runtimeClassInstance);
	}
}
