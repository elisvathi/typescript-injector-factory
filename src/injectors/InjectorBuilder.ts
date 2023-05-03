import type { InjectorResolver } from "./InjectorResolver";
import type { CreateInjectorFn, InjectorDecorator } from "./types";

export interface InjectorBuilder<TContext> {
	createInjector<TReturn, TArgs extends unknown[] = []>(
		fn: CreateInjectorFn<TContext, TReturn, TArgs>
	): InjectorDecorator<TArgs>;
	with(ctx: TContext): InjectorResolver;
}
