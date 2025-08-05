// index.ts
import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import App from './App';

import notifee, {EventType} from '@notifee/react-native';
import {PERMISSIONS, request} from 'react-native-permissions';
// 🛡️ Show notification alert in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 📱 Set notification channel for Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: 1, // 1 = public visibility on lock screen
  });
}

// ✅ Save notification locally
const saveNotification = async (notification: any) => {
  try {
    const existing = JSON.parse(await AsyncStorage.getItem('notifications') || '[]');

    const now = new Date().toISOString();
    const newNotification = {
      id: Date.now(),
      title: notification.title,
      message: notification.message,
      read: false,
      date: now,
      receivedAt: now,
    };

    const updated = [...existing, newNotification];
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    console.log('[index.ts] Notification saved:', newNotification);
    const afterSave = await AsyncStorage.getItem('notifications');
    console.log('[index.ts] Notifications in storage:', afterSave);
  } catch (error) {
    console.error('Error saving notification:', error);
  }
};

// 📥 Handle background messages (when app is in background or killed)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📥 Background message:', remoteMessage);
  const { title, body } = remoteMessage.notification || {};
  await saveNotification({ title, message: body });
});

// 📥 Handle foreground messages (when app is open)
messaging().onMessage(async remoteMessage => {
  console.log('📥 Foreground message:', remoteMessage);
  const { title, body } = remoteMessage.notification || {};
  await saveNotification({ title, message: body });
});

// 📥 Save notification when Notifee delivers it (foreground)
notifee.onForegroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    const { title, body } = detail.notification || {};
    await saveNotification({ title, message: body });
  }
});
messaging().onMessage(async remoteMessage => {
  console.log('📥 Foreground message:', remoteMessage);
  const { title, body } = remoteMessage.notification || {};

  await saveNotification({ title, message: body });

  // 🎉 Show system notification on home/lock screen
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Notification',
      body: body || '',
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
});

//method was called to get FCM tiken for notification
export const getFcmToken = async () => {
  let token = null;
  await checkApplicationNotificationPermission();
  await registerAppWithFCM();
  try {
    token = await messaging().getToken();
    console.log('getFcmToken-->', token);
  } catch (error) {
    console.log('getFcmToken Device Token error ', error);
  }
  return token;
};

//method was called on  user register with firebase FCM for notification
export async function registerAppWithFCM() {
  console.log(
    'registerAppWithFCM status',
    messaging().isDeviceRegisteredForRemoteMessages,
  );
  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging()
      .registerDeviceForRemoteMessages()
      .then(status => {
        console.log('registerDeviceForRemoteMessages status', status);
      })
      .catch(error => {
        console.log('registerDeviceForRemoteMessages error ', error);
      });
  }
}

//method was called on un register the user from firebase for stoping receiving notifications
export async function unRegisterAppWithFCM() {
  console.log(
    'unRegisterAppWithFCM status',
    messaging().isDeviceRegisteredForRemoteMessages,
  );

  if (messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging()
      .unregisterDeviceForRemoteMessages()
      .then(status => {
        console.log('unregisterDeviceForRemoteMessages status', status);
      })
      .catch(error => {
        console.log('unregisterDeviceForRemoteMessages error ', error);
      });
  }
  await messaging().deleteToken();
  console.log(
    'unRegisterAppWithFCM status',
    messaging().isDeviceRegisteredForRemoteMessages,
  );
}

export const checkApplicationNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
  request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS)
    .then(result => {
      console.log('POST_NOTIFICATIONS status:', result);
    })
    .catch(error => {
      console.log('POST_NOTIFICATIONS error ', error);
    });
};

//method was called to listener events from firebase for notification triger
export function registerListenerWithFCM() {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('onMessage Received : ', JSON.stringify(remoteMessage));
    if (
      remoteMessage?.notification?.title &&
      remoteMessage?.notification?.body
    ) {
      onDisplayNotification(
        remoteMessage.notification?.title,
        remoteMessage.notification?.body,
        remoteMessage?.data,
      );
    }
  });
  notifee.onForegroundEvent(({type, detail}) => {
    switch (type) {
      case EventType.DISMISSED:
        console.log('User dismissed notification', detail.notification);
        break;
      case EventType.PRESS:
        console.log('User pressed notification', detail.notification);
        if (detail?.notification?.data?.clickAction) {
          onNotificationClickActionHandling(
            detail.notification.data.clickAction
          );
        }
        break;
    }
  });

  messaging().onNotificationOpenedApp(async remoteMessage => {
    console.log(
      'onNotificationOpenedApp Received',
      JSON.stringify(remoteMessage),
    );
    // if (remoteMessage?.data?.clickAction) {
    //   onNotificationClickActionHandling(remoteMessage.data.clickAction);
    // }
  });
  // Check whether an initial notification is available
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    });

  return unsubscribe;
}

//method was called to display notification
async function onDisplayNotification(title, body, data) {
  console.log('onDisplayNotification Adnan: ', JSON.stringify(data));

  // Request permissions (required for iOS)
  await notifee.requestPermission();
  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  // Display a notification
  await notifee.displayNotification({
    title: title,
    body: body,
    data: data,
    android: {
      channelId,
      // pressAction is needed if you want the notification to open the app when pressed
      pressAction: {
        id: 'default',
      },
    },
  });
}
// 📦 Launch app
registerRootComponent(App);
