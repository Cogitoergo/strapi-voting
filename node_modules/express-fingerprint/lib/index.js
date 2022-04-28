"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const murmurhash3js_1 = require("murmurhash3js");
const async_1 = __importDefault(require("async"));
const parameters = __importStar(require("./parameters"));
const traverse_1 = __importDefault(require("traverse"));
__exportStar(require("./types"), exports);
const Fingerprint = (setting) => {
    const config = Object.assign({ parameters: [
            parameters.useragent,
            parameters.acceptHeaders,
            parameters.geoip,
        ] }, setting);
    for (let i = 0; i < config.parameters.length; i++) {
        config.parameters[i] = config.parameters[i].bind(config);
    }
    return (req, res, next) => {
        let components = {};
        config.req = req;
        let fingerprint = { hash: null };
        async_1.default.eachLimit(config.parameters, 1, (parameter, callback) => {
            parameter((err, obj) => {
                for (const key in obj) {
                    components[key] = obj[key];
                }
                callback(err);
            }, req, res);
        }, (err) => {
            if (!err) {
                let leaves = traverse_1.default(components).reduce(function (acc, x) {
                    if (this.isLeaf)
                        acc.push(x);
                    return acc;
                }, []);
                fingerprint.hash = murmurhash3js_1.x64.hash128(leaves.join("~~~"));
                fingerprint.components = components; // debug
                req.fingerprint = fingerprint;
            }
            next();
        });
    };
};
for (const key in parameters) {
    Fingerprint[key] = parameters[key];
}
exports.default = Fingerprint;
module.exports = Fingerprint;
//# sourceMappingURL=index.js.map