# FCM
> Http Implementation of the FireCloudMessaging api

## index.js
> FCM wrapper used to send push notifications with service data to topic subscribed devices

#### Usage
```js
import { sendMessage } from 'lib/fcm'

const params = {
  name: 'Name',                         // String: Display name of service
  org: 'organization',                  // String: Organization id from config.json
  id: 'service-id',                     // String: Service id from org.services config.json
  status: true,                         // Boolean: Current Status of service
  unstable: false,                      // Boolean: Current stability of service,
  image: 'https://host.com/service-id', // String: Image url (https) displayed in app
  isRealm: false,                       // Boolean: Is service a Realm or other
  largeIcon: 'service-id-icon'          // String: Image url (https) or android res image
}

sendMessage(params) // sends push notification to devices subscribed to /topics/{id}
```
## push.js
> Stand alone command line tool designed to test and send push notifications

#### Usage
**-s** -server - *{String}*

**-c** -status - *{Boolean}*

**-u** -unstable - *{Boolean}*

**-r** -org - *{String}*


```sh
npm run push -- -s service-id
$ { message_id: 5934851191378177000 }
```
