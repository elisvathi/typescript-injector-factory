import {
	extractMethodParamTypes,
	extractMethodReturnType,
} from "../extractors";
import { Class } from "../utilityTypes";

export type MethodDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => <T>(
	target: Object,
	propertyKey: string | symbol,
	propdertyDescriptor: TypedPropertyDescriptor<T>
) => void;

export type MethodExtractors<TMeta> = {
	decoratedClasses: () => Array<Class>;
	decoratedMethods: (cl: Class) => Array<string | symbol>;
	getMetadata: (cl: Class, method: string | symbol) => TMeta | undefined;
};

export type MethodTransformerPayload<T> = {
	target: Class;
	name: string | symbol;
	descriptor: TypedPropertyDescriptor<T>;
	paramTypes: Array<Class>;
	returnType: Class;
};

function createMethodDecoratorSingle<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	transformer: <T>(
		payload: MethodTransformerPayload<T>,
		...args: TArgs
	) => TMeta
): [MethodDecorator<TArgs>, MethodExtractors<TMeta>] {
	const classMap: Map<Class, Map<string | symbol, TMeta>> = new Map();
	const decorator =
		(...args: TArgs) =>
		<T>(
			target: Object,
			propertyKey: string | symbol,
			descriptor: TypedPropertyDescriptor<T>
		) => {
			const meta = transformer(
				{
					target: target.constructor as Class,
					name: propertyKey,
					descriptor,
					paramTypes: extractMethodParamTypes(target, propertyKey),
					returnType: extractMethodReturnType(target, propertyKey),
				},
				...args
			);
			const classData =
				classMap.get(target.constructor as Class) ||
				new Map<string | symbol, TMeta>();
			classData.set(propertyKey, meta);
			classMap.set(target.constructor as Class, classData);
		};
	const extractors: MethodExtractors<TMeta> = {
		decoratedClasses: () => Array.from(classMap.keys()),
		decoratedMethods: (cl: Class) =>
			Array.from(classMap.get(cl)?.keys() || []),
		getMetadata: (cl: Class, method: string | symbol) =>
			classMap.get(cl)?.get(method),
	};
	return [decorator, extractors];
}

function createMethodDecoratorMulti<TMeta, TArgs extends unknown[] = unknown[]>(
	transformer: <T>(
		payload: MethodTransformerPayload<T>,
		...args: TArgs
	) => TMeta
): [MethodDecorator<TArgs>, MethodExtractors<TMeta[]>] {
	const classMap: Map<Class, Map<string | symbol, TMeta[]>> = new Map();
	const decorator =
		(...args: TArgs) =>
		<T>(
			target: Object,
			propertyKey: string | symbol,
			descriptor: TypedPropertyDescriptor<T>
		) => {
			const meta = transformer(
				{
					target: target.constructor as Class,
					name: propertyKey,
					descriptor,
					paramTypes: extractMethodParamTypes(target, propertyKey),
					returnType: extractMethodReturnType(target, propertyKey),
				},
				...args
			);
			const classData =
				classMap.get(target.constructor as Class) ||
				new Map<string | symbol, TMeta[]>();
			const existing = classData.get(propertyKey) || [];
			existing.push(meta);
			classData.set(propertyKey, existing);
			classMap.set(target.constructor as Class, classData);
		};
	const extractors: MethodExtractors<TMeta[]> = {
		decoratedClasses: () => Array.from(classMap.keys()),
		decoratedMethods: (cl: Class) =>
			Array.from(classMap.get(cl)?.keys() || []),
		getMetadata: (cl: Class, method: string | symbol) =>
			classMap.get(cl)?.get(method),
	};
	return [decorator, extractors];
}

export function createMethodDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: false,
	transformer?: <T>(
		payload: MethodTransformerPayload<T>,
		...args: TArgs
	) => TMeta
): [MethodDecorator<TArgs>, MethodExtractors<TMeta>];
export function createMethodDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: true,
	transformer?: <T>(
		payload: MethodTransformerPayload<T>,
		...args: TArgs
	) => TMeta
): [MethodDecorator<TArgs>, MethodExtractors<TMeta[]>];
export function createMethodDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: boolean,
	transformer?: <T>(
		payload: MethodTransformerPayload<T>,
		...args: TArgs
	) => TMeta
):
	| [MethodDecorator<TArgs>, MethodExtractors<TMeta>]
	| [MethodDecorator<TArgs>, MethodExtractors<TMeta[]>] {
	type TransformerFunction = <T>(
		payload: MethodTransformerPayload<T>,
		...args: TArgs
	) => TMeta;
	if (!transformer) {
		const fn = <T>(_payload: MethodTransformerPayload<T>) => ({});
		transformer = fn as unknown as TransformerFunction;
	}
	if (multi) {
		return createMethodDecoratorMulti(transformer);
	}
	return createMethodDecoratorSingle(transformer);
}
