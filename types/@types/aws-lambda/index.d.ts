import { APIGatewayEvent, Context, Handler, APIGatewayProxyResult } from 'aws-lambda';
import { Writable } from 'stream';

global {
  declare namespace awslambda {
    export namespace HttpResponseStream {
      function from(writable: Writable, metadata: Pick<APIGatewayProxyResult, 'statusCode' | 'headers'>): Writable;
    }

    export type StreamifyHandler = (event: APIGatewayEvent, responseStream: Writable, context: Context) => Promise<any>;

    export function streamifyResponse(handler: StreamifyHandler): Handler<any, any>;
  }
}
