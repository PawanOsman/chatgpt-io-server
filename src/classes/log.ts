import LogLevel from "../enums/log-level.js";
import getCurrentTime from "../utils/getCurrentTime.js";
import isArray from "../utils/isArray.js";
import isObject from "../utils/isObject.js";
import colors from "colors";

class Log {
	logLevel: LogLevel;

	constructor(logLevel: LogLevel) {
		this.logLevel = logLevel;
	}

	trace(message: any) {
		if (isArray(message) || isObject(message)) message = JSON.stringify(message);
		if (this.logLevel <= LogLevel.Trace) {
			console.log(`${colors.white("[TRACE]")} ${getCurrentTime()} ${message}`);
		}
	}

	debug(message: any) {
		if (isArray(message) || isObject(message)) message = JSON.stringify(message);
		if (this.logLevel <= LogLevel.Debug) {
			console.log(`${colors.zalgo("[DEBUG]")} ${getCurrentTime()} ${message}`);
		}
	}

	info(message: any) {
		if (isArray(message) || isObject(message)) message = JSON.stringify(message);
		if (this.logLevel <= LogLevel.Info) {
			console.log(`${colors.blue("[INFO]")} ${getCurrentTime()} ${message}`);
		}
	}

	warn(message: any) {
		if (isArray(message) || isObject(message)) message = JSON.stringify(message);
		if (this.logLevel <= LogLevel.Warning) {
			console.log(`${colors.yellow("[WARN]")} ${getCurrentTime()} ${message}`);
		}
	}

	error(message: any) {
		if (isArray(message) || isObject(message)) message = JSON.stringify(message);
		if (this.logLevel <= LogLevel.Error) {
			console.log(`${colors.red("[ERROR]")} ${getCurrentTime()} ${message}`);
		}
	}
}

export default Log;
