class Linq<T> {
	public rows: T[] = [];

	constructor(rows: T[] = []) {
		this.rows = rows;
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

	public ToMap<TKey, TValue>(keySelector: (row: T) => TKey, valueSelector: (row: T) => TValue): Map<TKey, TValue> {
		let map: Map<TKey, TValue> = new Map<TKey, TValue>();
		this.rows.forEach((row: T) => {
			map.set(keySelector(row), valueSelector(row));
		});
		return map;
	}

	public ToArray(): T[] {
		return this.rows;
	}

	public Any(predicate: (row: T) => boolean = (row: T): boolean => true): boolean {
		return this.rows.some(predicate);
	}

	public All(predicate: (row: T) => boolean = (row: T): boolean => true): boolean {
		return this.rows.every(predicate);
	}

	public Sum(selector: (row: T) => number): number {
		return this.rows.reduce((sum: number, row: T) => sum + selector(row), 0);
	}

	public Min(selector: (row: T) => number): number {
		return Math.min(...this.rows.map(selector));
	}

	public Max(selector: (row: T) => number): number {
		return Math.max(...this.rows.map(selector));
	}

	public Average(selector: (row: T) => number): number {
		return this.Sum(selector) / this.rows.length;
	}

	public Distinct(): Linq<T> {
		return new Linq<T>([...new Set(this.rows)]);
	}

	public DistinctBy<TKey>(keySelector: (row: T) => TKey): Linq<T> {
		return new Linq<T>([...new Map(this.rows.map((row: T) => [keySelector(row), row])).values()]);
	}

	public Select<TResult>(selector: (row: T) => TResult): Linq<TResult> {
		return new Linq<TResult>(this.rows.map(selector));
	}

	public SelectMany<TResult>(selector: (row: T) => TResult[]): Linq<TResult> {
		return new Linq<TResult>(this.rows.reduce((result: TResult[], row: T) => result.concat(selector(row)), []));
	}

	public Where(predicate: (row: T) => boolean): Linq<T> {
		return new Linq<T>(this.rows.filter(predicate));
	}

	public Skip(count: number): Linq<T> {
		return new Linq<T>(this.rows.slice(count));
	}

	public SkipWhile(predicate: (row: T) => boolean): Linq<T> {
		let index: number = this.rows.findIndex((row: T) => !predicate(row));
		return new Linq<T>(index === -1 ? [] : this.rows.slice(index));
	}

	public Take(count: number): Linq<T> {
		return new Linq<T>(this.rows.slice(0, count));
	}

	public TakeWhile(predicate: (row: T) => boolean): Linq<T> {
		let index: number = this.rows.findIndex((row: T) => !predicate(row));
		return new Linq<T>(index === -1 ? this.rows : this.rows.slice(0, index));
	}

	public OrderBy<TKey>(keySelector: (row: T) => TKey): Linq<T> {
		return new Linq<T>(
			this.rows.slice().sort((a: T, b: T) => {
				let keyA: TKey = keySelector(a);
				let keyB: TKey = keySelector(b);
				return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
			}),
		);
	}

	public OrderByDescending<TKey>(keySelector: (row: T) => TKey): Linq<T> {
		return new Linq<T>(
			this.rows.slice().sort((a: T, b: T) => {
				let keyA: TKey = keySelector(a);
				let keyB: TKey = keySelector(b);
				return keyA < keyB ? 1 : keyA > keyB ? -1 : 0;
			}),
		);
	}

	public Reverse(): Linq<T> {
		return new Linq<T>(this.rows.slice().reverse());
	}

	public ThenBy<TKey>(keySelector: (row: T) => TKey): Linq<T> {
		return this.OrderBy(keySelector);
	}

	public ThenByDescending<TKey>(keySelector: (row: T) => TKey): Linq<T> {
		return this.OrderByDescending(keySelector);
	}

	public Union(second: Linq<T>): Linq<T> {
		return new Linq<T>([...new Set(this.rows.concat(second.rows))]);
	}

	public Intersect(second: Linq<T>): Linq<T> {
		return new Linq<T>(this.rows.filter((row: T) => second.rows.indexOf(row) !== -1));
	}

	public Except(second: Linq<T>): Linq<T> {
		return new Linq<T>(this.rows.filter((row: T) => second.rows.indexOf(row) === -1));
	}

	public Concat(second: Linq<T>): Linq<T> {
		return new Linq<T>(this.rows.concat(second.rows));
	}

	public DefaultIfEmpty(defaultValue: T = null): Linq<T> {
		return new Linq<T>(this.rows.length === 0 ? [defaultValue] : this.rows);
	}

	public ElementAt(index: number): T {
		return this.rows[index];
	}

	public ElementAtOrDefault(index: number, defaultValue: T = null): T {
		return this.rows[index] || defaultValue;
	}

	public First(predicate: (row: T) => boolean = null): T {
		return predicate ? this.rows.find(predicate) : this.rows[0];
	}

	public FirstOrDefault(predicate: (row: T) => boolean = null, defaultValue: T = null): T {
		return predicate ? this.rows.find(predicate) || defaultValue : this.rows[0] || defaultValue;
	}

	public Last(predicate: (row: T) => boolean = null): T {
		return predicate ? this.rows.reverse().find(predicate) : this.rows[this.rows.length - 1];
	}

	public LastOrDefault(predicate: (row: T) => boolean = null, defaultValue: T = null): T {
		return predicate ? this.rows.reverse().find(predicate) || defaultValue : this.rows[this.rows.length - 1] || defaultValue;
	}

	public Single(predicate: (row: T) => boolean = null): T {
		return predicate ? this.rows.filter(predicate)[0] : this.rows[0];
	}

	public SingleOrDefault(predicate: (row: T) => boolean = null, defaultValue: T = null): T {
		return predicate ? this.rows.filter(predicate)[0] || defaultValue : this.rows[0] || defaultValue;
	}

	public SequenceEqual(second: Linq<T>): boolean {
		return this.rows.length === second.rows.length && this.rows.every((row: T, index: number) => row === second.rows[index]);
	}

	public Contains(value: T): boolean {
		return this.rows.indexOf(value) !== -1;
	}

	public Count(predicate: (row: T) => boolean = null): number {
		return predicate ? this.rows.filter(predicate).length : this.rows.length;
	}

	public Aggregate(func: (accumulator: T, row: T) => T): T {
		return this.rows.reduce(func);
	}

	public ForEach(action: (row: T) => void): void {
		this.rows.forEach(action);
	}

	public Stringify(): string {
		return JSON.stringify(this.rows);
	}

	public toString(): string {
		return this.Stringify();
	}
}

export default Linq;
