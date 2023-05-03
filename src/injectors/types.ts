export type Class<T = unknown> = (new (...args: any[]) => T) & Function;

export type InjectorFactoryOptions = {
	injectPropertiesBeforeConstructor: boolean;
};
export type CreateInjectorPayloadBase<
	TContext,
	TClass extends Record<string, unknown>
> = {
	context: TContext;
	type?: Class;
	target: Class;
	runtimeClassInstance: TClass;
	returnType?: Class;
	propertyKey: string | symbol | undefined;
};
export type CreateInjectorPayloadField<
	TContext,
	TClass extends Record<string, unknown>
> = CreateInjectorPayloadBase<TContext, TClass>;
export type CreateInjectorPayloadParameter<
	TContext,
	TClass extends Record<string, unknown>
> = CreateInjectorPayloadBase<TContext, TClass> & { parameterIndex: number };
export type CreateInjectorPayload<
	TContext,
	TClass extends Record<string, unknown>
> =
	| CreateInjectorPayloadField<TContext, TClass>
	| CreateInjectorPayloadParameter<TContext, TClass>;

export type CreateInjectorFn<
	TContext,
	TReturn,
	TArgs extends unknown[] = []
> = <TClass extends Record<string, unknown>>(
	payload: CreateInjectorPayload<TContext, TClass>,
	...args: TArgs
) => TReturn;

export type DefaultInjector<TContext> = <
	TReturn,
	TClass extends Record<string, unknown>
>(
	payload: CreateInjectorPayload<TContext, TClass>
) => TReturn | undefined;
export type MethodOf<TClass> = keyof TClass; // TODO: fix this type

export type InjectorDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (
	target: Record<string, unknown>,
	propertyKey?: string | symbol,
	parameterIndex?: number
) => void;
export type Getter<
	TContext,
	T extends Record<string, unknown> = Record<string, unknown>
> = (ctx: TContext, instance: T) => unknown;
