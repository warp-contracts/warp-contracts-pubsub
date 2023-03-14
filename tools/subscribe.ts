/* eslint-disable */
import { initPubSub, subscribe } from '../src/appsync';

async function main() {
  global.WebSocket = require('ws');

  initPubSub();
  try {
    subscribe(
      `contracts`,
      async ({ data }: any) => {
        const message = JSON.parse(data);
        console.debug('New message received', message);
      },
      console.error
    )
      .then(() => {
        console.debug('Subscribed to interactions for');
      })
      .catch((e) => {
        console.error('Error while subscribing', e.error);
      });
  } catch (e: any) {
    console.error(e.error);
  }
}

main().catch((e) => console.error(e));
