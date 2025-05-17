import {
  type SmartHomeV1ExecutePayload,
  type SmartHomeV1QueryPayload,
  type SmartHomeV1Response,
  type SmartHomeV1SyncPayload,
} from 'actions-on-google';
import type { SmartHomeRequestSchema } from '../../schema/SmartHome';
import { onExecute } from './onExecute';
import { onQuery } from './onQuery';
import { onSync } from './onSync';

export async function smartHomeFulfillmentProcessor(
  request: SmartHomeRequestSchema,
  userId: string,
): Promise<SmartHomeV1Response> {
  const input = request.inputs[0];

  let payload:
    | SmartHomeV1SyncPayload
    | SmartHomeV1QueryPayload
    | SmartHomeV1ExecutePayload;

  switch (input.intent) {
    case 'action.devices.SYNC':
      payload = onSync(userId);
      break;
    case 'action.devices.QUERY':
      payload = await onQuery(input.payload);
      break;
    case 'action.devices.EXECUTE':
      payload = await onExecute(input.payload);
      break;
    case 'action.devices.DISCONNECT':
      return onDisconnect();
  }

  return {
    requestId: request.requestId,
    payload,
  };
}

export function onDisconnect() {
  console.log('User account unlinked from Google Assistant');
  return {};
}
