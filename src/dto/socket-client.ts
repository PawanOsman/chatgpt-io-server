import { Socket } from "socket.io";
import { ClientType, ClientStatus } from "../enums/index.js";

class SocketClient {
	public id: string;
	public socket: Socket;
	public status: ClientStatus = ClientStatus.Idle;
	public type: ClientType = ClientType.unknown;
	public version: string;
	public versionCode: number = 0;
	constructor(id: string, socket: Socket = null) {
		this.id = id;
		this.socket = socket;
	}

	public disconnect(close: boolean = true) {
		this.socket?.disconnect(close);
	}
}

export default SocketClient;
