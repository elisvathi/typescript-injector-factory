import "reflect-metadata";
import { Class } from "../utilityTypes";

const PARAM_TYPES_KEY = "design:paramtypes";
const RETURN_TYPE_KEY = "design:returntype";
const TYPE_KEY = "design:type";
export function extractMethodParamTypes<T extends Object>(
	instance: T,
	methodName?: string | symbol
): Array<Class> {
	return methodName
		? Reflect.getMetadata(PARAM_TYPES_KEY, instance, methodName)
		: Reflect.getMetadata(PARAM_TYPES_KEY, instance.constructor) || [];
}

export function extractMethodReturnType<T extends Object>(
	instance: T,
	methodName: string | symbol
) {
	return Reflect.getMetadata(RETURN_TYPE_KEY, instance, methodName) || Object;
}

export function extractPropertyType<T extends Object>(
	instance: T,
	propertyKey: string | symbol
) {
	return Reflect.getMetadata(TYPE_KEY, instance, propertyKey) || Object;
}

export function extractParameterType<T extends Object>(
	instance: T,
	methodName: string | symbol | undefined,
	parameterIndex: number
) {
	const paramTypes = extractMethodParamTypes(instance, methodName);
	return paramTypes[parameterIndex] || Object;
}

export function getInheritanceHierarchy<T>(
	cl: Class<T>,
	accumulator: Class[] = []
): Class[] {
	const newAccumulator = [...accumulator, cl];
	const proto = Object.getPrototypeOf(cl);
	if (typeof proto !== "function") {
		return newAccumulator;
	}
	return getInheritanceHierarchy(proto, newAccumulator);
}
