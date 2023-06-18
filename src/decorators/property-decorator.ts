import { extractPropertyType } from "../extractors";
import { Class } from "../utilityTypes";

export type PropertyDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (target: Object, propertyKey: string | symbol) => void;

export type PropertyExtractors<TMeta> = {
	decoratedClasses: () => Array<Class>;
	decoratedProperties: (cl: Class) => Array<string | symbol>;
	getMetadata: (cl: Class, method: string | symbol) => TMeta | undefined;
};

export type PropertyTransformerPayload = {
	target: Class;
	name: string | symbol;
	type: Class;
};

function createPropertyDecoratorSingle<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	transformer: (payload: PropertyTransformerPayload, ...args: TArgs) => TMeta
): [PropertyDecorator<TArgs>, PropertyExtractors<TMeta>] {
	const classMap: Map<Class, Map<string | symbol, TMeta>> = new Map();
	const decorator =
		(...args: TArgs) =>
			(target: Object, propertyKey: string | symbol) => {
				const meta = transformer(
					{
						target: target.constructor as Class,
						name: propertyKey,
						type: extractPropertyType(target, propertyKey),
					},
					...args
				);
				const classData =
				classMap.get(target.constructor as Class) ||
				new Map<string | symbol, TMeta>();
				classData.set(propertyKey, meta);
				classMap.set(target.constructor as Class, classData);
			};
	const extractors: PropertyExtractors<TMeta> = {
		decoratedClasses: () => Array.from(classMap.keys()),
		decoratedProperties: (cl: Class) =>
			Array.from(classMap.get(cl)?.keys() || []),
		getMetadata: (cl: Class, method: string | symbol) =>
			classMap.get(cl)?.get(method),
	};
	return [decorator, extractors];
}

function createPropertyDecoratorMulti<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	transformer: (payload: PropertyTransformerPayload, ...args: TArgs) => TMeta
): [PropertyDecorator<TArgs>, PropertyExtractors<TMeta[]>] {
	const classMap: Map<Class, Map<string | symbol, TMeta[]>> = new Map();
	const decorator =
		(...args: TArgs) =>
			(target: Object, propertyKey: string | symbol) => {
				const meta = transformer(
					{
						target: target.constructor as Class,
						name: propertyKey,
						type: extractPropertyType(target, propertyKey),
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
	const extractors: PropertyExtractors<TMeta[]> = {
		decoratedClasses: () => Array.from(classMap.keys()),
		decoratedProperties: (cl: Class) =>
			Array.from(classMap.get(cl)?.keys() || []),
		getMetadata: (cl: Class, method: string | symbol) =>
			classMap.get(cl)?.get(method),
	};
	return [decorator, extractors];
}

export function createPropertyDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: false,
	transformer?: (payload: PropertyTransformerPayload, ...args: TArgs) => TMeta
): [PropertyDecorator<TArgs>, PropertyExtractors<TMeta>];
export function createPropertyDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: true,
	transformer?: (payload: PropertyTransformerPayload, ...args: TArgs) => TMeta
): [PropertyDecorator<TArgs>, PropertyExtractors<TMeta[]>];
export function createPropertyDecorator<
	TMeta,
	TArgs extends unknown[] = unknown[]
>(
	multi: boolean,
	transformer?: (payload: PropertyTransformerPayload, ...args: TArgs) => TMeta
):
	| [PropertyDecorator<TArgs>, PropertyExtractors<TMeta>]
	| [PropertyDecorator<TArgs>, PropertyExtractors<TMeta[]>] {
	type TransformerFunction = (
		payload: PropertyTransformerPayload,
		...args: TArgs
	) => TMeta;
	if (!transformer) {
		const fn = (_payload: PropertyTransformerPayload) => ({});
		transformer = fn as unknown as TransformerFunction;
	}
	if (multi) {
		return createPropertyDecoratorMulti(transformer);
	}
	return createPropertyDecoratorSingle(transformer);
}
