import type {
  SmartHomeV1QueryPayload,
  SmartHomeV1QueryRequestPayload,
} from 'actions-on-google';

export async function onQuery(
  payload: SmartHomeV1QueryRequestPayload,
): Promise<SmartHomeV1QueryPayload> {
  const devices = payload.devices;
  const queryResult = await Promise.all(
    devices.map(async ({ id }) => ({
      deviceId: id,
      queryResult: await queryDevice(id),
    })),
  );

  const deviceData = queryResult.reduce<SmartHomeV1QueryPayload['devices']>(
    (acc, { deviceId, queryResult }) => ({
      ...acc,
      [deviceId]: queryResult,
    }),
    {},
  );

  return {
    devices: deviceData,
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
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

export const queryDevice = async (deviceId: string) => {
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
