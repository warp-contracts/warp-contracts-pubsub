import { StreamrConnectionOptions, StreamrWsClient } from './streamrWsClient';
import { beforeEach, afterEach } from '@jest/globals';
import * as dotenv from 'dotenv';

describe('streamrTransport test', () => {
  dotenv.config();
  let streamrTransport: StreamrWsClient;
  const streamrApiKey = process.env.STREAMR_WRITE_APIKEY;
  expect(streamrApiKey).not.toBe('');
  const streamrHost = 'ws://redstone-nlb-prod-b3c531f79942790e.elb.eu-central-1.amazonaws.com';
  const streamrReadPort = 7170;
  const streamrWritePort = 7180;
  expect(streamrHost).not.toBe('');
  const streamId = '0xc2ae2d5523080b64cc788cddc91ff59a3e29f911/common';
  const connection: StreamrConnectionOptions = {
    apiKey: streamrApiKey,
    writeHost: streamrHost,
    writePort: streamrWritePort,
    readHost: streamrHost,
    readPort: streamrReadPort,
    streamId: streamId,
    direction: 'all'
  };
  describe('happy path', () => {
    beforeEach(() => {
      streamrTransport = new StreamrWsClient(connection);
    });
    afterEach(() => streamrTransport.close());
    it('should be able to publish and read message', async () => {
      const onMessage = new Promise((resolve, reject) => {
        streamrTransport.sub(resolve, reject);
      });
      const data = { some: 'object' };
      await streamrTransport.pub(data);
      const actual = await onMessage;
      expect(actual).toStrictEqual(data);
    });
  });
});
