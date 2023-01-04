# Streamr

## Configure client

Create client:
```typescript
const client = new StreamrWsClient({
  direction: 'all'
});
```
Please see [StreamrConnectionOptions](src/streamr/streamrWsClient.ts) for more configuration details.

## Subscribe to a stream

```typescript
const streamId = 'streamId';

const pubsub = await StreamrWsClient.create({
direction: 'sub',
streamId: streamId
});
pubsub.sub(
  (data) => console.log(data), 
  (err) => console.error('Failed to subscribe:', err)
);
```

## Publish to a stream

```typescript
const streamId = 'streamId';
const pubsub = StreamrWsClient.create({
  direction: 'sub',
  streamId: streamId
});
const data = { some: 'object' };
pubsub.pub(data, (err) => console.error('Failed to publish:', err));
```
