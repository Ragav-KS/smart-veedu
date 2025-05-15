/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  smarthome,
  type SmartHomeV1ExecuteRequestExecution,
  type SmartHomeV1ExecuteResponseCommands,
} from 'actions-on-google';

export const app = smarthome({
  // debug: true,
});

// Hardcoded user ID
const USER_ID = '123';

const queryFirebase = async (deviceId: string) => {
  console.log('Querying Firebase for device state:', deviceId);

  // Fetch this data from database
  const snapshotVal = {
    OnOff: {
      on: true,
    },
    StartStop: {
      isPaused: false,
      isRunning: true,
    },
  };

  return {
    on: snapshotVal.OnOff.on,
    isPaused: snapshotVal.StartStop.isPaused,
    isRunning: snapshotVal.StartStop.isRunning,
  };
};

const queryDevice = async (deviceId: string) => {
  const data = await queryFirebase(deviceId);

  return {
    on: data.on,
    isPaused: data.isPaused,
    isRunning: data.isRunning,
    currentRunCycle: [
      {
        currentCycle: 'rinse',
        nextCycle: 'spin',
        lang: 'en',
      },
    ],
    currentTotalRemainingTime: 1212,
    currentCycleRemainingTime: 301,
  };
};

const updateDevice = async (
  execution: SmartHomeV1ExecuteRequestExecution,
  deviceId: string,
) => {
  const { params, command } = execution;
  let state: Record<string, boolean> = {};
  switch (command) {
    case 'action.devices.commands.OnOff':
      state = { on: params!.on };
      break;
    case 'action.devices.commands.StartStop':
      state = params!.start
        ? { isRunning: true, isPaused: false }
        : { isRunning: false, isPaused: false };
      break;
    case 'action.devices.commands.PauseUnpause':
      {
        const data = await queryDevice(deviceId);

        state =
          data.isPaused === false && data.isRunning === false
            ? { isRunning: false, isPaused: false }
            : { isRunning: !params!.pause, isPaused: params!.pause };
      }
      break;
  }

  // Update the device state in the database
  return state;
};

app.onQuery(async (body) => {
  const { requestId } = body;
  const payload = {
    devices: {} as Record<string, object>,
  };
  const queryPromises = [];
  const intent = body.inputs[0];
  for (const device of intent.payload.devices) {
    const deviceId = device.id;
    queryPromises.push(
      queryDevice(deviceId).then((data) => {
        // Add response to device payload
        payload.devices[deviceId] = data;
      }),
    );
  }
  // Wait for all promises to resolve
  await Promise.all(queryPromises);
  return {
    requestId: requestId,
    payload: payload,
  };
});

app.onSync((body) => {
  return {
    requestId: body.requestId,
    payload: {
      agentUserId: USER_ID,
      devices: [
        {
          id: 'washer',
          type: 'action.devices.types.WASHER',
          traits: [
            'action.devices.traits.OnOff',
            'action.devices.traits.StartStop',
            'action.devices.traits.RunCycle',
          ],
          name: {
            defaultNames: ['My Washer'],
            name: 'Washer',
            nicknames: ['Washer'],
          },
          deviceInfo: {
            manufacturer: 'Sundararagavan K S',
            model: 'test-washer',
            hwVersion: '1.0',
            swVersion: '1.0.1',
          },
          willReportState: true,
          attributes: {
            pausable: true,
          },
        },
      ],
    },
  };
});

app.onExecute(async (body) => {
  const { requestId } = body;
  // Execution results are grouped by status
  const result = {
    ids: [],
    status: 'SUCCESS',
    states: {
      online: true,
    },
  } as SmartHomeV1ExecuteResponseCommands;

  const executePromises = [];
  const intent = body.inputs[0];
  for (const command of intent.payload.commands) {
    for (const device of command.devices) {
      for (const execution of command.execution) {
        executePromises.push(
          updateDevice(execution, device.id)
            .then((data) => {
              result.ids.push(device.id);
              Object.assign(result.states!, data);
            })
            .catch(() => console.error('EXECUTE', device.id)),
        );
      }
    }
  }

  await Promise.all(executePromises);
  return {
    requestId: requestId,
    payload: {
      commands: [result],
    },
  };
});

app.onDisconnect(() => {
  console.log('User account unlinked from Google Assistant');
  // Return empty response
  return {};
});
