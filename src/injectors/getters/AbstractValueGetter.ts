import { Class } from "../../utilityTypes";
import type { CreateInjectorPayload } from "../types";
import { extractParameterType, extractPropertyType } from "../../extractors";

export abstract class AbstractValueGetter<TContext, TReturn = unknown> {
	protected buildInjectorPayload<T extends Object> (
		async: boolean,
		context: TContext,
		runtimeClassInstance: T,
		propertyKey: string | symbol | undefined,
		parameterIndex?: number
	): CreateInjectorPayload<TContext, T> {
		let type: Class | undefined = undefined;
		if (Number.isFinite(parameterIndex) && parameterIndex !== undefined) {
			type = extractParameterType(runtimeClassInstance, propertyKey, parameterIndex);
		} else if (propertyKey) {
			type = extractPropertyType(runtimeClassInstance, propertyKey);
		}
		return {
			target: runtimeClassInstance.constructor as Class<T>,
			context,
			propertyKey,
			runtimeClassInstance,
			parameterIndex,
			async,
			type,
			isProperty: !Number.isFinite(parameterIndex),
			isParameter: parameterIndex !== undefined && propertyKey !== undefined
		};
	}

	abstract call<T extends Object> (
		context: TContext,
		runtimeClassInstance: T,
		async: true
	): Promise<TReturn>;
	abstract call<T extends Object> (
		context: TContext,
		runtimeClassInstance: T,
		async: false
	): TReturn;
	public abstract call<T extends Object> (
		context: TContext,
		runtimeClassInstance: T,
		async: boolean
	): TReturn | Promise<TReturn>;
}
