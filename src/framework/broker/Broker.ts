import { Class } from "../../utilityTypes";
import { EndpointRegistry } from "../registry/EndpointRegistry";
import { filterBrokerExtractor } from "./filter-decorators";

export abstract class Broker {
	public constructor(registry: EndpointRegistry) {
		registry.onRoute((route) => {
			this.handleRouteRegistered(route);
		});
	}

	private handleRouteRegistered(route: {
		class: Class;
		controllerPath?: string | undefined;
		methodPath?: string | undefined;
		methodName: string | symbol;
		verb: string;
		paramTypes: Class[];
		returnType: Class;
	}) {
		const classFilters = filterBrokerExtractor.classExtractor.getValue(
			route.class
		);
		const routeFilters = filterBrokerExtractor.methodExtractor.getMetadata(
			route.class,
			route.methodName
		);
		const allFilters = [...(classFilters || []), ...(routeFilters || [])];
		if (allFilters.every((filter) => filter(this))) {
			this.registerRoute(route);
		}
	}

	protected abstract registerRoute(route: {
		class: Class;
		controllerPath?: string | undefined;
		methodPath?: string | undefined;
		methodName: string | symbol;
		verb: string;
		paramTypes: Class[];
		returnType: Class;
	}): void;
}
