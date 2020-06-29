
const NOTIFICATION_TAG = 'step';

async function checkNotificationPermissions() {
    let {state} = await navigator.permissions.query({name: 'notifications'});
    if (state === 'prompt') {
        await Notification.requestPermission();
    } 
    state = (await navigator.permissions.query({name: 'notifications'})).state;
    if (state !== 'granted') {
        return false;
    }
    return true;
}

export async function notifyOngoingStep(step) {
    showNotification(NOTIFICATION_TAG, `Current step: ${step.title}`);
}

const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeStyle: 'short',
    hourCycle: 'h23',
});

export async function notifyWait(currentWait) {
    // TODO: Schedule notifications every minutes to update the timer
    const nextStepTitle = currentWait.nextStep.title;
    const endTime = currentWait.endWaitTime;

    const d = new Date();
    const remainingMillis = endTime - d;
    const remainingMins = Math.round(remainingMillis / 1000 / 60);
    const title = `Next step: ${nextStepTitle} at ${timeFormat.format(endTime)}`;
    const body = `Wait another ${remainingMins} minutes`;
    createScheduledNotification(NOTIFICATION_TAG, new Date(d), title, {
        body,
        silent: true,
    });
    // TODO: how to delete once the next one below is triggered with different tag?

    // Schedule notification at the end to vibrate
    createScheduledNotification(NOTIFICATION_TAG + '-alarm', endTime, title, {
        body,
        silent: false,
    });
    // TODO: notify every N while after?
}

export async function clearNotifications() {
    await clearNotification(NOTIFICATION_TAG);
}

const showNotification = async (tag, title) => {
    if (! await checkNotificationPermissions()) {
        return alert('You need to grant notifications permission for this feature to work.');
    }

    // Add timeout to avoid issues where the action clicks are not
    // triggering notificationclick.
    setTimeout(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        registration.showNotification(title, {
            tag,
            requireInteraction: true,
            actions: [
                {action: 'done', title: 'Done'},
            ],
        });
    });
};

const VIBRATE_SEQUENCE = [200, 100, 200, 100, 200, 100, 200];

async function createScheduledNotification(tag, timestamp, title, {body, data, silent, withVibration}) {
    if (! await checkNotificationPermissions()) {
        return alert('You need to grant notifications permission for this feature to work.');
    }

    const registration = await navigator.serviceWorker.getRegistration();
    registration.showNotification(title, {
        tag,
        body,
        data,
        silent,
        vibrate: silent ? undefined : VIBRATE_SEQUENCE,
        /* icon: '../images/touch/chrome-touch-icon-192x192.png', */
        requireInteraction: true,
        showTrigger: new TimestampTrigger(timestamp),
        actions: [
            {action: 'next', title: 'Start next step'},
            {action: 'snooze', title: '10 more min'},
        ],
    });
};

const clearNotification = async (tag) => {
    const notifications = await listNotifications(tag);
    notifications.forEach(notification => notification.close());
};

const listNotifications = async (tag) => {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.getNotifications({
        tag,
        includeTriggered: true,
    });
};
