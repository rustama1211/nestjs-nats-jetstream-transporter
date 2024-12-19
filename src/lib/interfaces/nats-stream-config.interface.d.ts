import { StreamConfig } from "nats";
export declare type NatsStreamConfig = Partial<StreamConfig> & Pick<StreamConfig, "name">;
