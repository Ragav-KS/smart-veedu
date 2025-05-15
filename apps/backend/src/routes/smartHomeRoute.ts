/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { SmartHomeV1Response } from 'actions-on-google';
import { factory } from '../hono-factory';
import { app } from '../services/smarthomeApp';

export const smartHomeRoute = factory.createApp();

smartHomeRoute.all('/fulfillment', async (c) => {
  const body = await c.req.json();
  const headers = Object.fromEntries(c.req.raw.headers.entries());

  const response = (await app.handler(body, headers)) as {
    body: SmartHomeV1Response;
  };

  return c.json(response.body);
});
