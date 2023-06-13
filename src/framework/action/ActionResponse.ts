class ActionResponseBuilder<TBody = unknown> {
	private _statusCode?: number;
	private _statusText?: string;
	private _body?: TBody;
	private _headers?: Record<string, string | string[]>;

	public statusCode(statusCode?: number): ActionResponseBuilder<TBody> {
		this._statusCode = statusCode;
		return this;
	}

	public statusText(statusText?: string): ActionResponseBuilder<TBody> {
		this._statusText = statusText;
		return this;
	}

	public body<T = TBody>(body?: T): ActionResponseBuilder<T> {
		const builder = new ActionResponseBuilder<T>();
		builder._headers = this._headers;
		builder._statusCode = this._statusCode;
		builder._statusText = this._statusText;
		builder._body = body;
		return builder;
	}

	public headers(
		headers?: Record<string, string | string[]>
	): ActionResponseBuilder<TBody> {
		this._headers = headers;
		return this;
	}

	public build(): ActionResponse<TBody> {
		return new ActionResponse(
			this._statusCode,
			this._statusText,
			this._body,
			this._headers
		);
	}
}

export class ActionResponse<TBody = unknown> {
	public constructor(
		private _statusCode?: number,
		private _statusText?: string,
		private _body?: TBody,
		private _headers?: Record<string, string | string[]>
	) {}

	public static builder<
		T extends unknown = unknown
	>(): ActionResponseBuilder<T> {
		return new ActionResponseBuilder();
	}

	public builder(): ActionResponseBuilder<TBody> {
		return ActionResponse.builder()
			.body(this.body)
			.statusText(this.statusText)
			.headers(this.headers)
			.statusCode(this.statusCode);
	}

	public get statusCode(): number | undefined {
		return this._statusCode;
	}

	public get statusText(): string | undefined {
		return this._statusText;
	}

	public get body(): TBody | undefined {
		return this._body;
	}

	public get headers(): Record<string, string | string[]> | undefined {
		return this._headers;
	}
}
