/* eslint-disable no-mixed-spaces-and-tabs */
import { describe, expect, test } from "@jest/globals";
import {
	Component,
	type Initializable,
} from "../../di/container/DIContainer";
import { Configuration } from "../decorators/configuration";
import { Bean } from "../decorators/bean";
import { Runner } from "./Runner";

describe("Boot runner tests", () => {
	let called = false;
	@Component()
	class B implements Initializable {

		public value?: string = undefined;
		public async init (): Promise<void> {
			await new Promise((resolve) => {
				setTimeout(resolve, 3000);
			});
			this.value = "done";
		}
	}

	class A {
		public constructor (b: B) {
			called = true;
			expect(b.value).toBe("done");
		}
	}

  @Configuration()
	class Config {
  	public constructor (private readonly b: B) {}
		@Bean()
  	public getA (): A {
  		return new A(this.b);
  	}
  }

  // const runner = GlobalDiContainer.get<Runner>(Runner);
  const runner = new Runner();

  test("Runner initialized async beans correctly", async () => {
  	await runner?.start();
  	expect(called).toBe(true);
  });
});
