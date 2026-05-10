"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONCodec = void 0;
// Inline replacement for the JSONCodec dropped by @nats-io/nats-core v3.
// Mirrors the v2 behavior: undefined encodes to an empty Uint8Array, and an
// empty Uint8Array decodes back to undefined.
function JSONCodec() {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    return {
        encode(d) {
            if (d === undefined) {
                return new Uint8Array(0);
            }
            return enc.encode(JSON.stringify(d));
        },
        decode(a) {
            if (!a || a.length === 0) {
                return undefined;
            }
            return JSON.parse(dec.decode(a));
        }
    };
}
exports.JSONCodec = JSONCodec;
