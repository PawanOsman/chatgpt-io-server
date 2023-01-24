import Profile from "./openai-profile.js";
import SocketClient from "./socket-client.js";
import Linq from "../utils/linq.js";

class IpData {
	public ip: string = "";
	public lastRequestTime: number = Date.now();
	public totalRequests: number = 0;
	public accounts: Linq<Profile> = new Linq<Profile>();
	public status: IpStatus = IpStatus.Idle;
	public failedAuth: number = 0;
	public clients: Linq<SocketClient> = new Linq<SocketClient>();
}

export default IpData;
