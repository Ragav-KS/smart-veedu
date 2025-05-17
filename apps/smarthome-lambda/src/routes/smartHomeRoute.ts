import { zValidator } from '@hono/zod-validator';
import { jwk } from 'hono/jwk';
import { factory } from '../hono-factory';
import { smartHomeRequestSchema } from '../schema/SmartHome';
import { smartHomeFulfillmentProcessor } from '../services/SmartHome/fulfillmentProcessor';

export const smartHomeRoute = factory.createApp();

if (import.meta.env.VITE_IS_LOCAL_RUN) {
  smartHomeRoute.use(
    '*',
    jwk({
      jwks_uri: import.meta.env.VITE_USER_POOL_TOKEN_SIGNING_URL,
    }),
  );
}

smartHomeRoute.use('*', (c, next) => {
  c.set(
    'authClaims',
    !import.meta.env.VITE_IS_LOCAL_RUN
      ? c.env.requestContext.authorizer.claims
      : c.get('jwtPayload'),
  );
  return next();
});

smartHomeRoute.post(
  '/fulfillment',
  zValidator('json', smartHomeRequestSchema),
  async (c) => {
    const smartHomeRequest = c.req.valid('json');
    const authClaims = c.get('authClaims');

    const response = await smartHomeFulfillmentProcessor(
      smartHomeRequest,
      authClaims.sub,
    );

    return c.json(response);
  },
);
