### Typescript Injector Factory (WIP)

This library aims building custom injectors for instance fields,
constructor and method parameters.

#### Usage

```typescript
import { createInjectorFactory } from "./injectors/injectorFactory";

type Context = Record<string, unknown>; // The context can be any type
const factory = createInjectorFactory<Context>();

const ExtractValue = factory.createInjector(
	/*
	 * The extra parameters after the payload argument can be custom and the resulting
	 * curried decorator will require them
	 */
	(payload, key: string, options: { required: boolean }) => {
		const context: Context = payload.context;
		const value = context[key];
		if (!value && options.required) {
			throw new Error(`${key} is required!`);
		}
		return value;
	}
);


// This produces a decorator generator in the form:
@ExtractValue(key: string, options: {required: boolean})
```

This can be used as a decorator on consturctor parameters,
method parameters and fields
Multiple decorators can be created from the same factory

```typescript
const AccountValue = factory.createInjector((payload) => {
	const context: Context = payload.context.account;
});
class SampleClass {
	@AccountValue()
	private account: number;

	public constructor(
		@ExtractValue("name", { required: true }) private name: string,
		@ExtractValue("lastName", { required: true }) private lastName: string
	) {
			console.log(`First name: ${this.name} - Last name: ${this.lastName}`):
	}

	public someMethod(@ExtractValue("age", { required: false }) age: number) {
		console.log(`Age is ${age}`);
	}

	public logAccount() {
		console.log(`Account value is ${this.account}`);
	}
}
```

To construct the instances and call its methods we have to provide a concrete context

```typescript
const concreteContext : Context = { name: "John", lastName: "Doe", age: 23, ... };
const someOtherContext: Context = { account: 100 };

// Construction
const instance: SampleClass = factory.with(concreteContext).construct(SampleClass);
// First name: John - Last name: Doe

// Method execution
factory.with(concreteContext).call(instance, "someMethod");
// Age is 23

// Method execution with another context
factory.with(someOtherContext).call(new SampleClass("John", "Doe"), "logAcount");
// Account value is 100
```

We can also provice a default injector if none is specified for any parameter
If no injector is found and the default injector is not given it will throw an error

```typescript
const factory = createInjectorFactory<Context>((payload) => undefined);
```

#### Examples

Express example

```typescript
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
```

TODO:

-   [ ] Async resolvers
-   [ ] Fix types in the API
-   [ ] Fix types in the internal implemenation
-   [ ] Typecheck and/or Throw error when calling a non-existent method
