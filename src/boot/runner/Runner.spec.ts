import { describe, expect } from "@jest/globals";
import { test } from "@jest/globals";
import {
	GlobalDiContainer,
	Initializable,
	Inject,
} from "../../di/container/DIContainer";
import { Configuration } from "../decorators/configuration";
import { Bean } from "../decorators/bean";
import { Runner } from "./Runner";
import { ServiceScope } from "../../di/types";

describe("Boot runner tests", () => {
	class B implements Initializable {
		public constructor() {
		}
		public value?: string = undefined;
		public async init(): Promise<void> {
			await new Promise((resolve) => {
				setTimeout(resolve, 3000);
			});
			this.value = "done";
		}
	}

	class A {
		public constructor(b: B) {
			expect(b.value).toBe("done");
		}
	}

	@Configuration()
	class Config {
		public constructor(private b: B) {}
		@Bean({ scope: ServiceScope.SINGLETON })
		public getA(): A {
			return new A(this.b);
		}
	}

	const runner = GlobalDiContainer.get<Runner>(Runner);

	test("Runner initialized sync beans correctly", async () => {
		await runner?.start();
	});
});
