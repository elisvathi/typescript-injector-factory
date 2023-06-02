export type Class<T = unknown> = (new (...args: any[]) => T) & Function;

export type MethodOf<TClass> = keyof TClass; // TODO: fix this type
