import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { PostgresPubSub } from 'graphql-pg-subscriptions';

export const PUB_SUB = 'PUB_SUB';

/**
 * PubSub backed by Postgres LISTEN/NOTIFY.
 *
 * The backend runs multi-pod (HPA minReplicas >= 2), so an in-memory PubSub
 * would only ever reach subscribers connected to the same pod as the
 * publisher. Postgres LISTEN/NOTIFY gives us a shared bus using the database
 * we already run — no Redis, no extra vendor (keeps DSGVO/Swiss-hosting
 * constraints simple).
 *
 * Uses a dedicated long-lived `pg.Client` (NOT a pool connection) because
 * LISTEN holds the session open for the lifetime of the subscription.
 */
export const pubSubProvider: Provider = {
  provide: PUB_SUB,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const client = new Client({
      host: config.getOrThrow<string>('DB_HOST'),
      port: Number(config.getOrThrow<string>('DB_PORT')),
      user: config.getOrThrow<string>('DB_USERNAME'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      database: config.getOrThrow<string>('DB_NAME'),
      ssl:
        config.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    });
    // The pg Client must be connected before publish()/subscribe() can issue
    // NOTIFY/LISTEN — graphql-pg-subscriptions does NOT connect it for us, so
    // an unconnected client makes the first publish() hang forever (and with
    // it the sendMessage mutation). Connect eagerly; keep the socket alive.
    client.connect().catch((err) => {
      console.error(
        '[chat pubsub] failed to connect pg LISTEN/NOTIFY client',
        err,
      );
    });
    return new PostgresPubSub({ client });
  },
};
