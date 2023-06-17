import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { tables } from '@architect/functions';

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  await delayRandomly();

  try {
    const { id, hash } = event.pathParameters || {};

    if (typeof id !== 'string' || typeof hash !== 'string') {
      return {
        statusCode: 404,
        body: JSON.stringify({ status: 'error' }),
        headers: {
          'content-type': 'application/json; charset=utf8',
        },
      };
    }

    const keys = await tables().then((client) => client.keys);
    const entry = (await keys.get({ id })) as unknown;

    if (
      !isRecord(entry) ||
      typeof entry?.key !== 'string' ||
      typeof entry?.checksum !== 'string'
    ) {
      return {
        statusCode: 404,
        body: JSON.stringify({ status: 'error' }),
        headers: {
          'content-type': 'application/json; charset=utf8',
        },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', valid: entry.checksum === hash }),
      headers: {
        'content-type': 'application/json; charset=utf8',
      },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error' }),
      headers: {
        'content-type': 'application/json; charset=utf8',
      },
    };
  }
};

function isRecord(arg: unknown): arg is Record<string, unknown> {
  return typeof arg === 'object' && arg !== null;
}

function delayRandomly() {
  const delay = 1000 + Math.random() * 3000;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
