import { extractMethodParamTypes } from "../extractors";
import { Class } from "../utilityTypes";

export type ClassDecorator<TArgs extends unknown[]> = (
	...args: TArgs
) => (target: Class) => void;

export type ClassTransformerPayload = {
	class: Class;
	constructorParameters: Array<Class>;
};

export type ClassExtractors<TMeta> = {
	getClasses: () => Array<Class>;
	getValue: (cl: Class) => TMeta | undefined;
};

function createClassDecoratorSingle<TMeta, TArgs extends unknown[] = []>(
	transformer: (payload: ClassTransformerPayload, ...args: TArgs) => TMeta
): [ClassDecorator<TArgs>, ClassExtractors<TMeta>] {
	const map = new Map<Class, TMeta>();
	const decorator =
		(...args: TArgs) =>
		(target: Class) => {
			const saveData = transformer(
				{
					class: target,
					constructorParameters: extractMethodParamTypes(
						target.prototype
					),
				},
				...args
			);
			map.set(target, saveData);
		};
	const extracors: ClassExtractors<TMeta> = {
		getClasses: () => Array.from(map.keys()),
		getValue: (cl: Class) => map.get(cl),
	};
	return [decorator, extracors];
}

function createClassDecoratorMulti<
	TMeta extends unknown,
	TArgs extends unknown[] = []
>(
	transformer: (payload: ClassTransformerPayload, ...args: TArgs) => TMeta
): [ClassDecorator<TArgs>, ClassExtractors<TMeta[]>] {
	const map = new Map<Class, TMeta[]>();
	const decorator =
		(...args: TArgs) =>
		(target: Class) => {
			const saveData = transformer(
				{
					class: target,
					constructorParameters: extractMethodParamTypes(
						target.prototype
					),
				},
				...args
			);
			const current = map.get(target) || [];
			current.push(saveData);
			map.set(target, current);
		};
	const extracors: ClassExtractors<TMeta[]> = {
		getClasses: () => Array.from(map.keys()),
		getValue: (cl: Class) => map.get(cl),
	};
	return [decorator, extracors];
}

export function createClassDecorator<
	TMeta extends unknown,
	TArgs extends unknown[] = []
>(
	multi: true,
	transformer?: (payload: ClassTransformerPayload, ...args: TArgs) => TMeta
): [ClassDecorator<TArgs>, ClassExtractors<TMeta[]>];
export function createClassDecorator<
	TMeta extends unknown,
	TArgs extends unknown[] = []
>(
	multi: false,
	transformer?: (payload: ClassTransformerPayload, ...args: TArgs) => TMeta
): [ClassDecorator<TArgs>, ClassExtractors<TMeta>];
export function createClassDecorator<
	TMeta extends unknown,
	TArgs extends unknown[] = []
>(
	multi: boolean,
	transformer?: (payload: ClassTransformerPayload, ...args: TArgs) => TMeta
) {
	type TransformerFunction = (
		payload: ClassTransformerPayload,
		...args: TArgs
	) => TMeta;

	if (!transformer) {
		transformer = ((
			_payload: ClassTransformerPayload
		) => ({})) as unknown as TransformerFunction;
	}
	if (multi) {
		return createClassDecoratorMulti(transformer);
	}
	return createClassDecoratorSingle(transformer);
}
