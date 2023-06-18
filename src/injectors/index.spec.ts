import { test, describe, expect } from "@jest/globals";
import { createInjectorFactory } from "../../src";

describe("Injections tests", () => {
	const factory = createInjectorFactory<Record<string, unknown>>();
	const inject = factory.createInjector((p) => p.context.value);

	test("Field injection", () => {
		class Test {
			@inject()
			public value?: number;
		}
		const instance = factory.with({ value: 123 }).construct(Test);
		expect(instance.value).toBe(123);
	});

	test("Method injection", () => {
		class Test {
			public method(@inject() value: number): number {
				return value;
			}
		}
		const instance = new Test();
		expect(factory.with({ value: 123 }).call(instance, "method")).toBe(123);
	});

	test("Constructor injection", () => {
		class Test {
			public constructor(@inject() public value: number) {}
		}
		expect(factory.with({ value: 123 }).construct(Test).value).toBe(123);
	});
});

describe("Default injector tests", () => {
	const factory = createInjectorFactory<Record<string, any>>(
		(payload) => payload.context.defaultValue
	);
	const inject = factory.createInjector((p) => p.context.value);

	test("Method injection", () => {
		class Test {
			public method(
				@inject() _value: number,
					secondValue: number
			): number {
				return secondValue;
			}
		}
		const instance = new Test();
		expect(
			factory
				.with({ value: 123, defaultValue: 456 })
				.call(instance, "method")
		).toBe(456);
	});

	test("Constructor injection", () => {
		class Test {
			public constructor(
				@inject() public value: number,
				public secondValue: number
			) {}
		}
		expect(
			factory.with({ value: 123, defaultValue: 456 }).construct(Test)
				.secondValue
		).toBe(456);
	});
});

describe("Aync injectors", () => {
	const factory = createInjectorFactory<Record<string, unknown>>();
	const inject = factory.createInjector(async (p) => {
		return await new Promise<any>((resolve) => {
			setTimeout(() => resolve(p.context.value), 500);
		});
	});

	test("Field injection", async () => {
		class Test {
			@inject()
			public value?: number;
		}
		const instance = await factory.with({ value: 123 }).constructAsync(Test);
		expect(instance.value).toBe(123);
	});

	test("Method injection", async () => {
		class Test {
			public method(@inject() value: number): number {
				return value;
			}
		}
		const instance = new Test();
		expect(
			await factory.with({ value: 123 }).callAsync(instance, "method")
		).toBe(123);
	});

	test("Constructor injection", async () => {
		class Test {
			public constructor(@inject() public value: number) {}
		}
		expect(
			(await factory.with({ value: 123 }).constructAsync(Test)).value
		).toBe(123);
	});
});
