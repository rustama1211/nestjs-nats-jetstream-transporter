import { StreamConfig } from "@nats-io/jetstream";
export declare type NatsStreamConfig = Partial<StreamConfig> & Pick<StreamConfig, "name">;
