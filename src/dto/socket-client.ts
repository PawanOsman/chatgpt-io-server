import { Socket } from "socket.io";
import { ClientType } from "../enums/index.js";

class SocketClient {
	public id: string;
	public socket: Socket;
	public clientType: ClientType = ClientType.nodejs;
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
