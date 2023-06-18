import { Component, GlobalDiContainer } from "../../di";
import { injectorFactory } from "../../di/decorators/inject";
import { ServiceScope } from "../../di/types";
import { Class } from "../../utilityTypes";
import { ActionRequest } from "../action/ActionRequest";
import { ActionResponse } from "../action/ActionResponse";
import { IncomingAction } from "../action/IncomingAction";
import { OutgoingAction } from "../action/OutgoingAction";

@Component({ scope: ServiceScope.SINGLETON })
export class Pipeline {
	public async handle<TRequest, TResponse>(
		input: ActionRequest<TRequest>,
		controller: Class,
		method: string | symbol
	): Promise<OutgoingAction<TRequest, TResponse>> {
		const context = GlobalDiContainer.createChildContainer();
		const action = new IncomingAction(context, input);
		context.set(IncomingAction, action);
		const controllerInstance = await context.getAsync(controller);
		const methodResult: TResponse = await injectorFactory
			.with(context)
			.callAsync(controllerInstance as Object, method as string); //TODO: Fix this it should accept string | symbol
		const response = ActionResponse.builder()
			.body(methodResult)
			.statusCode(200)
			.statusText("OK")
			.build();
		return OutgoingAction.from<TRequest, TResponse>(action, response);
	}
}
