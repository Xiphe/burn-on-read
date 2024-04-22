import type {
  Context,
  APIGatewayProxyResult,
  APIGatewayEvent,
} from 'aws-lambda';
import { tables } from '@architect/functions';
import { delayRandomly } from '@architect/shared/randomDelay';
import { isRecord } from '@architect/shared/is';

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
      body: JSON.stringify({
        status: 'ok',
        valid: entry.checksum === hash,
      }),
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
