import { StreamrConnectionOptions, StreamrWsClient } from './streamrWsClient';
import { beforeEach, afterEach } from '@jest/globals';
import * as dotenv from 'dotenv';

describe('streamrTransport test', () => {
  dotenv.config();
  let streamrTransport: StreamrWsClient;
  const streamrApiKey = process.env.STREAMR_WRITE_APIKEY;
  expect(streamrApiKey).not.toBe('');
  const streamId = '0xc2ae2d5523080b64cc788cddc91ff59a3e29f911/common';
  const connection: StreamrConnectionOptions = {
    apiKey: streamrApiKey,
    streamId: streamId,
    direction: 'all'
  };
  describe('happy path', () => {
    beforeEach(async () => {
      streamrTransport = await StreamrWsClient.create(connection);
    });
    afterEach(() => streamrTransport.close());
    it('should be able to publish and read message', (done) => {
      const data = { some: 'object' };
      streamrTransport.sub(
        (msg) => {
          expect(msg).toStrictEqual(data);
          done();
        },
        (err) => fail(err)
      );
      streamrTransport.pub(data);
    });
  });
});
