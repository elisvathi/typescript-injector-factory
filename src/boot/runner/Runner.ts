import { Component, GlobalDiContainer } from "../../di";
import { ServiceScope } from "../../di/types";
import { BeanResolver } from "../resolver/BeanResolver";

@Component({ scope: ServiceScope.SINGLETON })
export class Runner {
	public constructor () {
		GlobalDiContainer.get(BeanResolver);
	}

	public async start (): Promise<void> {
		const services = GlobalDiContainer.listServices(ServiceScope.SINGLETON);
		for (const service of services) {
			await GlobalDiContainer.getAsync(service.key);
		}
	}
}
