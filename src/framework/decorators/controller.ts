import { createClassDecorator } from "../../decorators/class-decorator";

export const [Controller, controllerExtractor] = createClassDecorator(
	false,
	(payload, path?: string) => {
		return { class: payload.class, path };
	}
);
