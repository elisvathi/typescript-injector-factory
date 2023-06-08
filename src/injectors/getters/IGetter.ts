import { Class } from "../../utilityTypes";
import type { CreateInjectorPayload } from "../types";

export abstract class IGetter<TContext, TReturn = unknown> {
	protected buildInjectorPayload<T extends Object>(
		async: boolean,
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
			async,
			// Type: //TODO
		};
	}
	abstract call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: true
	): Promise<TReturn>;
	abstract call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: false
	): TReturn;
	public abstract call<T extends Object>(
		context: TContext,
		runtimeClassInstance: T,
		async: boolean
	): TReturn | Promise<TReturn>;
}
