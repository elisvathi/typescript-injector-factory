import { IDIContainer } from "../../di/container/IDIContainer";
import { ActionRequest } from "./ActionRequest";

export class IncomingAction<TRequest = unknown> {
	public constructor(
		private readonly _context: IDIContainer,
		private readonly _request: ActionRequest<TRequest>
	) {}

	public get context(): IDIContainer {
		return this._context;
	}

	public get request(): ActionRequest<TRequest> {
		return this._request;
	}

	public withRequest<T>(request: ActionRequest<T>): IncomingAction<T> {
		return new IncomingAction<T>(this._context, request);
	}
}
