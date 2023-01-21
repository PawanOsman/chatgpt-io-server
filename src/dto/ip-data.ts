import Profile from "./openai-profile.js";
import SocketClient from "./socket-client.js";
import { Server } from "socket.io";

class IpData {
	public ip: string = "";
	public lastRequestTime: number = Date.now();
	public accounts: Profile[] = [];
	public blocked: boolean = false;
	public busy: boolean = false;
	public failedAuth: number = 0;
	public duplicateAccounts: number = 0;
	public clients: Map<string, SocketClient> = new Map<string, SocketClient>();
}

export default IpData;
