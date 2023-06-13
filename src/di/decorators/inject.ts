import { createInjectorFactory } from "../../injectors";
import type { Class } from "../../utilityTypes";
import type { IDIContainer } from "../container/IDIContainer";
import type { Token } from "../container/Token";

export const injectorFactory = createInjectorFactory<IDIContainer>((p) => {
	if (p.isProperty) {
		return undefined;
	}
	if (p.async && p.type) {
		return p.context.getAsync(p.type) as any;
	} else if (p.type) {
		return p.context.get(p.type) as any;
	}
});

export const inject = injectorFactory.createInjector(
	(payload, key?: string | Class | Token) => {
		if (payload.async) {
			if (key) {
				return payload.context.getAsync(key);
			} else if (payload.type) {
				return payload.context.getAsync(payload.type);
			}
			return undefined;
		}
		if (key) {
			return payload.context.get(key);
		} else if (payload.type) {
			return payload.context.get(payload.type);
		}
	}
);
