"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useragent = void 0;
const useragent_1 = __importDefault(require("useragent"));
exports.useragent = function (next) {
    const agent = useragent_1.default.parse(this.req.headers["user-agent"]);
    next(null, {
        useragent: {
            browser: {
                family: agent.family,
                version: agent.major,
            },
            device: {
                family: agent.device.family,
                version: agent.device.major,
            },
            os: {
                family: agent.os.family,
                major: agent.os.major,
                minor: agent.os.minor,
            },
        },
    });
};
//# sourceMappingURL=useragent.js.map