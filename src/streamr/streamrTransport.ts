import WebSocket from 'ws';

type Direction = 'pub' | 'sub' | 'all';
export type StreamrConnectionOptions = {
  /**
   * To create a stream please visit https://streamr.network/core/streams.
   */
  streamId: string;
  /**
   * @example: ws://my.host
   */
  writeHost: string;
  /**
   * @default 7170
   */
  writePort?: number;
  /**
   * @example: ws://my.host
   */
  readHost: string;
  /**
   * @default 7170
   */
  readPort?: number;
  /**
   * Api key required for 'pub' (and 'all') direction.
   * The key defined in the streamr broker configuration.
   */
  apiKey?: string;
  direction?: Direction;
};

const CONNECTION_DEFAULTS = {
  readHost: 'ws://redstone-nlb-prod-b3c531f79942790e.elb.eu-central-1.amazonaws.com',
  readPort: 7170,
  writeHost: 'ws://redstone-nlb-prod-b3c531f79942790e.elb.eu-central-1.amazonaws.com',
  writePort: 7180
};

enum Status {
  connected,
  error,
  closed,
  unexpected
}

export class StreamrTransport {
  private readonly subConnection: WebSocket;
  private readonly pubConnection: WebSocket;
  private readonly subStatus: Promise<Status>;
  private readonly pubStatus: Promise<Status>;
  private readonly direction: Direction;
  private error;

  constructor(connection: StreamrConnectionOptions) {
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

  public async pub(data) {
    await this.checkPubConnectiontatus();
    return this.pubConnection.send(JSON.stringify(data));
  }

  public async sub(onMessage, onError) {
    this.subConnection.on('open', () => {
      this.subConnection.on('message', (data) => onMessage(JSON.parse(data.toString())));
    });
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

  private async checkPubConnectiontatus() {
    const status = await this.pubStatus;
    if (status != Status.connected) {
      console.error(this.error);
      throw new Error(status.toString());
    }
  }
}
