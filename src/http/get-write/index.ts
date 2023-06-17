import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import Document from '@architect/views/document';
import Editor from '@architect/views/editor';

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: Document({
      navId: 'write',
      title: 'Write your burn-on-read message.',
      children: Editor(),
    }),
    headers: {
      'content-type': 'text/html; charset=utf8',
    },
  };
};
