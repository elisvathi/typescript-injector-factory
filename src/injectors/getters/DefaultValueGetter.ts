import type { CreateInjectorFn } from "../types";
import { AbstractValueGetter } from "./AbstractValueGetter";

export class DefaultValueGetter<TContext, TReturn = unknown> extends AbstractValueGetter<
	TContext,
	TReturn
> {
	private readonly fn?: (
		async: boolean
	) => <T extends Object>(
		ctx: TContext,
		instance: T
	) => TReturn | Promise<TReturn>;

	public constructor(
		fn?: CreateInjectorFn<TContext, TReturn>,
		private propertyKey?: string | undefined,
		private parameterIndex?: number
	) {
		super();
		if (fn) {
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
							)
						);
		}
	}

	call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: true
	): Promise<TReturn>;
	call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: false
	): TReturn;
	public call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: boolean
	): TReturn | Promise<TReturn> {
		if (!this.fn) {
			const name = this.propertyKey || "constructor";
			if (Number.isFinite(this.parameterIndex)) {
				throw new Error(
					`No injector for the argument number [${
						this.parameterIndex
					}] on method [${String(name)}] for class [${
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

		return this.fn(async)(context, runtimeClassInstance);
	}
}
