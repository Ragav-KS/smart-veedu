import { handle } from 'hono/aws-lambda';
import { HTTPException } from 'hono/http-exception';
import { factory } from './hono-factory';
import { smartHomeRoute } from './routes/smartHomeRoute';

export const app = factory.createApp();

app.notFound((c) => {
  return c.json(
    {
      message: 'Not found',
    },
    404,
  );
});

app.onError((err, c) => {
  console.error(err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      message: 'Internal Server Error',
    },
    500,
  );
});

app.route('/smart-home', smartHomeRoute);

export const handler = handle(app);
