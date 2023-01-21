class Linq<T> {
	public rows: T[] = [];

	constructor(rows: T[]) {
		this.rows = rows;
	}

	public FirstOrDefault(predicate: (row: T) => boolean = (row: T): boolean => true): T {
		return this.rows.find(predicate);
	}

	public Where(predicate: (row: T) => boolean = (row: T): boolean => true): Linq<T> {
		return new Linq<T>(this.rows.filter(predicate));
	}

	public Select<TResult>(selector: (row: T) => TResult): Linq<TResult> {
		return new Linq<TResult>(this.rows.map(selector));
	}

	public Add(item: T): void {
		this.rows.push(item);
	}

	public AddRange(item: T[]): void {
		this.rows.push(...item);
	}

	public Remove(item: T): void {
		this.rows = this.rows.filter((row: T) => row !== item);
	}

	public RemoveRange(items: T[]): void {
		this.rows = this.rows.filter((row: T) => !items.includes(row));
	}

	public Sort(comparer: (a: T, b: T) => number): Linq<T> {
		return new Linq<T>(this.rows.sort(comparer));
	}

	public OrderBy(keySelector: (row: T) => any): Linq<T> {
		return new Linq<T>(
			this.rows.sort((a: T, b: T) => {
				let aKey: any = keySelector(a);
				let bKey: any = keySelector(b);
				if (aKey < bKey) {
					return -1;
				} else if (aKey > bKey) {
					return 1;
				} else {
					return 0;
				}
			}),
		);
	}

	public ToArray(): T[] {
		return this.rows;
	}
}

export default Linq;
