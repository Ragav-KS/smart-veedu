import type { SmartHomeV1SyncPayload } from 'actions-on-google';

export function onSync(userId: string): SmartHomeV1SyncPayload {
  return {
    agentUserId: userId,
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
  };
}
