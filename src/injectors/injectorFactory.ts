import { getType, Type } from "tst-reflect";
export interface Class<T = unknown> extends Function {
	new (...args: any[]): T;
}
type CreateInjectorPayloadBase<TContext> = {
	context: TContext;
	type?: Type;
	target: Class;
	returnType?: Type;
	propertyKey: string | symbol;
};
type CreateInjectorPayloadField<TContext> = CreateInjectorPayloadBase<TContext>;
type CreateInjectorPayloadParameter<TContext> =
	CreateInjectorPayloadBase<TContext> & { parameterIndex: number };
type CreateInjectorPayload<TContext> =
	| CreateInjectorPayloadField<TContext>
	| CreateInjectorPayloadParameter<TContext>;

type CreateInjectorFn<TContext, TReturn, TArgs extends unknown[] = []> = (
	payload: CreateInjectorPayload<TContext>,
	...args: TArgs
) => TReturn;

type DefaultInjector<TContext> = <TReturn>(
	payload: CreateInjectorPayload<TContext>
) => TReturn;
type MethodOf<TClass> = keyof TClass; // TODO: fix this type

type GetValueFunction<TContext, TReturn> = (
	ctx: TContext,
	cl: Class,
	propertyKey?: string | symbol,
	index?: number
) => { exists: boolean; value?: TReturn };
type InjectorDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (
	target: Object,
	propertyKey: string | symbol,
	parameterIndex?: number
) => void;
type Getter<TContext> = (ctx: TContext) => unknown;
class InjectorFactory<TContext> {
	public constructor(private fn?: DefaultInjector<TContext>) {}
	private propertyMap: Map<
		Class,
		Map<string | symbol | undefined, Getter<TContext>>
	> = new Map();
	private parameterMap: Map<
		Class,
		Map<string | symbol | undefined, Array<Getter<TContext>>>
	> = new Map();
	public createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs> {
		const decorator =
			(...args: TArgs) =>
			<TClass>(
				target: Object,
				propertyKey: string | symbol,
				propertyIndex?: number
			) => {
				const isParameterDecorator =
					!!propertyIndex || propertyIndex === 0;
				const payloadBuilder = (
					context: TContext
				): CreateInjectorPayload<TContext> => {
					return {
						target: target.constructor as Class<unknown>,
						context,
						propertyKey,
						// type: //TODO
					};
				};
				if (isParameterDecorator) {
					const targetMap =
						this.parameterMap.get(target.constructor as Class) ||
						new Map<string | symbol, Array<Getter<TContext>>>();
					const methodData = targetMap.get(propertyKey) || [];
					const transformedFn = (context: TContext) =>
						fn(payloadBuilder(context), ...args);
					methodData[propertyIndex] = transformedFn;
					targetMap.set(propertyKey, methodData);
					this.parameterMap.set(
						target.constructor as Class,
						targetMap
					);
				} else {
					const targetMap =
						this.propertyMap.get(target.constructor as Class) ||
						new Map<string | symbol, Getter<TContext>>();
					const transformedFn = (context: TContext) =>
						fn(payloadBuilder(context), ...args);
					targetMap.set(propertyKey, transformedFn);
					this.propertyMap.set(
						target.constructor as Class,
						targetMap
					);
				}
			};

		return decorator;
	}
	public call<T, M extends MethodOf<T>, TReturn>(
		ctx: TContext,
		cl: Class<T>,
		name: M
	): TReturn | undefined {
		const { exists, value } = this.getter(ctx, cl, name as string); //TODO: Fix this type
		if (exists) {
			return value as TReturn;
		}
		return this.getDefalt(ctx, cl, name as string); //TODO: Fix this type
	}

	public bind(ctx: TContext): BoundFactory<TContext> {
		return new BoundFactory<TContext>(this, ctx);
	}
	private getDefalt<T, TContext, TReturn>(
		ctx: TContext,
		cl: Class<T>,
		name: string | symbol
	): TReturn | undefined {
		throw new Error("Method not implemented.");
	}

	private getter<TReturn>(
		ctx: TContext,
		cl: Class,
		propertyKey?: string | symbol,
		index?: number
	): { exists: boolean; value?: TReturn } {
		const isParameter = !!index || index === 0;
		if (isParameter) {
			const clMap = this.parameterMap.get(cl);
			const methodMap = clMap?.get(propertyKey);
			const getter = methodMap?.at(index);
			if (getter) {
				return { exists: true, value: getter(ctx) as TReturn };
			}
		} else {
			const clMap = this.propertyMap.get(cl);
			const getter = clMap?.get(propertyKey);
			if (getter) {
				return { exists: true, value: getter(ctx) as TReturn };
			}
		}
		return { exists: false };
	}
}
class BoundFactory<TContext> {
	public constructor(
		private factory: InjectorFactory<TContext>,
		private context: TContext
	) {}

	public call<T, M extends MethodOf<T>, TReturn>(
		cl: Class<T>,
		name: M
	): TReturn | undefined {
		return this.factory.call(this.context, cl, name);
	}
}
