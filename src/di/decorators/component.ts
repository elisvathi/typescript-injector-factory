import { createClassDecorator } from "../../decorators/class-decorator";
import { Class } from "../../utilityTypes";
import { Token } from "../container/Token";
import { ServiceScope } from "../types";

export const [component, componentExtractor] = createClassDecorator(
	false,
	(
		_payload,
		options?: { scope: ServiceScope; key?: Token | Class | string }
	) => {
		return { options };
	}
);
