"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsContext = void 0;
const base_rpc_context_1 = require("@nestjs/microservices/ctx-host/base-rpc.context");
class NatsContext extends base_rpc_context_1.BaseRpcContext {
    constructor(args) {
        super(args);
    }
    /**
     * Returns message headers (if exist).
     */
    getHeaders() {
        return this.args[0].headers;
    }
    /**
     * Returns the message object.
     */
    getMessage() {
        return this.args[0];
    }
    /**
     * Returns the name of the subject.
     */
    getSubject() {
        return this.args[0].subject;
    }
}
exports.NatsContext = NatsContext;
//# sourceMappingURL=nats.context.js.map