"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsTransportStrategy = void 0;
const tslib_1 = require("tslib");
const microservices_1 = require("@nestjs/microservices");
const common_1 = require("@nestjs/common");
const transport_node_1 = require("@nats-io/transport-node");
const nats_core_1 = require("@nats-io/nats-core");
const jetstream_1 = require("@nats-io/jetstream");
const rxjs_1 = require("rxjs");
const nats_context_1 = require("./nats.context");
const nats_constants_1 = require("./nats.constants");
const nats_codec_1 = require("./nats.codec");
/** How long to wait before re-establishing a consume or fetch that ended. */
const RESUBSCRIBE_DELAY = 1000;
/** Defaults for `options.fetch`. */
const FETCH_BATCH = 10;
const FETCH_EXPIRES = 30000;
class NatsTransportStrategy extends microservices_1.Server {
    constructor(options = {}) {
        super();
        this.options = options;
        this.codec = options.codec || nats_codec_1.JSONCodec();
        this.logger = new common_1.Logger("NatsServer");
        this.stopped = false;
        this.maxHeartbeatsMissed = options.maxHeartbeatsMissed || 2;
        this.fetchOptions = options.fetch
            ? {
                batch: (options.fetch === true ? undefined : options.fetch.batch) || FETCH_BATCH,
                expires: (options.fetch === true ? undefined : options.fetch.expires) || FETCH_EXPIRES
            }
            : null;
    }
    listen(callback) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.connection = yield this.createNatsConnection(this.options.connection);
            this.jetstreamClient = this.createJetStreamClient(this.connection);
            this.jetstreamManager = yield this.createJetStreamManager(this.connection);
            this.handleStatusUpdates(this.connection);
            yield this.createStreams(this.jetstreamManager, this.options.streams);
            yield this.subscribeToEventPatterns(this.jetstreamClient, this.jetstreamManager);
            this.subscribeToMessagePatterns(this.connection);
            this.logger.log(`Connected to ${this.connection.getServer()}`);
            callback();
        });
    }
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.stopped = true;
            if (this.connection) {
                yield this.connection.drain();
                this.connection = undefined;
                this.jetstreamClient = undefined;
                this.jetstreamManager = undefined;
            }
        });
    }
    /**
     * Create a durable name that follows NATS naming rules
     * @see https://docs.nats.io/jetstream/administration/naming
     */
    createDurableName(...parts) {
        return parts.join("-").replace(/\s|\.|>|\*/g, "-");
    }
    createJetStreamClient(connection) {
        return jetstream_1.jetstream(connection);
    }
    createJetStreamManager(connection) {
        return jetstream_1.jetstreamManager(connection);
    }
    createNatsConnection(options = {}) {
        return transport_node_1.connect(options);
    }
    createStreams(manager, configs = []) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Promise.all(configs.map((config) => this.upsertStream(manager, config)));
        });
    }
    handleJetStreamMessage(message, handler) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const handleError = this.options.onError || ((message) => message.term());
            try {
                const decoded = this.codec.decode(message.data);
                message.working();
                const signal = yield handler(decoded, new nats_context_1.NatsContext([message]))
                    .then((maybeObservable) => this.transformToObservable(maybeObservable))
                    .then((observable) => rxjs_1.lastValueFrom(observable));
                if (signal === nats_constants_1.NACK) {
                    return message.nak();
                }
                if (signal === nats_constants_1.TERM) {
                    return message.term();
                }
                message.ack();
            }
            catch (_a) {
                handleError(message);
            }
        });
    }
    handleNatsMessage(message, handler) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const decoded = this.codec.decode(message.data);
            const maybeObservable = yield handler(decoded, new nats_context_1.NatsContext([message]));
            const response$ = this.transformToObservable(maybeObservable);
            this.send(response$, (response) => {
                const encoded = this.codec.encode(response);
                message.respond(encoded);
            });
        });
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
                        case "ping":
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
    subscribeToEventPatterns(client, jsm) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const eventHandlers = [...this.messageHandlers.entries()].filter(([, handler]) => handler.isEventHandler);
            for (const [pattern, handler] of eventHandlers) {
                let defaultConsumerName = `subscriber-${pattern}`;
                const consumerConfig = { name: `subscriber-${pattern}`, ack_policy: jetstream_1.AckPolicy.Explicit, inactive_threshold: nats_core_1.nanos(2 * 60 * 1000), replay_policy: jetstream_1.ReplayPolicy.Original };
                if (this.options.consumer) {
                    this.options.consumer(consumerConfig);
                }
                if (consumerConfig.durable_name) {
                    consumerConfig.durable_name = this.createDurableName(consumerConfig.durable_name, pattern);
                    defaultConsumerName = consumerConfig.durable_name;
                    consumerConfig.name = defaultConsumerName;
                }
                try {
                    // force to create consumer
                    let consumerInfo;
                    try {
                        consumerInfo = yield jsm.consumers.info(pattern, defaultConsumerName);
                    }
                    catch (err) {
                        consumerInfo = null;
                    }
                    if (!consumerInfo) {
                        consumerInfo = yield jsm.consumers.add(pattern, consumerConfig);
                    }
                    else {
                        // cannot update replay policy
                        delete consumerConfig.replay_policy;
                        consumerInfo = yield jsm.consumers.update(pattern, defaultConsumerName, consumerConfig);
                    }
                    const eventConsumer = yield client.consumers.get(consumerInfo.stream_name, consumerInfo.name);
                    if (this.fetchOptions) {
                        this.fetchWithRecovery(eventConsumer, handler, pattern);
                    }
                    else {
                        this.consumeWithHeartbeatRecovery(eventConsumer, handler, pattern);
                    }
                    this.logger.log(`Subscribed to ${pattern} events`);
                }
                catch (error) {
                    if (error.message === "no stream matches subject") {
                        throw new Error(`Cannot find stream with the ${pattern} event pattern`);
                    }
                    throw error;
                }
            }
        });
    }
    /**
     * Runs back to back fetch() calls for an event pattern.
     *
     * Unlike a consume, a fetch treats missed heartbeats as fatal: it ends the
     * batch with an error instead of leaving a subscription that is open but
     * receiving nothing. There is no miss to count and no subscription to
     * stop, so recovery is just issuing the next fetch.
     *
     * Messages are dispatched without awaiting, which keeps the concurrency
     * the same as consume()'s callback. handleJetStreamMessage() settles every
     * message itself and never rejects.
     *
     * @see https://github.com/nats-io/nats.js/tree/main/jetstream#heartbeats
     */
    async fetchWithRecovery(consumer, handler, pattern) {
        const { batch, expires } = this.fetchOptions;
        while (!this.stopped) {
            try {
                const messages = await consumer.fetch({
                    max_messages: batch,
                    expires
                });
                for await (const message of messages) {
                    this.handleJetStreamMessage(message, handler);
                }
            }
            catch (error) {
                if (this.stopped) {
                    return;
                }
                this.logger.warn(`Fetch for ${pattern} events ended (${error.message}), retrying`);
                await this.delay(RESUBSCRIBE_DELAY);
            }
        }
    }
    /**
     * Runs consume() for an event pattern and re-establishes it whenever the
     * server stops sending heartbeats.
     *
     * @nats-io/jetstream auto-recovers from most disruptions, but when it
     * cannot, it reports "heartbeats_missed" and the consume sits idle forever
     * — the handler goes quiet with no error and no crash. The documented
     * remedy is to stop() the ConsumerMessages and create a new one.
     *
     * @see https://github.com/nats-io/nats.js/tree/main/jetstream#heartbeats
     */
    async consumeWithHeartbeatRecovery(consumer, handler, pattern) {
        while (!this.stopped) {
            let messages;
            try {
                messages = await consumer.consume({
                    callback: (message) => {
                        if (message) {
                            return this.handleJetStreamMessage(message, handler);
                        }
                    }
                });
            }
            catch (error) {
                if (this.stopped) {
                    return;
                }
                this.logger.error(`Cannot consume ${pattern} events: ${error.message}`);
                await this.delay(RESUBSCRIBE_DELAY);
                continue;
            }
            this.watchHeartbeats(messages, pattern);
            // resolves when the consume ends, including when watchHeartbeats
            // stops it after too many missed heartbeats
            await messages.closed();
            if (this.stopped) {
                return;
            }
            this.logger.warn(`Consumer for ${pattern} events ended, re-subscribing`);
            await this.delay(RESUBSCRIBE_DELAY);
        }
    }
    /**
     * Ends the consume once too many heartbeats go missing, so that
     * consumeWithHeartbeatRecovery() can replace it with a fresh one.
     */
    async watchHeartbeats(messages, pattern) {
        try {
            for await (const status of await messages.status()) {
                if (status.type !== "heartbeats_missed") {
                    continue;
                }
                this.logger.warn(`${status.count} heartbeat(s) missed for ${pattern} events`);
                if (status.count >= this.maxHeartbeatsMissed) {
                    messages.stop();
                    return;
                }
            }
        }
        catch (error) {
            // the status iterator ends together with the consume it belongs to
        }
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    subscribeToMessagePatterns(connection) {
        const messageHandlers = [...this.messageHandlers.entries()].filter(([, handler]) => !handler.isEventHandler);
        for (const [pattern, handler] of messageHandlers) {
            connection.subscribe(pattern, {
                callback: (error, message) => {
                    if (error) {
                        return this.logger.error(error.message, error.stack);
                    }
                    return this.handleNatsMessage(message, handler);
                },
                queue: this.options.queue
            });
            this.logger.log(`Subscribed to ${pattern} messages`);
        }
    }
    /**
     * Creates a new stream if it doesn't exist, otherwise updates the existing stream
     */
    upsertStream(manager, config) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield manager.streams.info(config.name);
                const updated = yield manager.streams.update(config.name, Object.assign(Object.assign({}, stream.config), config));
                return updated;
            }
            catch (error) {
                if (error.message === "stream not found") {
                    const added = yield manager.streams.add(config);
                    return added;
                }
                throw error;
            }
        });
    }
}
exports.NatsTransportStrategy = NatsTransportStrategy;
