// graphql-pg-subscriptions ships no type declarations (v3.3.0). This ambient
// module declares the minimal surface we use: PostgresPubSub is a
// PubSubEngine backed by Postgres LISTEN/NOTIFY.
declare module 'graphql-pg-subscriptions' {
  import { PubSubEngine } from 'graphql-subscriptions';
  import { Client, ClientConfig } from 'pg';

  export interface PostgresPubSubOptions extends ClientConfig {
    client?: Client;
  }

  export class PostgresPubSub extends PubSubEngine {
    constructor(options?: PostgresPubSubOptions);
    publish(triggerName: string, payload: unknown): Promise<void>;
    subscribe(
      triggerName: string,
      onMessage: (payload: unknown) => void,
    ): Promise<number>;
    unsubscribe(subId: number): void;
    // v3.3.0 exposes asyncIterator (not asyncIterableIterator). NestJS accepts
    // a plain AsyncIterator as a subscription source.
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
  }
}
