import DbSet from "./db-set.js";
import DbContext from "../utils/dbcontext.js";
import IBypassServer from "../dto/ibypass-server.js";

class AppDbContext extends DbContext {
	constructor() {
		super();
	}

	public bypassServers: DbSet<IBypassServer> = new DbSet<IBypassServer>("bypassServers");
}

export default AppDbContext;
