import { createInjectorFactory } from "../../injectors";
import type { Class } from "../../utilityTypes";
import type { IDIContainer } from "../container/IDIContainer";
import type { Token } from "../container/Token";

export const injectorFactory = createInjectorFactory<IDIContainer>((p) => {
	return p.context.get(p.type) as any;
});

export const inject = injectorFactory.createInjector(
	(payload, key?: string | Class | Token) => {
		return payload.context.getAsync(key || payload.type);
	}
);
