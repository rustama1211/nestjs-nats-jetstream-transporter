import { Codec, ConnectionOptions } from "@nats-io/nats-core";
export interface NatsClientOptions {
    /**
     * NATS codec to use for encoding and decoding messages
     */
    codec?: Codec<unknown>;
    /**
     * NATS connection options
     */
    connection?: ConnectionOptions;
}
