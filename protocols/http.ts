import { APIGatewayProxyResult } from 'aws-lambda'

export class HttpResponse implements APIGatewayProxyResult {
  statusCode: number;
  body: string;
}