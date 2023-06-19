import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { tables } from '@architect/functions';
import { delayRandomly } from '@architect/shared/randomDelay';
import { isRecord } from '@architect/shared/is';

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  await delayRandomly();

  try {
    const body = JSON.parse(event.body || '{}') as unknown;

    if (
      !isRecord(body) ||
      typeof body.checksum !== 'string' ||
      typeof body.id !== 'string'
    ) {
      return {
        statusCode: 404,
        body: JSON.stringify({ status: 'error' }),
        headers: {
          'content-type': 'application/json; charset=utf8',
        },
      };
    }

    const keys = await tables().then((client) => client.keys);
    const entry = (await keys.get({ id: body.id })) as unknown;

    if (
      !isRecord(entry) ||
      typeof entry?.key !== 'string' ||
      typeof entry?.checksum !== 'string' ||
      entry.checksum !== body.checksum
    ) {
      return {
        statusCode: 404,
        body: JSON.stringify({ status: 'error' }),
        headers: {
          'content-type': 'application/json; charset=utf8',
        },
      };
    }

    // TODO: decrypt it with KMS
    await keys.delete({ id: body.id });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', key: entry.key }),
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
