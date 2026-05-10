import { Codec } from "@nats-io/nats-core";
/**
 * Inline replacement for the JSONCodec dropped by @nats-io/nats-core v3.
 * Mirrors the v2 behavior: undefined encodes to an empty Uint8Array, and an
 * empty Uint8Array decodes back to undefined.
 */
export declare function JSONCodec<T = unknown>(): Codec<T>;
