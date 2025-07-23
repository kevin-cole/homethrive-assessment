import { ApiGatewayV2 } from "@sst/aws-apigatewayv2"

import { bucket } from './storage.ts'

export const api = new ApiGatewayV2("Api");

api.route("GET /", {
  link: [bucket],
  handler: "packages/functions/src/api.handler",
});
