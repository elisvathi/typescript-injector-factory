import { Verb } from "../decorators/route";

class ActionRequestBuilder<TBody = unknown> {
	private _url?: string;
	private _body?: TBody;
	private _headers?: Record<string, string | string[]>;
	private _query?: Record<string, string | string[]>;
	private _method?: Verb | string;
	private _params?: Record<string, unknown>;

	public url(url?: string): ActionRequestBuilder<TBody> {
		this._url = url;
		return this;
	}

	public body<T = TBody>(body?: T): ActionRequestBuilder<T> {
		const builder = new ActionRequestBuilder<T>();
		builder._headers = this._headers;
		builder._url = this._url;
		builder._query = this._query;
		builder._params = this._params;
		builder._method = this._method;
		builder.body(body);
		return builder;
	}

	public method(method?: Verb | string): ActionRequestBuilder<TBody> {
		this._method = method;
		return this;
	}

	public query(
		query?: Record<string, string | string[]>
	): ActionRequestBuilder<TBody> {
		this._query = query;
		return this;
	}

	public headers(
		headers?: Record<string, string | string[]>
	): ActionRequestBuilder<TBody> {
		this._headers = headers;
		return this;
	}

	public params(
		params?: Record<string, unknown>
	): ActionRequestBuilder<TBody> {
		this._params = params;
		return this;
	}

	public build(): ActionRequest<TBody> {
		return new ActionRequest(
			this._url,
			this._body,
			this._headers,
			this._query,
			this._method,
			this._params
		);
	}
}
export class ActionRequest<TBody = unknown> {
	public constructor(
		private readonly _url?: string,
		private readonly _body?: TBody,
		private readonly _headers?: Record<string, string | string[]>,
		private readonly _query?: Record<string, string | string[]>,
		private readonly _method?: Verb | string,
		private readonly _params?: Record<string, unknown>
	) {}

	public get url(): string | undefined {
		return this._url;
	}

	public get body(): TBody | undefined {
		return this._body;
	}

	public get headers(): Record<string, string | string[]> | undefined {
		return this._headers;
	}

	public get method(): Verb | string | undefined {
		return this._method;
	}

	public get query(): Record<string, string | string[]> | undefined {
		return this._query;
	}

	public get params(): Record<string, unknown> | undefined {
		return this._params;
	}

	public static builder<T>(): ActionRequestBuilder<T> {
		return new ActionRequestBuilder<T>();
	}

	public builder(): ActionRequestBuilder<TBody> {
		return ActionRequest.builder()
			.url(this._url)
			.headers(this._headers)
			.query(this._query)
			.params(this._params)
			.method(this._method)
			.body(this._body);
	}
}
