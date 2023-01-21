import express, { Express, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import { BypassServer, AppDbContext, Log } from "./classes/index.js";
import { SocketClient, IpData, Result } from "./dto/index.js";
import { AccountType, ClientType, LogLevel } from "./enums/index.js";

config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	pingInterval: 10000,
	pingTimeout: 5000,
});

const log = new Log(LogLevel.Trace);
const database = new AppDbContext();
await database.WaitForLoad();

let ipDatas = new Map<string, IpData>();

function getBypassServer(isProxy: boolean = true): BypassServer {
	let bypassServer = database.bypassServers
		.Where((x) => x.isProxy == isProxy)
		.OrderBy((x) => x.requests)
		.FirstOrDefault();

	if (bypassServer == null) {
		bypassServer = database.bypassServers.FirstOrDefault();
	}

	if (bypassServer == null) {
		throw new Error("No bypass servers available.");
	}

	bypassServer.requests++;

	return new BypassServer(bypassServer);
}

app.get("/", (req: Request, res: Response) => {
	res.send("Hello World!");
});

io.on("connection", (socket) => {
	const clientIp: string = socket.handshake.headers["x-real-ip"].toString();
	const query = socket.handshake.query;

	if (!query.client || !query.version || !query.versionCode) {
		log.error(`Client ${clientIp} connected without required query parameters [${query.client} || ${query.version} || ${query.versionCode}]. Disconnecting...`);
		socket.disconnect(true);
		return;
	}

	let ipData: IpData = {
		ip: clientIp,
		accounts: [],
		blocked: false,
		busy: false,
		failedAuth: 0,
		duplicateAccounts: 0,
		lastRequestTime: Date.now(),
		clients: new Map<string, SocketClient>(),
	};

	if (ipDatas.has(ipData.ip)) {
		ipData = ipDatas.get(ipData.ip);
	} else {
		ipDatas.set(ipData.ip, ipData);
	}

	let client: SocketClient = new SocketClient(socket.id, socket);

	if (ipData.clients.has(client.id)) {
		client = ipData.clients.get(client.id);
	} else {
		ipData.clients.set(client.id, client);
	}

	switch (query.client) {
		case "nodejs":
			client.clientType = ClientType.nodejs;
			break;
		case "csharp":
			client.clientType = ClientType.csharp;
			break;
		case "python":
			client.clientType = ClientType.python;
			break;
	}

	client.version = query.version.toString();
	client.versionCode = parseInt(query.versionCode.toString());

	log.info(`Client connected: ${clientIp} ${client.id} (${ClientType[client.clientType]} v${client.version})`);

	client.socket.on("getSession", async (data: string, callback) => {
		let bypassServer: BypassServer = getBypassServer(false);
		log.info(`getSession: ${clientIp} ${client.id} (${ClientType[client.clientType]} v${client.version})`);

		if (!bypassServer) {
			callback({
				status: false,
				error: "No bypass server available",
			});
			return;
		}

		let response = await bypassServer.getSession(data);
		if (response.status) {
			callback(response.data);
		} else {
			callback(response);
		}
	});

	client.socket.on("askQuestion", async (data, callback) => {
		let bypassServer: BypassServer = getBypassServer();

		if (!bypassServer) {
			callback({
				status: false,
				error: "No bypass server available",
			});
			return;
		}

		let response = await bypassServer.ask(data.prompt, data.conversationId, data.parentId, data.auth);
		if (response.status) {
			callback(response.data);
		} else {
			callback(response);
		}
	});

	client.socket.on("askQuestionPro", async (data, callback) => {
		let bypassServer: BypassServer = getBypassServer();

		if (!bypassServer) {
			callback({
				status: false,
				error: "No bypass server available",
			});
			return;
		}

		let response = await bypassServer.ask(data.prompt, data.conversationId, data.parentId, data.auth, AccountType.Pro);
		if (response.status) {
			callback(response.data);
		} else {
			callback(response);
		}
	});

	client.socket.on("disconnect", () => {
		log.info(`Client disconnected: ${clientIp} ${client.id} (${ClientType[client.clientType]} v${client.version})`);
		ipData.clients.delete(client.id);
	});
});

server.listen(process.env.PORT, () => {
	log.info(`Server started on port ${process.env.PORT}`);
});
