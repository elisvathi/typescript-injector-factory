import { createClassDecorator } from "../../decorators/class-decorator";

export const [Configuration, configurationExtractor] =
	createClassDecorator(false);
