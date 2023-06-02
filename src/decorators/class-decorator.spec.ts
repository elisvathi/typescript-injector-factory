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
});
