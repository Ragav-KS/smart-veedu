import type {
  SmartHomeV1DisconnectRequest,
  SmartHomeV1ExecuteRequestCommands,
  SmartHomeV1ExecuteRequestInputs,
  SmartHomeV1QueryRequestDevices,
  SmartHomeV1QueryRequestInputs,
  SmartHomeV1Request,
  SmartHomeV1SyncRequestInputs,
} from 'actions-on-google';
import { z } from 'zod';

const syncRequestInputsSchema = z.object({
  intent: z.literal('action.devices.SYNC'),
}) satisfies z.ZodType<SmartHomeV1SyncRequestInputs>;

const smartHomeDevicesSchema = z.object({
  id: z.string(),
  customData: z.record(z.any()).optional(),
}) satisfies z.ZodType<SmartHomeV1QueryRequestDevices>;

const queryRequestInputsSchema = z.object({
  intent: z.literal('action.devices.QUERY'),
  payload: z.object({
    devices: z.array(smartHomeDevicesSchema),
  }),
}) satisfies z.ZodType<SmartHomeV1QueryRequestInputs>;

const executeRequestCommandSchema = z.object({
  devices: z.array(smartHomeDevicesSchema),
  execution: z.array(
    z.object({
      command: z.string(),
      params: z.record(z.any()).optional(),
      challenge: z
        .object({
          pin: z.string().optional(),
          ack: z.boolean().optional(),
        })
        .optional(),
    }),
  ),
}) satisfies z.ZodType<SmartHomeV1ExecuteRequestCommands>;

const executeRequestInputsSchema = z.object({
  intent: z.literal('action.devices.EXECUTE'),
  payload: z.object({
    commands: z.array(executeRequestCommandSchema),
  }),
}) satisfies z.ZodType<SmartHomeV1ExecuteRequestInputs>;

const disconnectRequestInputsSchema = z.object({
  intent: z.literal('action.devices.DISCONNECT'),
}) satisfies z.ZodType<SmartHomeV1DisconnectRequest['inputs'][number]>;

export const smartHomeRequestSchema = z.object({
  requestId: z.string(),
  inputs: z.array(
    z.discriminatedUnion('intent', [
      syncRequestInputsSchema,
      queryRequestInputsSchema,
      executeRequestInputsSchema,
      disconnectRequestInputsSchema,
    ]),
  ),
}) satisfies z.ZodType<SmartHomeV1Request>;

export type SmartHomeRequestSchema = z.infer<typeof smartHomeRequestSchema>;
