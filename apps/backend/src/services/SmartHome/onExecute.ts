/* eslint-disable @typescript-eslint/no-non-null-assertion */
// /* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  SmartHomeV1ExecutePayload,
  SmartHomeV1ExecuteRequestExecution,
  SmartHomeV1ExecuteRequestPayload,
  SmartHomeV1ExecuteResponseCommands,
} from 'actions-on-google';
import { z } from 'zod';
import { queryDevice } from './onQuery';

export async function onExecute(
  payload: SmartHomeV1ExecuteRequestPayload,
): Promise<SmartHomeV1ExecutePayload> {
  const commandResults = await Promise.all(
    payload.commands.map(async (command) => {
      const devices = command.devices;
      const execution = command.execution;

      // Execute the command for each device
      const executionResult = await Promise.all(
        devices
          .map((device) =>
            execution.map((execution) => updateDevice(execution, device.id)),
          )
          .flat(),
      );

      return {
        ids: command.devices.map((device) => device.id),
        status: 'SUCCESS',
        states: executionResult.reduce(
          (acc, data) => {
            Object.assign(acc, data);
            return acc;
          },
          {
            online: true,
          },
        ),
      } satisfies SmartHomeV1ExecuteResponseCommands;
    }),
  );

  return {
    commands: commandResults,
  };
}

const updateDevice = async (
  execution: SmartHomeV1ExecuteRequestExecution,
  deviceId: string,
) => {
  const { params, command } = execution;

  const parsedParams = z
    .object({
      on: z.boolean().optional(),
      start: z.boolean().optional(),
      pause: z.boolean().optional(),
    })
    .parse(params);

  let state: Record<string, boolean> = {};
  switch (command) {
    case 'action.devices.commands.OnOff':
      state = { on: parsedParams.on! };
      break;
    case 'action.devices.commands.StartStop':
      state = parsedParams.start
        ? { isRunning: true, isPaused: false }
        : { isRunning: false, isPaused: false };
      break;
    case 'action.devices.commands.PauseUnpause':
      {
        const data = await queryDevice(deviceId);

        state =
          !data.isPaused && !data.isRunning
            ? { isRunning: false, isPaused: false }
            : {
                isRunning: !parsedParams.pause!,
                isPaused: parsedParams.pause!,
              };
      }
      break;
  }

  // Update the device state in the database
  return state;
};
