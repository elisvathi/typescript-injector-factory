import { createInjectorFactory } from "../src";
import express from "express";

const app = express();

const factory = createInjectorFactory<express.Request>();

const headers = factory.createInjector((payload) => {
	return payload.context.headers;
});

class SimpleHandler {
	async handle(
		@headers() headers: Record<string, string | string[]>
	): Promise<Record<string, string | string[]>> {
		return headers;
	}
}

const handler = new SimpleHandler();

app.use("*", async (request, response) => {
	const result: string = await factory.with(request).call(handler, "handle");
	response.send(result);
});

app.listen(8080, "0.0.0.0", () => {
	console.log(`Listening to 8080`);
});
