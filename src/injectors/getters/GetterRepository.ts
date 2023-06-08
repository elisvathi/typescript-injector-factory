import { Class } from "../../utilityTypes";
import type { DefaultInjector } from "../types";
import { Getter } from "./Getter";
import { IGetter } from "./IGetter";
import { DefaultGetter } from "./DefaultGetter";

export class GetterRepository<TContext> {
	public constructor(private defaultInjector?: DefaultInjector<TContext>) {}
	private readonly propertyMap = new Map<
		Class,
		Map<string | symbol, Getter<TContext>>
	>();

	private readonly parameterMap = new Map<
		Class,
		Map<string | symbol | undefined, Array<Getter<TContext>>>
	>();

	public setPropertyGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol,
		getter: Getter<TContext>
	): void {
		const clMap =
			this.propertyMap.get(cl) ||
			new Map<string | symbol, Getter<TContext>>();
		clMap.set(propertyKey, getter);
		this.propertyMap.set(cl, clMap);
	}

	public getPropertyGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol
	): IGetter<TContext> {
		return (
			this.propertyMap.get(cl)?.get(propertyKey) ||
			new DefaultGetter(this.defaultInjector)
		);
	}

	public getAllPropertyGetters(
		cl: Class
	): Map<string | symbol, Getter<TContext>> {
		return (
			this.propertyMap.get(cl) ||
			new Map<string | symbol, Getter<TContext>>()
		);
	}

	public setParameterGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol | undefined,
		parameterIndex: number,
		getter: Getter<TContext>
	): void {
		const clMap =
			this.parameterMap.get(cl) ||
			new Map<string | symbol | undefined, Array<Getter<TContext>>>();
		const propParameters = clMap.get(propertyKey) || [];
		propParameters[parameterIndex] = getter;
		clMap.set(propertyKey, propParameters);
		this.parameterMap.set(cl, clMap);
	}

	public getParameterGetter<T>(
		cl: Class<T>,
		propertyKey: string | symbol | undefined,
		parameterIndex: number
	): IGetter<TContext> {
		return (
			this.parameterMap.get(cl)?.get(propertyKey)?.at(parameterIndex) ||
			new DefaultGetter(this.defaultInjector)
		);
	}

	public getAllParameterGetters<T>(
		cl: Class<T>,
		propertyKey: string | symbol | undefined
	): Array<IGetter<TContext>> {
		return this.parameterMap.get(cl)?.get(propertyKey) || [];
	}
}
