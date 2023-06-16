import { createDecorator } from "../../decorators/compound-decorators";
import { Broker } from "../broker/Broker";

export const [FilterBroker, filterBrokerExtractor] = createDecorator(
	true,
	(_payload, predicate: (br: Broker) => boolean) => {
		return predicate;
	}
);

export const ExcludeBroker = (predicate: (br: Broker) => boolean) =>
	FilterBroker((br) => !predicate(br));
