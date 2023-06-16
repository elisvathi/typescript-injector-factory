import { Component, GlobalDiContainer } from "../../di";
import { injectorFactory } from "../../di/decorators/inject";
import { ServiceScope } from "../../di/types";
import { beanExtractor } from "../decorators/bean";
import { configurationExtractor } from "../decorators/configuration";

@Component({ scope: ServiceScope.SINGLETON })
export class Runner {
	public async start() {
		const configurationClasses = configurationExtractor.getClasses();
		for (const cl of configurationClasses) {
			const beanMethods = beanExtractor.decoratedMethods(cl);
			const instance = await GlobalDiContainer.getAsync(cl);
			if (instance) {
				for (const method of beanMethods) {
					const beanMetadata = beanExtractor.getMetadata(cl, method);
					if (
						beanMetadata &&
						beanMetadata.scope === ServiceScope.SINGLETON
					) {
						const bean = await injectorFactory
							.with(GlobalDiContainer)
							.callAsync(instance, method as string); // TODO: String or symbol here
						GlobalDiContainer.set(beanMetadata.key, bean);
					}
				}
			}
		}
	}
}
