import { API, graphqlOperation } from '@aws-amplify/api';
import { Amplify } from '@aws-amplify/core';

const subscribeDoc = /* GraphQL */ `
  subscription Subscribe($name: String!) {
    subscribe(name: $name) {
      data
      name
    }
  }
`;

const publishDoc = /* GraphQL */ `
  mutation Publish($data: AWSJSON!, $name: String!) {
    publish(data: $data, name: $name) {
      data
      name
    }
  }
`;

export function initPubSub() {
  Amplify.configure({
    aws_appsync_graphqlEndpoint: 'https://6z7ifnfgrfhnxm57ky46bus2su.appsync-api.eu-north-1.amazonaws.com/graphql',
    aws_appsync_region: 'eu-north-1',
    aws_appsync_authenticationType: 'AWS_LAMBDA'
  });
}

export async function publish(name, data, authToken) {
  return API.graphql(graphqlOperation(publishDoc, { name, data }, authToken));
}

export async function subscribe(name, next, error) {
  return (API.graphql(graphqlOperation(subscribeDoc, { name }, 'any')) as any).subscribe({
    next: ({ provider, value }) => {
      next(value.data.subscribe, provider, value);
    },
    error: error || console.dir
  });
}
