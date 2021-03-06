import type { RecipeStep } from "../content/recipes";
import type { ProgressWait } from "../state/state";

// Minimal definition of non-yet-standard API.
declare global {
  class TimestampTrigger {
    constructor(timestamp: Date);
  }
}

const NOTIFICATION_TAG = 'step';

async function checkNotificationPermissions() {
  let { state } = await navigator.permissions.query({ name: 'notifications' });
  if (state === 'prompt') {
    await Notification.requestPermission();
  }
  state = (await navigator.permissions.query({ name: 'notifications' })).state;
  if (state !== 'granted') {
    return false;
  }
  return true;
}

export async function notifyOngoingStep(step: RecipeStep) {
  showNotification(NOTIFICATION_TAG, `Current step: ${step.title}`, {
    silent: true,
  });
}

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeStyle: 'short',
  hourCycle: 'h23',
} as any);

export async function notifyWait(currentWait: ProgressWait) {
  // TODO: Schedule notifications every minutes to update the timer
  // TODO: can't do this - need to reuse tag to replace, but then overrides schedule?
  // const nextStepTitle = currentWait.nextStep.title;
  // const endTime = currentWait.endWaitTime;
  // let first = true;
  // for (let d = new Date(), offsetMins = 0; d < endTime; d.setMinutes(d.getMinutes() + 1)) {
  //     const remainingMillis = endTime - d;
  //     const remainingMins = Math.round(remainingMillis / 1000 / 60);
  //     const title = `Next step: ${nextStepTitle} at ${timeFormat.format(endTime)}`;
  //     const body = `Wait another ${remainingMins} minutes`;
  //     console.log('schedule', new Date(d), title, body);
  //     // TODO: silent
  //     createScheduledNotification(NOTIFICATION_TAG + '-' + i, new Date(d), title, {
  //         body,
  //     });
  // }
  // console.log(await listNotifications());
  const nextStepTitle = currentWait.nextStep?.title;
  const endTime = currentWait.endWaitTime;
  // TODO(!!): handle if undefined
  if (!endTime) {
    console.error('Missing endtime');
    return;
  }

  const d = new Date();
  const remainingMillis = endTime.getTime() - d.getTime();
  const remainingMins = Math.round(remainingMillis / 1000 / 60);
  const waitingTitle = `Next step: ${nextStepTitle} at ${timeFormat.format(endTime)}`;
  const readyTitle = `Ready for next step: ${nextStepTitle}`;
  // const body = `Wait another ${remainingMins} minutes`;
  // TODO: show different actions?
  createScheduledNotification(NOTIFICATION_TAG, new Date(d), waitingTitle, {
    // body,
    silent: true,
    requireInteraction: true,
  });
  // TODO: how to delete once the next one below is triggered with different tag?

  // Schedule notification at the end to vibrate
  createScheduledNotification(NOTIFICATION_TAG + '-alarm', endTime, readyTitle, {
    // body,
    silent: false,
    requireInteraction: true,
  });
  // TODO: notify every N while after?
}

export async function clearNotifications() {
  await clearNotification(NOTIFICATION_TAG);
}

const showNotification = async (tag: string, title: string, { body, data, silent }: NotificationOptions) => {
  if (! await checkNotificationPermissions()) {
    return alert('You need to grant notifications permission for this feature to work.');
  }

  // Add timeout to avoid issues where the action clicks are not
  // triggering notificationclick.
  setTimeout(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    // TODO(!!): handle if undefined
    registration!.showNotification(title, {
      tag,
      body,
      data,
      silent,
      vibrate: silent ? undefined : VIBRATE_SEQUENCE,
      requireInteraction: true,
      actions: [
        { action: 'done', title: 'Done' },
      ],
    });
  });
};

const VIBRATE_SEQUENCE = [200, 100, 200, 100, 200, 100, 200];

async function createScheduledNotification(tag: string, timestamp: Date, title: string, { body, data, silent, requireInteraction }: NotificationOptions) {
  if (! await checkNotificationPermissions()) {
    return alert('You need to grant notifications permission for this feature to work.');
  }

  const registration = await navigator.serviceWorker.getRegistration();
  // TODO(!!): handle if undefined
  registration!.showNotification(title, {
    tag,
    body,
    data,
    silent,
    vibrate: silent ? undefined : VIBRATE_SEQUENCE,
    /* icon: '../images/touch/chrome-touch-icon-192x192.png', */
    requireInteraction,
    showTrigger: new TimestampTrigger(timestamp),
    actions: [
      { action: 'next', title: 'Start next step' },
      { action: 'snooze', title: '10 more min' },
    ],
  } as any); // any to use new APIs
};


const clearNotification = async (tag: string) => {
  const notifications = await listNotifications(tag);
  notifications.forEach(notification => notification.close());
};

const listNotifications = async (tag: string) => {
  const registration = await navigator.serviceWorker.getRegistration();
  // TODO(!!): handle if undefined
  return await registration!.getNotifications({
    tag,
    includeTriggered: true,
  } as any); // any to use new APIs
};
