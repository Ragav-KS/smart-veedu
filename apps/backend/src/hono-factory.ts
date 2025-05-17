import type { Env } from 'hono';
import type {
  ApiGatewayRequestContext,
  LambdaContext,
  LambdaEvent,
} from 'hono/aws-lambda';
import { Factory } from 'hono/factory';
import type { Bindings, Variables } from 'hono/types';

export interface CustomApiGatewayRequestContext
  extends ApiGatewayRequestContext {
  authorizer: {
    claims: {
      origin_jti: string;
      sub: string;
      token_use: string;
      scope: string;
      auth_time: string;
      iss: string;
      exp: string;
      version: string;
      iat: string;
      client_id: string;
      jti: string;
      username: string;
    };
  };
}

interface AWSBindings extends Bindings {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
  requestContext: CustomApiGatewayRequestContext;
}

export interface CustomVariables extends Variables {
  authClaims: CustomApiGatewayRequestContext['authorizer']['claims'];
  jwtPayload: CustomApiGatewayRequestContext['authorizer']['claims'];
}

interface AWSHonoEnv extends Env {
  Bindings: AWSBindings;
  Variables: CustomVariables;
}

export const factory = new Factory<AWSHonoEnv>();
