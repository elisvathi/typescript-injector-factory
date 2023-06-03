import type { Class } from "../utilityTypes";

export type InjectorFactoryOptions = {
	injectPropertiesBeforeConstructor: boolean;
};
export type CreateInjectorPayloadBase<TContext, TClass extends Object> = {
	context: TContext;
	type: Class;
	target: Class;
	runtimeClassInstance: TClass;
	returnType?: Class;
	propertyKey: string | symbol | undefined;
};

export type CreateInjectorPayloadField<
	TContext,
	TClass extends Object
> = CreateInjectorPayloadBase<TContext, TClass>;

export type CreateInjectorPayloadParameter<
	TContext,
	TClass extends Object
> = CreateInjectorPayloadBase<TContext, TClass> & { parameterIndex: number };

export type CreateInjectorPayload<TContext, TClass extends Object> =
	| CreateInjectorPayloadField<TContext, TClass>
	| CreateInjectorPayloadParameter<TContext, TClass>;

export type CreateInjectorFn<
	TContext,
	TReturn,
	TArgs extends unknown[] = []
> = <TClass extends Object>(
	payload: CreateInjectorPayload<TContext, TClass>,
	...args: TArgs
) => TReturn;

export type DefaultInjector<TContext> = <TReturn, TClass extends Object>(
	payload: CreateInjectorPayload<TContext, TClass>
) => TReturn | undefined;

export type InjectorDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (
	target: Object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) => void;

export type Getter<TContext, T extends Object = Object> = (
	ctx: TContext,
	instance: T
) => unknown;
