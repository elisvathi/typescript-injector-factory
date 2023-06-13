import { IDIContainer } from "../../di/container/IDIContainer";
import { ActionRequest } from "./ActionRequest";
import { ActionResponse } from "./ActionResponse";
import { IncomingAction } from "./IncomingAction";

export class OutgoingAction<TRequest = unknown, TResponse = unknown> {
	private constructor(
		private readonly _context: IDIContainer,
		private readonly _request: ActionRequest<TRequest>,
		private readonly _response: ActionResponse<TResponse>
	) {}

	public get context(): IDIContainer {
		return this._context;
	}

	public get request(): ActionRequest<TRequest> {
		return this._request;
	}

	public get response(): ActionResponse<TResponse> {
		return this._response;
	}

	public static from<TRequest, TResponse>(
		incomingAction: IncomingAction<TRequest>,
		response: ActionResponse<TResponse>
	): OutgoingAction<TRequest, unknown> {
		return new OutgoingAction(
			incomingAction.context,
			incomingAction.request,
			response
		);
	}

	public withResponse<T>(
		response: ActionResponse<T>
	): OutgoingAction<TRequest, T> {
		return new OutgoingAction<TRequest, T>(
			this._context,
			this._request,
			response
		);
	}
}
