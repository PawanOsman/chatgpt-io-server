import Linq from "../utils/linq.js";

class DbSet<T extends object> extends Linq<T> {
	public name: string;

	constructor(name: string, items: T[] = []) {
		super(items);
		this.name = name;
	}
}

export default DbSet;
