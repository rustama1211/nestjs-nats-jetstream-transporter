import { Codec, ConnectionOptions } from "@nats-io/nats-core";
import { ConsumerConfig, JsMsg } from "@nats-io/jetstream";
import { NatsStreamConfig } from "./nats-stream-config.interface";
export interface NatsTransportStrategyOptions {
    /**
     * NATS codec to use for encoding and decoding messages
     */
    codec?: Codec<unknown>;
    /**
     * NATS connection options
     */
    connection?: ConnectionOptions;
    /**
     * Consumer options for JetStream subscriptions
     * @see https://github.com/nats-io/nats.deno/blob/main/jetstream.md#push-subscriptions
     * @see https://docs.nats.io/jetstream/concepts/consumers
     */
    consumer?: (options: Partial<ConsumerConfig>) => void;
    /**
     * Function that is called when the handler throws an error for a JetStream message.
     * By default, messages will be terminated and will not be requeued.
     *
     * @default (message) => message.term()
     */
    onError?: (message: JsMsg) => void;
    /**
     * How many consecutive missed heartbeats are tolerated before the consume
     * is stopped and re-established. Lower reacts faster, higher is less
     * sensitive to a briefly slow server.
     *
     * Ignored when `fetch` is set, because a fetch already treats missed
     * heartbeats as fatal on its own.
     *
     * @default 2
     * @see https://github.com/nats-io/nats.js/tree/main/jetstream#heartbeats
     */
    maxHeartbeatsMissed?: number;
    /**
     * Drive event subscriptions with back to back `Consumer.fetch()` calls
     * instead of one long lived `Consumer.consume()`.
     *
     * The two differ in how @nats-io/jetstream reacts when the server stops
     * sending heartbeats: a consume reports the miss and keeps the
     * subscription open, which is what `maxHeartbeatsMissed` exists to work
     * around, while a fetch gives up and ends the batch with an error. In
     * fetch mode a stalled subscription is therefore replaced by the next
     * iteration of the loop rather than relying on the miss being counted.
     *
     * Messages are still handled concurrently, exactly as they are under
     * consume; the batch is not processed one message at a time.
     *
     * `true` uses the defaults below.
     *
     * @default false
     */
    fetch?: boolean | NatsFetchOptions;
    /**
     * Queue group name
     * @see https://docs.nats.io/nats-concepts/queue
     */
    queue?: string;
    /**
     * @see https://github.com/nats-io/nats.deno/blob/main/jetstream.md#jetstreammanager
     * @see https://docs.nats.io/jetstream/concepts/streams
     */
    streams?: NatsStreamConfig[];
}
export interface NatsFetchOptions {
    /**
     * Most messages to ask for per fetch.
     *
     * @default 10
     */
    batch?: number;
    /**
     * How long in milliseconds a fetch waits for its batch to fill before
     * ending, at which point the next one is issued. Also decides the
     * heartbeat interval: @nats-io/jetstream derives `idle_heartbeat` from
     * half of it, clamped to 30s.
     *
     * @default 30000
     */
    expires?: number;
}
