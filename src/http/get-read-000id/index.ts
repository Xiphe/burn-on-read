import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import Document from '@architect/views/document';
import Content from '@architect/views/content';
import { tables } from '@architect/functions';
import Reader from '@architect/views/reader';

const NOT_FOUND = Symbol('NOT_FOUND');

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  await delayRandomly();

  try {
    const id = event.pathParameters?.id;
    if (typeof id !== 'string') {
      throw NOT_FOUND;
    }

    const keys = await tables().then((client) => client.keys);
    const entry = (await keys.get({ id })) as unknown;

    if (
      !isRecord(entry) ||
      typeof entry?.key !== 'string' ||
      typeof entry?.checksum !== 'string'
    ) {
      throw NOT_FOUND;
    }

    return {
      statusCode: 200,
      body: Document({
        navId: 'about',
        title: 'Someone has send you a secret message.',
        children: Content({
          children: Reader({ id }),
        }),
      }),
      headers: {
        'content-type': 'text/html; charset=utf8',
      },
    };
  } catch (err) {
    if (err === NOT_FOUND) {
      return {
        statusCode: 404,
        body: Document({
          navId: 'read',
          title: 'Not found',
          children: Content({
            children:
              'This message either does not exist. This could also mean it has already been read',
          }),
        }),
        headers: {
          'content-type': 'text/html; charset=utf8',
        },
      };
    }

    console.log(err);
    return {
      statusCode: 500,
      body: Document({
        navId: 'read',
        title: 'Error',
        children: 'Something went terribly wrong here...',
      }),
      headers: {
        'content-type': 'text/html; charset=utf8',
      },
    };
  }
};

function delayRandomly() {
  const delay = 1000 + Math.random() * 3000;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function isRecord(arg: unknown): arg is Record<string, unknown> {
  return typeof arg === 'object' && arg !== null;
}
