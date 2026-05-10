import { BaseRpcContext } from "@nestjs/microservices/ctx-host/base-rpc.context";
import { Msg, MsgHdrs } from "@nats-io/nats-core";
import { JsMsg } from "@nats-io/jetstream";
declare type NatsContextArgs = [JsMsg | Msg];
export declare class NatsContext extends BaseRpcContext<NatsContextArgs> {
    constructor(args: NatsContextArgs);
    /**
     * Returns message headers (if exist).
     */
    getHeaders(): MsgHdrs | undefined;
    /**
     * Returns the message object.
     */
    getMessage(): JsMsg | Msg;
    /**
     * Returns the name of the subject.
     */
    getSubject(): string;
}
export {};
