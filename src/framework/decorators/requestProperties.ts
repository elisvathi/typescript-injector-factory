import { injectorFactory } from "../../di/decorators/inject";
import { ActionRequest } from "../action/ActionRequest";
import { IncomingAction } from "../action/IncomingAction";

const requestPropertyExtractor = <TArgs extends unknown[] = []>(
	fn: (request: ActionRequest, ...args: TArgs) => unknown
) =>
		injectorFactory.createInjector((payload, ...injArgs: TArgs) => {
			const action = payload.context.get<IncomingAction>(IncomingAction);
			if (action) {
				return fn(action.request, ...injArgs);
			}
		});

/**
 * Full Request
 */
export const Request = requestPropertyExtractor((r) => r)();

/**
 * Request body
 */
export const Body = requestPropertyExtractor((r) => r.body)();

/**
 * Request query
 */
export const Query = requestPropertyExtractor((r) => r.query)();
export const QueryParameter = requestPropertyExtractor((r, name: string) =>
	r.query ? r.query[name] : undefined
);

/**
 * Request method
 */
export const Method = requestPropertyExtractor((r) => r.method)();

/**
 * Request path
 */
export const PathParameters = requestPropertyExtractor((r) => r.params)();
export const PathParameter = requestPropertyExtractor((r, name: string) =>
	r.params ? r.params[name] : undefined
);
export const Path = requestPropertyExtractor((r) => r.url)();

/**
 * Request headers
 */
export const Headers = requestPropertyExtractor((r) => r.headers)();
export const Header = requestPropertyExtractor((r, name: string) =>
	r.headers ? r.headers[name] : undefined
);
