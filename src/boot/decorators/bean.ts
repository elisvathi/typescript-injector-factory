import { createMethodDecorator } from "../../decorators/method-decorator";
import { Token } from "../../di/container/Token";
import { ServiceScope } from "../../di/types";
import { Class } from "../../utilityTypes";

export const [Bean, beanExtractor] = createMethodDecorator(
	false,
	(payload, options?: {key?: Class | Token | string, scope?: ServiceScope}) => {
		const returnType = payload.returnType;
		if (
			(returnType === Promise ||
				returnType === (Array as unknown as Class)) &&
			!options?.key
		) {
			throw new Error(
				"Since @Bean method returns a wrapper object, you have to specify it's internal type using @Bean(<type>)"
			);
		}
		return {
			key: options?.key || payload.returnType,
			isPromise: returnType == Promise,
			scope: options?.scope || ServiceScope.SINGLETON,
		};
	}
);
