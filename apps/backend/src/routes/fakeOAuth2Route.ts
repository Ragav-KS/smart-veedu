/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { format } from 'node:util';
import { factory } from '../hono-factory';

export const fakeOAuth2Route = factory.createApp();

fakeOAuth2Route.get('/authenticate', async (c) => {
  const redirect_uri = c.req.query('redirect_uri')!;
  const state = c.req.query('state')!;

  const responseUrl = format(
    '%s?code=%s&state=%s',
    decodeURIComponent(redirect_uri),
    'xxxxxx',
    state,
  );

  console.log(`Set redirect as ${responseUrl}`);

  return c.redirect(
    `/fake-oauth2/login?responseUrl=${encodeURIComponent(responseUrl)}`,
  );
});

fakeOAuth2Route
  .get('/login', async (c) => {
    console.log('Requesting login page');

    const responseUrl = c.req.query('responseUrl');
    const state = c.req.query('state');

    return c.html(`
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <form action="/api/login" method="post">
            <input type="hidden"
              name="responseUrl" value="${responseUrl}" />
            <input type="hidden"
              name="state" value="${state}" />
            <button type="submit" style="font-size:14pt">
              Link this service to Google
            </button>
          </form>
        </body>
      </html>
    `);
  })
  .post(async (c) => {
    const formData = await c.req.formData();

    const responseUrl = formData.get('responseUrl') as string;
    const state = formData.get('state') as string;

    const decodedResponseUrl = format(
      '%s&state=%s',
      decodeURIComponent(responseUrl),
      state,
    );

    console.log(`Redirect to ${decodedResponseUrl}`);

    return c.redirect(decodedResponseUrl);
  });

fakeOAuth2Route.all('/token', async (c) => {
  const formData = await c.req.formData();

  const grantType = c.req.query('grant_type')!
    ? c.req.query('grant_type')!
    : (formData.get('grant_type') as string);

  const secondsInDay = 86400; // 60 * 60 * 24
  const HTTP_STATUS_OK = 200;
  console.log(`Grant type ${grantType}`);

  let obj;
  if (grantType === 'authorization_code') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      refresh_token: '123refresh',
      expires_in: secondsInDay,
    };
  } else if (grantType === 'refresh_token') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      expires_in: secondsInDay,
    };
  }

  return c.json(obj, HTTP_STATUS_OK);
});
