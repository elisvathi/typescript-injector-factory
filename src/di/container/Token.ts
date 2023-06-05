export class Token<_T = unknown> {
	private constructor() {}
	public static new<T>(): Token<T> {
		return new Token<T>();
	}
}
