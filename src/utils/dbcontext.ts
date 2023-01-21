import fs from "fs";
import DbSet from "../classes/db-set.js";
import Wait from "./wait.js";

class DbContext {
	private path = "./db.json";
	private intervalId: NodeJS.Timeout;
	private saveInterval: number = 1000 * 5;
	private loaded: boolean = false;

	constructor(path: string = "./db.json", saveInterval: number = 1000 * 5) {
		this.path = path;
		this.load();
		this.intervalId = setInterval(() => {
			this.save();
		}, this.saveInterval);
	}

	public async WaitForLoad() {
		while (!this.loaded) {
			await Wait(100);
		}
	}

	private async load() {
		if (!fs.existsSync(this.path)) return;
		let data = await fs.promises.readFile(this.path, "utf8");
		let json = JSON.parse(data);

		for (let key in json) {
			this[key] = new DbSet(json[key].name, json[key].rows);
		}

		await Wait(1000);
		this.loaded = true;
	}

	public async save() {
		let result: any = {};
		for (let key in this) {
			if (this[key] instanceof DbSet) {
				result[key] = this[key];
			}
		}
		await fs.promises.writeFile(this.path, JSON.stringify(result, null, 4));
	}

	public async close() {
		clearInterval(this.intervalId);
		await this.save();
	}
}

export default DbContext;
