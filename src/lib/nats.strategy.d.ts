import { CustomTransportStrategy, MessageHandler, Server } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";
import { Codec, ConnectionOptions, Msg, NatsConnection } from "@nats-io/nats-core";
import { Consumer, ConsumerMessages, JetStreamClient, JetStreamManager, JsMsg, StreamInfo } from "@nats-io/jetstream";
import { noop } from "rxjs";
import { NatsTransportStrategyOptions } from "./interfaces/nats-transport-strategy-options.interface";
import { NatsStreamConfig } from "./interfaces/nats-stream-config.interface";
export declare class NatsTransportStrategy extends Server implements CustomTransportStrategy {
    protected readonly options: NatsTransportStrategyOptions;
    protected readonly codec: Codec<unknown>;
    protected readonly logger: Logger;
    protected connection?: NatsConnection;
    protected jetstreamClient?: JetStreamClient;
    protected jetstreamManager?: JetStreamManager;
    protected stopped: boolean;
    protected readonly maxHeartbeatsMissed: number;
    constructor(options?: NatsTransportStrategyOptions);
    listen(callback: typeof noop): Promise<void>;
    close(): Promise<void>;
    /**
     * Create a durable name that follows NATS naming rules
     * @see https://docs.nats.io/jetstream/administration/naming
     */
    createDurableName(...parts: string[]): string;
    createJetStreamClient(connection: NatsConnection): JetStreamClient;
    createJetStreamManager(connection: NatsConnection): Promise<JetStreamManager>;
    createNatsConnection(options?: ConnectionOptions): Promise<NatsConnection>;
    createStreams(manager: JetStreamManager, configs?: NatsStreamConfig[]): Promise<void>;
    handleJetStreamMessage(message: JsMsg, handler: MessageHandler): Promise<void>;
    handleNatsMessage(message: Msg, handler: MessageHandler): Promise<void>;
    handleStatusUpdates(connection: NatsConnection): Promise<void>;
    subscribeToEventPatterns(client: JetStreamClient, jsm: JetStreamManager): Promise<void>;
    /**
     * Consumes an event pattern, re-establishing the consume whenever it ends
     * because the server stopped sending heartbeats.
     * @see https://github.com/nats-io/nats.js/tree/main/jetstream#heartbeats
     */
    consumeWithHeartbeatRecovery(consumer: Consumer, handler: MessageHandler, pattern: string): Promise<void>;
    /**
     * Ends the consume once maxHeartbeatsMissed is reached so that
     * consumeWithHeartbeatRecovery() can replace it.
     */
    watchHeartbeats(messages: ConsumerMessages, pattern: string): Promise<void>;
    delay(ms: number): Promise<void>;
    subscribeToMessagePatterns(connection: NatsConnection): void;
    /**
     * Creates a new stream if it doesn't exist, otherwise updates the existing stream
     */
    upsertStream(manager: JetStreamManager, config: NatsStreamConfig): Promise<StreamInfo>;
}
