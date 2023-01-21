import http from "http";
import https from "https";
import axios from "axios";
import { Result, AskResponse, SessionResponse } from "../dto/index.js";
import { ErrorType, AccountType } from "../enums/index.js";
import { randomUUID } from "node:crypto";
import processError from "../utils/process-error.js";
import isObject from "../utils/isObject.js";
import base64 from "../utils/base64.js";
import IBypassServer from "src/dto/ibypass-server.js";

class BypassServer {
	public url: string = "";
	public requests: number = 0;
	public isProxy: boolean = false;
	public isOnline: boolean = false;

	constructor(bypassServer: IBypassServer) {
		this.url = bypassServer.url;
		this.isProxy = bypassServer.isProxy;
		setInterval(() => {
			const requestModule = this.url.startsWith("https") ? https : http;
			requestModule
				.request(`${this.url}/status`, { method: "HEAD" }, (res) => {
					this.isOnline = (res.statusCode >= 200 && res.statusCode < 400) || res.statusCode == 404;
				})
				.on("error", (err) => {
					this.isOnline = false;
				})
				.end();
		}, 5000);
	}

	async getSession(token: string): Promise<Result<SessionResponse>> {
		let result: Result<SessionResponse> = {
			status: true,
			data: {} as SessionResponse,
			errorType: ErrorType.UnknownError,
			error: "",
		};
		try {
			const response = await axios.request({
				method: "GET",
				url: `${this.url}/session`,
				data: {
					session_token: token,
				},
			});
			if (!response.data.accessToken || !response.data.user?.email) {
				if (response.data.detail) {
					if (isObject(response.data.detail)) {
						if (response.data.detail.message) {
							result.status = false;
							result.errorType = processError(response.data.detail.message);
							result.error = response.data.detail.message;
						}
					} else {
						result.status = false;
						result.errorType = processError(response.data.detail);
						result.error = response.data.detail;
					}
				} else if (response.data.details) {
					if (isObject(response.data.details)) {
						if (response.data.details.message) {
							result.status = false;
							result.errorType = processError(response.data.details.message);
							result.error = response.data.details.message;
						}
					} else {
						result.status = false;
						result.errorType = processError(response.data.details);
						result.error = response.data.details;
					}
				} else {
					result.status = false;
					result.errorType = ErrorType.UnknownError;
					result.error = "Failed to get response. ensure your session token is valid and isn't expired.";
				}
			}

			if (result.status) {
				const cookies = response.headers["set-cookie"];

				const sessionCookie = cookies.find((cookie) => cookie.startsWith("__Secure-next-auth.session-token"));

				let sessionToken = sessionCookie.split("=")[1];

				result.data.sessionToken = sessionToken;
				result.data.auth = response.data.accessToken;
				result.data.expires = response.data.expires;
			}

			return result;
		} catch (err) {
			result.status = false;
			result.errorType = ErrorType.UnknownError;
			result.error = "Failed to get response. ensure your session token is valid and isn't expired.";
			return result;
		}
	}

	async ask(prompt: string, conversationId: string, parentId: string, auth: string, accountType: AccountType = AccountType.Free): Promise<Result<AskResponse>> {
		let result: Result<AskResponse> = {
			status: true,
			data: {} as AskResponse,
			errorType: ErrorType.UnknownError,
			error: "",
		};
		try {
			let data = {
				action: "next",
				messages: [
					{
						id: randomUUID(),
						role: "user",
						content: {
							content_type: "text",
							parts: [base64.encode(prompt)],
						},
					},
				],
				model: accountType === AccountType.Free ? "text-davinci-002-render" : "text-davinci-002-render-paid",
				conversation_id: conversationId,
				parent_message_id: parentId,
			};

			if (!data.conversation_id || data.conversation_id === "None") delete data.conversation_id;

			let response = await axios.request({
				method: "POST",
				url: `${this.url}/sendmessage`,
				data: data,
				headers: {
					Authorization: `Bearer ${auth}`,
				},
			});

			result.data.answer = response.data.message?.content.parts[0] ?? "";
			result.data.messageId = response.data.message?.id ?? "";
			result.data.conversationId = response.data.conversation_id;

			if (response.data.detail) {
				if (isObject(response.data.detail)) {
					if (response.data.detail.message) {
						result.status = false;
						result.errorType = processError(response.data.detail.message);
						result.error = response.data.detail.message;
					}
				} else {
					result.status = false;
					result.errorType = processError(response.data.detail);
					result.error = response.data.detail;
				}
			} else if (response.data.details) {
				if (isObject(response.data.details)) {
					if (response.data.details.message) {
						result.status = false;
						result.errorType = processError(response.data.details.message);
						result.error = response.data.details.message;
					}
				} else {
					result.status = false;
					result.errorType = processError(response.data.details);
					result.error = response.data.details;
				}
			} else {
				if (result.data.answer === "") {
					result.status = false;
					result.errorType = ErrorType.UnknownError;
					result.error = "Failed to get response. ensure your session token is valid and isn't expired.";
				}
			}

			return result;
		} catch (err) {
			result.status = false;
			result.errorType = ErrorType.UnknownError;
			result.error = "Failed to get response. ensure your session token is valid and isn't expired.";
			return result;
		}
	}
}

export default BypassServer;
