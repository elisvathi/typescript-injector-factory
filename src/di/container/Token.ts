export class Token<_T = unknown> {
	public static new<T>(): Token<T> {
		return new Token<T>();
	}
}
