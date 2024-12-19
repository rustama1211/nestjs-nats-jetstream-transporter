import { BaseRpcContext } from "@nestjs/microservices/ctx-host/base-rpc.context";
import { JsMsg, Msg, MsgHdrs } from "nats";
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
