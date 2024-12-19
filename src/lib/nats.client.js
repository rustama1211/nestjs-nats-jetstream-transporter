"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsClient = void 0;
const tslib_1 = require("tslib");
const microservices_1 = require("@nestjs/microservices");
const common_1 = require("@nestjs/common");
const nats_1 = require("nats");
const rxjs_1 = require("rxjs");
class NatsClient extends microservices_1.ClientProxy {
    constructor(options = {}) {
        super();
        this.options = options;
        this.codec = options.codec || nats_1.JSONCodec();
        this.logger = new common_1.Logger(this.constructor.name);
    }
    connect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                return this.connection;
            }
            this.connection = yield this.createNatsConnection(this.options.connection);
            this.jetstreamClient = this.createJetStreamClient(this.connection);
            this.handleStatusUpdates(this.connection);
            this.logger.log(`Connected to ${this.connection.getServer()}`);
            return this.connection;
        });
    }
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                yield this.connection.drain();
                this.connection = undefined;
                this.jetstreamClient = undefined;
            }
        });
    }
    createJetStreamClient(connection) {
        return connection.jetstream();
    }
    createNatsConnection(options = {}) {
        return nats_1.connect(options);
    }
    getConnection() {
        return this.connection;
    }
    getJetStreamClient() {
        return this.jetstreamClient;
    }
    handleStatusUpdates(connection) {
        var e_1, _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                for (var _b = tslib_1.__asyncValues(connection.status()), _c; _c = yield _b.next(), !_c.done;) {
                    const status = _c.value;
                    const data = typeof status.data === "object" ? JSON.stringify(status.data) : status.data;
                    const message = `(${status.type}): ${data}`;
                    switch (status.type) {
                        case "pingTimer":
                        case "reconnecting":
                        case "staleConnection":
                            this.logger.debug(message);
                            break;
                        case "disconnect":
                        case "error":
                            this.logger.error(message);
                            break;
                        case "reconnect":
                            this.logger.log(message);
                            break;
                        case "ldm":
                            this.logger.warn(message);
                            break;
                        case "update":
                            this.logger.verbose(message);
                            break;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatchEvent(packet) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.jetstreamClient) {
                throw new Error("JetStream not connected!");
            }
            const payload = this.codec.encode(packet.data);
            const subject = this.normalizePattern(packet.pattern);
            yield this.jetstreamClient.publish(subject, payload);
        });
    }
    publish(packet, callback) {
        if (!this.connection) {
            throw new Error("NATS not connected!");
        }
        const payload = this.codec.encode(packet.data);
        const subject = this.normalizePattern(packet.pattern);
        this.connection
            .request(subject, payload)
            .then((encoded) => this.codec.decode(encoded.data))
            .then((packet) => callback(packet))
            .catch((err) => callback({ err }));
        // No teardown function needed as the subscription is handled for us, so return noop
        return rxjs_1.noop;
    }
}
exports.NatsClient = NatsClient;
//# sourceMappingURL=nats.client.js.map