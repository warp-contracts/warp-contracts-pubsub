import WebSocket from 'isomorphic-ws';

type Direction = 'pub' | 'sub' | 'all';
export type StreamrConnectionOptions = {
  /**
   *  Choose if you want to publish, subscribe or both
   *  'pub' - write only
   *  'sub' - read only
   *  'all' - read and write
   */
  direction: Direction;
  /**
   * To create a stream please visit https://streamr.network/core/streams.
   */
  streamId?: string;
  /**
   Ignored if direction is sub.
   * @example: ws://my.host
   */
  writeHost?: string;
  /**
   * Ignored if direction is sub.
   * @default 7170
   */
  writePort?: number;
  /**
   * Ignored if direction is pub.
   * @example: ws://my.host
   */
  readHost?: string;
  /**
   * Ignored if direction is pub.
   * @default 7170
   */
  readPort?: number;
  /**
   * Api key required for 'pub' (and 'all') direction.
   * The key defined in the streamr broker configuration.
   */
  apiKey?: string;
};

const CONNECTION_DEFAULTS = {
  readHost: 'ws://read.streamr.warp.cc',
  readPort: 7170,
  writeHost: 'ws://write.streamr.warp.cc',
  writePort: 7180
};

enum Status {
  connected,
  error,
  closed,
  unexpected
}

export class StreamrWsClient {
  private readonly subConnection: WebSocket;
  private readonly pubConnection: WebSocket;
  private readonly subStatus: Promise<Status>;
  private readonly pubStatus: Promise<Status>;
  private readonly direction: Direction;
  private error;

  public static async create(connection: StreamrConnectionOptions): Promise<StreamrWsClient> {
    const client = new StreamrWsClient(connection);
    await client.checkConnectionStatus();
    return client;
  }

  /**
   * Constructor can't be async. Use create method instead.
   * @param connection
   * @private
   */
  private constructor(connection: StreamrConnectionOptions) {
    const c = { ...CONNECTION_DEFAULTS, ...connection };
    if (!c.direction) {
      throw new Error('Direction is required');
    }
    this.direction = c.direction;
    if (c.direction == 'sub' || c.direction == 'all') {
      this.subConnection = new WebSocket(
        `${c.readHost}:${c.readPort}/streams/${encodeURIComponent(c.streamId)}/subscribe`
      );
      this.subStatus = this.getStatusPromise(this.subConnection);
    }
    if (c.direction == 'pub' || c.direction == 'all') {
      // eslint-disable-next-line prettier/prettier
      const pubUri = `${c.writeHost}:${c.writePort}/streams/${encodeURIComponent(c.streamId)}/publish?apiKey=${
        c.apiKey
      }`;
      this.pubConnection = new WebSocket(pubUri);
      this.pubStatus = this.getStatusPromise(this.pubConnection);
    }
  }

  private getStatusPromise(connection) {
    return new Promise<Status>((resolve, reject) => {
      connection.on('open', function connection() {
        resolve(Status.connected);
      });
      connection.on('error', (err) => {
        this.error = err;
        reject(Status.error);
      });
      connection.on('close', () => {
        this.error = 'Connection closed';
        reject(Status.closed);
      });
      connection.on('unexpected-response', (request) => {
        console.error(request);
        this.error = request;
        reject(Status.unexpected);
      });
    });
  }

  public async pub(data, onError?: (err?: Error) => void) {
    return this.pubConnection.send(JSON.stringify(data), onError);
  }

  public sub(onMessage, onError) {
    if (this.subConnection.readyState !== WebSocket.OPEN) {
      throw new Error('Sub connection is not open. Status: ' + this.subConnection.readyState);
    }
    this.subConnection.on('message', (data) => onMessage(JSON.parse(data.toString())));
    this.subConnection.on('error', (err) => onError(err)).on('unexpected-response', (err) => onError(err));
  }

  public close() {
    switch (this.direction) {
      case 'pub':
        this.pubConnection.close();
        break;
      case 'sub':
        this.subConnection.close();
        break;
      case 'all':
        this.subConnection.close();
        this.pubConnection.close();
        break;
    }
  }

  private async checkConnectionStatus() {
    if (this.direction == 'pub' || this.direction == 'all') {
      const pubStatus = await this.pubStatus;
      if (pubStatus != Status.connected) {
        throw new Error('Pub connection error: ' + this.error);
      }
    }
    if (this.direction == 'sub' || this.direction == 'all') {
      const subStatus = await this.subStatus;
      if (subStatus != Status.connected) {
        throw new Error('Sub connection error: ' + this.error);
      }
    }
  }
}
