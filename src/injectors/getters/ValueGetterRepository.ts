import { Class } from "../../utilityTypes";
import type { DefaultInjector } from "../types";
import { ValueGetter } from "./ValueGetter";
import { AbstractValueGetter } from "./AbstractValueGetter";
import { DefaultValueGetter } from "./DefaultValueGetter";

export class ValueGetterRepository<TContext> {
	public constructor(private defaultInjector?: DefaultInjector<TContext>) {}
	private readonly propertyMap = new Map<
		Class,
		Map<string | symbol, ValueGetter<TContext>>
	>();

	private readonly parameterMap = new Map<
		Class,
		Map<string | symbol | undefined, Array<ValueGetter<TContext>>>
	>();

	public setPropertyGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol,
		getter: ValueGetter<TContext>
	): void {
		const clMap =
			this.propertyMap.get(cl) ||
			new Map<string | symbol, ValueGetter<TContext>>();
		clMap.set(propertyKey, getter);
		this.propertyMap.set(cl, clMap);
	}

	public getPropertyGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol
	): AbstractValueGetter<TContext> {
		return (
			this.propertyMap.get(cl)?.get(propertyKey) ||
			new DefaultValueGetter(this.defaultInjector)
		);
	}

	public getAllPropertyGetters(
		cl: Class
	): Map<string | symbol, ValueGetter<TContext>> {
		return (
			this.propertyMap.get(cl) ||
			new Map<string | symbol, ValueGetter<TContext>>()
		);
	}

	public setParameterGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol | undefined,
		parameterIndex: number,
		getter: ValueGetter<TContext>
	): void {
		const clMap =
			this.parameterMap.get(cl) ||
			new Map<string | symbol | undefined, Array<ValueGetter<TContext>>>();
		const propParameters = clMap.get(propertyKey) || [];
		propParameters[parameterIndex] = getter;
		clMap.set(propertyKey, propParameters);
		this.parameterMap.set(cl, clMap);
	}

	public getParameterGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol | undefined,
		parameterIndex: number
	): AbstractValueGetter<TContext> {
		return (
			this.parameterMap.get(cl)?.get(propertyKey)?.at(parameterIndex) ||
			new DefaultValueGetter(this.defaultInjector, undefined, parameterIndex)
		);
	}

	public getAllParameterGetters<T>(
		cl: Class<T>,
		propertyKey: string | symbol | undefined
	): Array<AbstractValueGetter<TContext>> {
		return this.parameterMap.get(cl)?.get(propertyKey) || [];
	}
}
