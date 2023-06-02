import { Class } from "../utilityTypes";
import {
	ClassExtractors,
	ClassTransformerPayload,
	createClassDecorator,
} from "./class-decorator";
import {
	MethodExtractors,
	MethodTransformerPayload,
	createMethodDecorator,
} from "./method-decorator";
import {
	ParameterExtractors,
	ParameterTransformerPayload,
	createParameterDecorator,
} from "./parameter-decorator";
import {
	PropertyExtractors,
	PropertyTransformerPayload,
	createPropertyDecorator,
} from "./property-decorator";

type CompoundDecorator<TArgs extends unknown[] = unknown[]> = (
	...args: TArgs
) => <T>(
	target: Object,
	propertyKey?: string | symbol | undefined,
	propertyDescriptor?: number | TypedPropertyDescriptor<T> | undefined
) => void;
type CompoundExtractors<TMeta> = {
	classExtractor: ClassExtractors<TMeta>;
	methodExtractor: MethodExtractors<TMeta>;
	propertyExtractor: PropertyExtractors<TMeta>;
	parameterExtractor: ParameterExtractors<TMeta>;
};

type CompoundTransformerPayload<T> = Partial<
	ClassTransformerPayload &
		MethodTransformerPayload<T> &
		PropertyTransformerPayload &
		ParameterTransformerPayload
>;

function compoundDecoratorSingle<TMeta, TArgs extends unknown[] = unknown[]>(
	fn?: <T>(payload: CompoundTransformerPayload<T>, ...args: TArgs) => TMeta
): [CompoundDecorator<TArgs>, CompoundExtractors<TMeta>] {
	const [classDecorator, classExtractor] = createClassDecorator(false, fn);
	const [methodDecorator, methodExtractor] = createMethodDecorator(false, fn);
	const [propertyDecorator, propertyExtractor] = createPropertyDecorator(
		false,
		fn
	);
	const [parameterDecorator, parameterExtractor] = createParameterDecorator(
		false,
		fn
	);
	const extractors = {
		classExtractor,
		methodExtractor,
		propertyExtractor,
		parameterExtractor,
	};
	const decorator = (...args: TArgs) => {
		return <T>(
			target: Object,
			propertyKey: string | symbol | undefined,
			propertyDescriptor?: TypedPropertyDescriptor<T> | number
		) => {
			if (!propertyKey && propertyDescriptor == undefined) {
				return classDecorator(...args)(target as Class);
			}
			if (propertyDescriptor && typeof propertyDescriptor === "number") {
				return parameterDecorator(...args)(
					target,
					propertyKey,
					propertyDescriptor
				);
			}
			if (!!propertyKey && propertyDescriptor === undefined) {
				return propertyDecorator(...args)(target, propertyKey);
			}
			if (propertyKey) {
				return methodDecorator(...args)(
					target,
					propertyKey as string | symbol,
					propertyDescriptor as TypedPropertyDescriptor<unknown>
				);
			}
		};
	};
	return [decorator, extractors];
}

function compoundDecoratorMulti<TMeta, TArgs extends unknown[] = unknown[]>(
	fn?: <T>(payload: CompoundTransformerPayload<T>, ...args: TArgs) => TMeta
): [CompoundDecorator<TArgs>, CompoundExtractors<TMeta[]>] {
	const [classDecorator, classExtractor] = createClassDecorator(true, fn);
	const [methodDecorator, methodExtractor] = createMethodDecorator(true, fn);
	const [propertyDecorator, propertyExtractor] = createPropertyDecorator(
		true,
		fn
	);
	const [parameterDecorator, parameterExtractor] = createParameterDecorator(
		true,
		fn
	);
	const extractors = {
		classExtractor,
		methodExtractor,
		propertyExtractor,
		parameterExtractor,
	};
	const decorator = (...args: TArgs) => {
		return <T>(
			target: Object,
			propertyKey: string | symbol | undefined,
			propertyDescriptor?: TypedPropertyDescriptor<T> | number
		) => {
			if (!propertyKey && propertyDescriptor == undefined) {
				return classDecorator(...args)(target as Class);
			}
			if (propertyDescriptor && typeof propertyDescriptor === "number") {
				return parameterDecorator(...args)(
					target,
					propertyKey,
					propertyDescriptor
				);
			}
			if (!!propertyKey && propertyDescriptor === undefined) {
				return propertyDecorator(...args)(target, propertyKey);
			}
			if (propertyKey) {
				return methodDecorator(...args)(
					target,
					propertyKey as string | symbol,
					propertyDescriptor as TypedPropertyDescriptor<unknown>
				);
			}
		};
	};
	return [decorator, extractors];
}

export function createDecorator<TMeta, TArgs extends unknown[] = unknown[]>(
	multi: false,
	transformer?: <T>(
		payload: CompoundTransformerPayload<T>,
		...args: TArgs
	) => TMeta
): [CompoundDecorator<TArgs>, CompoundExtractors<TMeta>];
export function createDecorator<TMeta, TArgs extends unknown[] = unknown[]>(
	multi: true,
	transformer?: <T>(
		payload: CompoundTransformerPayload<T>,
		...args: TArgs
	) => TMeta
): [CompoundDecorator<TArgs>, CompoundExtractors<TMeta[]>];
export function createDecorator<TMeta, TArgs extends unknown[] = unknown[]>(
	multi: boolean,
	transformer?: <T>(
		payload: CompoundTransformerPayload<T>,
		...args: TArgs
	) => TMeta
) {
	const fn = <T>(_payload: CompoundTransformerPayload<T>) => ({});
	type TransformerFunction = <T>(
		payload: CompoundTransformerPayload<T>,
		...args: TArgs
	) => TMeta;
	if (!transformer) {
		transformer = fn as unknown as TransformerFunction;
	}
	if (multi) {
		return compoundDecoratorMulti(transformer);
	}
	return compoundDecoratorSingle(transformer);
}

const [decor, extractors] = createDecorator(true);
