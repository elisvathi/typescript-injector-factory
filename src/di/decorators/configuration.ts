import { createClassDecorator } from "../../decorators/class-decorator";

export const [configuration, configurationExtractor] =
	createClassDecorator(false);
