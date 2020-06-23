
export const createScheduledNotification = async (tag, title, timestamp) => {
    let {state} = await navigator.permissions.query({name: 'notifications'});
    if (state === 'prompt') {
        await Notification.requestPermission();
    } 
    state = (await navigator.permissions.query({name: 'notifications'})).state;
    if (state !== 'granted') {
        return alert('You need to grant notifications permission for this demo to work.');
    }

    const registration = await navigator.serviceWorker.getRegistration();
    registration.showNotification(title, {
        tag,
        /* icon: '../images/touch/chrome-touch-icon-192x192.png', */
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        requireInteraction: true,
        showTrigger: new TimestampTrigger(timestamp),
        /* data: {}, */
        actions: [
            // {action: 'view', title: 'View'},
            {action: 'done', title: 'Done'},
            {action: 'snooze', title: '10 more min'},
        ],
    });
};

export const clearScheduledNotification = async (tag) => {
    const notifications = await listScheduledNotifications(tag);
    notifications.forEach(notification => notification.close());
};

export const listScheduledNotifications = async (tag) => {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.getNotifications({
        tag,
        includeTriggered: true,
    });
};
