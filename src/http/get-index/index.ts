import type {
  Context,
  APIGatewayProxyResult,
  APIGatewayEvent,
} from 'aws-lambda';
import Document from '@architect/views/document';
import Content from '@architect/views/content';

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: Document({
      navId: 'about',
      title: 'How to securely share messages.',
      children: Content({
        children: 'Hello world!',
      }),
    }),
    headers: {
      'content-type': 'text/html; charset=utf8',
    },
  };
};
