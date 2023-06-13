import { createMethodDecorator } from "../../decorators/method-decorator";

export enum Verb {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	PATCH = "PATCH",
	DELETE = "DELETE",
	OPTIONS = "OPTIONS",
}

export const [Route, routeExtractor] = createMethodDecorator(
	false,
	(payload, methods: (Verb | string)[], path?: string) => {
		return { ...payload, methods, path };
	}
);

export const Get = (path?: string) => Route([Verb.GET], path);
export const Post = (path?: string) => Route([Verb.POST], path);
export const Put = (path?: string) => Route([Verb.PUT], path);
export const Patch = (path?: string) => Route([Verb.PATCH], path);
export const Delete = (path?: string) => Route([Verb.DELETE], path);
export const Options = (path?: string) => Route([Verb.OPTIONS], path);
