import { createMethodDecorator } from "../../decorators/method-decorator";
import { Class } from "../../utilityTypes";
import { Token } from "../container/Token";

export const [bean, beanExtractor] = createMethodDecorator(
	false,
	(payload, key: Class | Token | string) => {
		return { key };
	}
);
