import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import { BypassServer, AppDbContext, Log } from "./classes/index.js";
import { Profile, SocketClient, IpData, Result } from "./dto/index.js";
import { ClientStatus, AccountType, ClientType, LogLevel } from "./enums/index.js";
import Linq from "./utils/linq.js";
import Wait from "./utils/wait.js";

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

let ipDataList = new Linq<IpData>();

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
		accounts: new Linq<Profile>(),
		status: IpStatus.Idle,
		totalRequests: 0,
		failedAuth: 0,
		lastRequestTime: Date.now(),
		clients: new Linq<SocketClient>(),
	};

	if (ipDataList.Any((x) => x.ip == ipData.ip)) {
		ipData = ipDataList.FirstOrDefault((x) => x.ip == ipData.ip);
	} else {
		ipDataList.Add(ipData);
	}

	let client: SocketClient = new SocketClient(socket.id, socket);

	if (ipData.clients.Any((x) => x.id == client.id)) {
		client = ipData.clients.FirstOrDefault((x) => x.id == client.id);
	} else {
		ipData.clients.Add(client);
	}

	switch (query.client) {
		case "nodejs":
			client.type = ClientType.nodejs;
			break;
		case "csharp":
			client.type = ClientType.csharp;
			break;
		case "python":
			client.type = ClientType.python;
			break;
	}

	client.version = query.version.toString();
	client.versionCode = parseInt(query.versionCode.toString());

	log.info(`Client connected: ${clientIp} ${client.id} (${ClientType[client.type]} v${client.version})`);

	client.socket.on("getSession", async (data: string, callback) => {
		ipData.lastRequestTime = Date.now();
		ipData.totalRequests++;
		if (ipData.status === IpStatus.Busy || client.status === ClientStatus.GettingSession) {
			callback({
				status: false,
				error: "Another request is already in progress. please wait 30 seconds and try again.",
			});
			return;
		}
		ipData.status = IpStatus.Busy;
		client.status = ClientStatus.GettingSession;
		try {
			let bypassServer: BypassServer = getBypassServer(false);
			log.info(`getSession: ${clientIp} ${client.id} (${ClientType[client.type]} v${client.version})`);

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
			setTimeout(() => {
				ipData.status = IpStatus.Idle;
				client.status = ClientStatus.Idle;
			}, 30000);
		} catch (e) {
			log.error(`getSession: ${clientIp} ${client.id} (${ClientType[client.type]} v${client.version}) ${e}`);
			setTimeout(() => {
				ipData.status = IpStatus.Idle;
				client.status = ClientStatus.Idle;
			}, 30000);
			callback({
				status: false,
				error: `An error occurred while getting session please try again in 30 seconds.`,
			});
		}
	});

	client.socket.on("askQuestion", async (data, callback) => {
		ipData.lastRequestTime = Date.now();
		ipData.totalRequests++;
		while (client.status === ClientStatus.ProcessingQuestion || client.status === ClientStatus.GettingSession) {
			await Wait(25);
		}
		client.status = ClientStatus.ProcessingQuestion;
		try {
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
			client.status = ClientStatus.Idle;
		} catch (e) {
			log.error(`askQuestion: ${clientIp} ${client.id} (${ClientType[client.type]} v${client.version}) ${e}`);
			client.status = ClientStatus.Idle;
			callback({
				status: false,
				error: `An error occurred while processing question please try again in a few seconds.`,
			});
		}
	});

	client.socket.on("askQuestionPro", async (data, callback) => {
		ipData.lastRequestTime = Date.now();
		ipData.totalRequests++;
		while (client.status === ClientStatus.ProcessingQuestion || client.status === ClientStatus.GettingSession) {
			await Wait(25);
		}
		client.status = ClientStatus.ProcessingQuestion;
		try {
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
			client.status = ClientStatus.Idle;
		} catch (e) {
			log.error(`askQuestion: ${clientIp} ${client.id} (${ClientType[client.type]} v${client.version}) ${e}`);
			client.status = ClientStatus.Idle;
			callback({
				status: false,
				error: `An error occurred while processing question please try again in a few seconds.`,
			});
		}
	});

	client.socket.on("disconnect", () => {
		log.info(`Client disconnected: ${clientIp} ${client.id} (${ClientType[client.type]} v${client.version})`);
		ipData.clients.Remove(client);
	});
});

server.listen(process.env.PORT, () => {
	log.info(`Server started on port ${process.env.PORT}`);
});
