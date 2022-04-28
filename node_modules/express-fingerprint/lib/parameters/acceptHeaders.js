"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptHeaders = void 0;
exports.acceptHeaders = function (next) {
    next(null, {
        acceptHeaders: {
            accept: this.req.headers["accept"],
            language: this.req.headers["accept-language"],
        },
    });
};
//# sourceMappingURL=acceptHeaders.js.map