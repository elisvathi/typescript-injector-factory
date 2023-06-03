import type { InjectorBuilder } from "./InjectorBuilder";
import { InjectorFactory } from "./injectorFactory";
import type { DefaultInjector, InjectorFactoryOptions } from "./types";

export function createInjectorFactory<TContext>(
	defaultInjector?: DefaultInjector<TContext>,
	options: InjectorFactoryOptions = {
		injectPropertiesBeforeConstructor: true,
	}
): InjectorBuilder<TContext> {
	return new InjectorFactory<TContext>(defaultInjector, options);
}
