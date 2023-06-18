import { configurationExtractor } from "../decorators/configuration";
import { beanExtractor } from "../decorators/bean";
import { injectorFactory } from "../../di/decorators/inject";
import { Component, GlobalDiContainer } from "../../di";

@Component()
export class BeanResolver {
	public constructor () {
		this.bindResolvers();
		console.log("Beans resolved!");
	}

	private bindResolvers (): void {
		const configurationClasses = configurationExtractor.getClasses();
		for (const cl of configurationClasses) {
			const beanMethods = beanExtractor.decoratedMethods(cl);
			for (const method of beanMethods) {
				const beanMetadata = beanExtractor.getMetadata(cl, method);
				if (
					beanMetadata
				) {
					if (beanMetadata.isPromise) {
						GlobalDiContainer.setAsyncResolver(beanMetadata.key, async (ctx) => {
							const configurationClass = await ctx.getAsync(cl) as Object;
							const beanValue = await injectorFactory.with(ctx).callAsync(configurationClass, method as string); //TODO: String or symbol here
							return beanValue as any; //TODO: typeCheck here
						}, beanMetadata.scope);
					} else {
						GlobalDiContainer.setResolver(beanMetadata.key, (ctx) => {
							const configurationClass = ctx.get(cl) as Object;
							const beanValue = injectorFactory.with(ctx).call(configurationClass, method as string); //TODO: String or symbol here
							return beanValue as any; //TODO: typeCheck here
						}, beanMetadata.scope);
					}
				}
			}
		}

	}
}
