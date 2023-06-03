import { test, describe, expect } from "@jest/globals";
import { createClassDecorator } from "./class-decorator";

describe("Class decorator tests", () => {
	test("Empty Multi decorator", () => {
		const [decorator, extractors] = createClassDecorator(false);
		@decorator()
		@decorator()
		class A {}
		expect(extractors.getClasses().length).toBe(1);
		expect(extractors.getClasses()).toContain(A);
		expect(extractors.getValue(A)).toBeTruthy();
		expect(Array.isArray(extractors.getValue(A))).toBe(false);
	});

	test("Empty Multi decorator", () => {
		const [decorator, extractors] = createClassDecorator(true);
		@decorator()
		@decorator()
		class A {}
		expect(extractors.getClasses().length).toBe(1);
		expect(extractors.getClasses()).toContain(A);
		expect(extractors.getValue(A)).toBeTruthy();
		expect(Array.isArray(extractors.getValue(A))).toBe(true);
		expect(extractors.getValue(A)?.length).toBe(2);
	});

	test("Processing Single decorator", () => {
		const [decorator, extractors] = createClassDecorator(
			false,
			(_payload, value: number) => value
		);
		@decorator(3)
		@decorator(3)
		class A {}
		expect(extractors.getClasses().length).toBe(1);
		expect(extractors.getClasses()).toContain(A);
		expect(extractors.getValue(A)).toBeTruthy();
		expect(Array.isArray(extractors.getValue(A))).toBe(false);
		expect(extractors.getValue(A)).toBe(3);
	});

	test("Processing Multi decorator", () => {
		const [decorator, extractors] = createClassDecorator(
			true,
			(_payload, value: number) => value
		);
		@decorator(4)
		@decorator(3)
		class A {}
		expect(extractors.getClasses().length).toBe(1);
		expect(extractors.getClasses()).toContain(A);
		expect(extractors.getValue(A)).toBeTruthy();
		expect(Array.isArray(extractors.getValue(A))).toBe(true);
		expect(extractors.getValue(A)).toContain(3);
		expect(extractors.getValue(A)).toContain(4);
	});
});
