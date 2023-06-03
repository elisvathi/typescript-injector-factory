import { test, describe, expect } from "@jest/globals";
import { Container, Inject, Service, ServiceScope } from ".";

describe("Di tests", () => {
	test("Simple constructor injection DI (singleton)", () => {
		Container.set("ABC", 13);
		@Service({ scope: ServiceScope.SINGLETON })
		class A {
			public constructor(@Inject("ABC") public value: number = 1) {}
		}

		@Service({ scope: ServiceScope.SINGLETON })
		class B {
			public constructor(public a: A) {}
			public test() {
				this.a.value = 2;
			}
		}

		@Service({ scope: ServiceScope.SINGLETON })
		class C {
			public constructor(public a: A) {}
			public test() {
				this.a.value = 3;
			}
		}
		const b = Container.get<B>(B);
		expect(b?.a.value).toBe(13);
		b?.test();
		expect(b?.a.value).toBe(2);
		const c = Container.get<C>(C);
		expect(c?.a.value).toBe(2);
		c?.test();
		expect(b?.a.value).toBe(3);
		expect(c?.a.value).toBe(3);
	});
	test("Simple constructor injection DI (transient)", () => {
		Container.set("ABC", 13);
		@Service({ scope: ServiceScope.TRANSIENT })
		class A {
			public constructor(@Inject("ABC") public value: number = 1) {}
		}

		@Service({ scope: ServiceScope.SINGLETON })
		class B {
			public constructor(public a: A) {}
			public test() {
				this.a.value = 2;
			}
		}

		@Service({ scope: ServiceScope.SINGLETON })
		class C {
			public constructor(public a: A) {}
			public test() {
				this.a.value = 3;
			}
		}
		const b = Container.get<B>(B);
		expect(b?.a.value).toBe(13);
		b?.test();
		expect(b?.a.value).toBe(2);
		const c = Container.get<C>(C);
		expect(c?.a.value).toBe(13);
		c?.test();
		expect(c?.a.value).toBe(3);
		expect(b?.a.value).toBe(2);
	});
});
