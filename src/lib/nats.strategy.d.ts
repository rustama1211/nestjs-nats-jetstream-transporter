import { CustomTransportStrategy, MessageHandler, Server } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";
import { Codec, ConnectionOptions, JetStreamClient, JetStreamManager, JsMsg, Msg, NatsConnection, StreamInfo } from "nats";
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
    subscribeToMessagePatterns(connection: NatsConnection): void;
    /**
     * Creates a new stream if it doesn't exist, otherwise updates the existing stream
     */
    upsertStream(manager: JetStreamManager, config: NatsStreamConfig): Promise<StreamInfo>;
}
