import { ClientProxy, ReadPacket, WritePacket } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";
import { Codec, JetStreamClient, NatsConnection, ConnectionOptions } from "nats";
import { noop } from "rxjs";
import { NatsClientOptions } from "./interfaces/nats-client-options.interface";
export declare class NatsClient extends ClientProxy {
    protected readonly options: NatsClientOptions;
    protected readonly codec: Codec<unknown>;
    protected readonly logger: Logger;
    protected connection?: NatsConnection;
    protected jetstreamClient?: JetStreamClient;
    constructor(options?: NatsClientOptions);
    connect(): Promise<NatsConnection>;
    close(): Promise<void>;
    createJetStreamClient(connection: NatsConnection): JetStreamClient;
    createNatsConnection(options?: ConnectionOptions): Promise<NatsConnection>;
    getConnection(): NatsConnection | undefined;
    getJetStreamClient(): JetStreamClient | undefined;
    handleStatusUpdates(connection: NatsConnection): Promise<void>;
    protected dispatchEvent(packet: ReadPacket): Promise<any>;
    protected publish(packet: ReadPacket, callback: (packet: WritePacket) => void): typeof noop;
}
