import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { tables } from '@architect/functions';
import { randomUUID } from 'node:crypto';
import { isRecord } from '@architect/shared/is';
import { encrypt } from '@architect/shared/encrypt';

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}') as unknown;

    if (!isRecord(body)) {
      throw new Error('Invalid body');
    }

    const { key, checksum } = body;

    if (typeof key !== 'string' || typeof checksum !== 'string') {
      throw new Error('Invalid body');
    }

    const keys = await tables().then((client) => client.keys);
    const keyId = randomUUID();

    await keys.put({
      id: keyId,
      key: await encrypt(Buffer.from(key, 'base64')),
      checksum,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', keyId }),
      headers: {
        'content-type': 'application/json; charset=utf8',
      },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error' }),
    };
  }
};
