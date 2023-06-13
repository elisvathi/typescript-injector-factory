import { Component } from "../../di";
import { ServiceScope } from "../../di/types";
import { Class } from "../../utilityTypes";
import { controllerExtractor } from "../decorators/controller";
import { Verb, routeExtractor } from "../decorators/route";

type OnControllerRegistered = <T>(payload: {
	class: Class<T>;
	path?: string;
}) => void;
type OnRouteRegistered = <T>(payload: {
	class: Class<T>;
	controllerPath?: string;
	methodPath?: string;
	verb: Verb | string;
	paramTypes: Class[];
	returnType: Class;
}) => void;

@Component({ scope: ServiceScope.SINGLETON })
export class EndpointRegistry {
	private controllerSubscribers: Array<OnControllerRegistered> = [];
	private routeSubscribers: Array<OnRouteRegistered> = [];

	public onController(cb: OnControllerRegistered): void {
		this.controllerSubscribers.push(cb);
	}

	public onRoute(cb: OnRouteRegistered): void {
		this.routeSubscribers.push(cb);
	}

	public start() {
		const controllers = controllerExtractor.getClasses();
		controllers.forEach((controller) => {
			const classMeta = controllerExtractor.getValue(controller);
			if (classMeta) {
				this.controllerSubscribers.forEach((subscriber) => {
					subscriber(classMeta);
				});
				const routeMethods = routeExtractor.decoratedMethods(
					classMeta.class
				);
				routeMethods.forEach((method) => {
					const methodMeta = routeExtractor.getMetadata(
						classMeta.class,
						method
					);
					if (methodMeta) {
						methodMeta.methods.forEach((verb) => {
							this.routeSubscribers.forEach((subscriber) => {
								subscriber({
									class: classMeta.class,
									controllerPath: classMeta.path,
									methodPath: methodMeta.path,
									paramTypes: methodMeta.paramTypes,
									returnType: methodMeta.returnType,
									verb: verb,
								});
							});
						});
					}
				});
			}
		});
	}
}
