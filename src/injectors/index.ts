import type { InjectorBuilder } from "./factory/InjectorBuilder";
import { InjectorFactory } from "./factory/injectorFactory";
import type { DefaultInjector } from "./types";

export function createInjectorFactory<TContext>(
	defaultInjector?: DefaultInjector<TContext>,
): InjectorBuilder<TContext> {
	return new InjectorFactory<TContext>(defaultInjector);
}
