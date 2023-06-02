import { Class } from "../utilityTypes";

export type ParameterDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (
	target: Object,
	propertyKey: string | symbol | undefined,
	parameterIndex: number
) => void;

export type ParameterExtractors<TMeta> = {
	decoratedClasses: () => Array<Class>;
	decoratedMethods: (cl: Class) => Array<string | symbol | undefined>;
	getMethodMetadata: (
		cl: Class,
		method: string | symbol | undefined
	) => (TMeta | undefined)[] | undefined;
	getParameterMetadata: (
		cl: Class,
		method: string | symbol | undefined,
		index: number
	) => TMeta | undefined;
};

export type ParameterTransformerPayload = {
	target: Class;
	name: string | symbol | undefined;
	parameterIndex: number;
};

function createParameterDecoratorSingle<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	transformer: (payload: ParameterTransformerPayload, ...args: TArgs) => TMeta
): [ParameterDecorator<TArgs>, ParameterExtractors<TMeta>] {
	const classMap: Map<
		Class,
		Map<string | symbol | undefined, Map<number, TMeta>>
	> = new Map();
	const decorator =
		(...args: TArgs) =>
		(
			target: Object,
			propertyKey: string | symbol | undefined,
			parameterIndex: number
		) => {
			const meta = transformer(
				{
					target: target.constructor as Class,
					name: propertyKey,
					parameterIndex,
				},
				...args
			);
			const classData =
				classMap.get(target.constructor as Class) ||
				new Map<string | symbol, Map<number, TMeta>>();
			const methodData =
				classData.get(propertyKey) || new Map<number, TMeta>();
			methodData.set(parameterIndex, meta);
			classData.set(propertyKey, methodData);
			classMap.set(target.constructor as Class, classData);
		};
	const extractors: ParameterExtractors<TMeta> = {
		decoratedClasses: () => Array.from(classMap.keys()),
		decoratedMethods: (cl: Class) =>
			Array.from(classMap.get(cl)?.keys() || []),
		getMethodMetadata: (cl: Class, method: string | symbol | undefined) => {
			const returnValue: (TMeta | undefined)[] = [];
			const entries = classMap.get(cl)?.get(method)?.entries();
			if (!entries) {
				return undefined;
			}
			for (const [index, value] of entries) {
				returnValue[index] = value;
			}
			return returnValue;
		},
		getParameterMetadata: (
			cl: Class,
			method: string | symbol | undefined,
			index: number
		) => classMap.get(cl)?.get(method)?.get(index),
	};
	return [decorator, extractors];
}

function createParameterDecoratorMulti<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	transformer: (payload: ParameterTransformerPayload, ...args: TArgs) => TMeta
): [ParameterDecorator<TArgs>, ParameterExtractors<TMeta[]>] {
	const classMap: Map<
		Class,
		Map<string | symbol | undefined, Map<number, TMeta[]>>
	> = new Map();
	const decorator =
		(...args: TArgs) =>
		(
			target: Object,
			propertyKey: string | symbol | undefined,
			parameterIndex: number
		) => {
			const meta = transformer(
				{
					target: target.constructor as Class,
					name: propertyKey,
					parameterIndex,
				},
				...args
			);
			const classData =
				classMap.get(target.constructor as Class) ||
				new Map<string | symbol, Map<number, TMeta[]>>();
			const methodData =
				classData.get(propertyKey) || new Map<number, TMeta[]>();
			const paramData = methodData.get(parameterIndex) || [];
			paramData.push(meta);
			methodData.set(parameterIndex, paramData);
			classData.set(propertyKey, methodData);
			classMap.set(target.constructor as Class, classData);
		};
	const extractors: ParameterExtractors<TMeta[]> = {
		decoratedClasses: () => Array.from(classMap.keys()),
		decoratedMethods: (cl: Class) =>
			Array.from(classMap.get(cl)?.keys() || []),
		getMethodMetadata: (cl: Class, method: string | symbol | undefined) => {
			const returnValue: (TMeta[] | undefined)[] = [];
			const entries = classMap.get(cl)?.get(method)?.entries();
			if (!entries) {
				return undefined;
			}
			for (const [index, value] of entries) {
				returnValue[index] = value;
			}
			return returnValue;
		},
		getParameterMetadata: (
			cl: Class,
			method: string | symbol | undefined,
			index: number
		) => classMap.get(cl)?.get(method)?.get(index),
	};
	return [decorator, extractors];
}

export function createParameterDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: false,
	transformer?: (
		payload: ParameterTransformerPayload,
		...args: TArgs
	) => TMeta
): [ParameterDecorator<TArgs>, ParameterExtractors<TMeta>];
export function createParameterDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: true,
	transformer?: (
		payload: ParameterTransformerPayload,
		...args: TArgs
	) => TMeta
): [ParameterDecorator<TArgs>, ParameterExtractors<TMeta[]>];
export function createParameterDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: boolean,
	transformer?: (
		payload: ParameterTransformerPayload,
		...args: TArgs
	) => TMeta
):
	| [ParameterDecorator<TArgs>, ParameterExtractors<TMeta>]
	| [ParameterDecorator<TArgs>, ParameterExtractors<TMeta[]>] {
	type TransformerFunction = (
		payload: ParameterTransformerPayload,
		...args: TArgs
	) => TMeta;
	if (!transformer) {
		const fn = (_payload: ParameterTransformerPayload) => ({});
		transformer = fn as unknown as TransformerFunction;
	}
	if (multi) {
		return createParameterDecoratorMulti(transformer);
	}
	return createParameterDecoratorSingle(transformer);
}
