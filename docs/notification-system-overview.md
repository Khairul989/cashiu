# Notification System Overview

This document explains how the notification system works in this project, covering both database and Firebase Cloud Messaging (FCM) notifications. It is intended for developers who need to understand, extend, or debug the notification flow.

---

## I. Notification Flow Overview

- **Trigger:** An event (e.g., cashback status update) triggers a notification.
- **Notification Class:** A notification class (e.g., `ConversionStatusNotification`) is instantiated, specifying the channels (database, firebase) and formatting the payload for each.
- **Dispatch:** The notification is dispatched to the user(s) via the specified channels.
- **Channels:**
  - **Database:** Notification is saved in the `notifications` table for persistence and user retrieval.
  - **Firebase:** Notification is sent to user devices via Firebase FCM using device tokens.
- **API:** Users can fetch, view, and mark notifications as read via API endpoints.

---

## II. Key Files and Their Roles

### i. `src/app/notifications/conversion_status_notification.ts`
- Defines a notification class for conversion status updates.
- Implements `toDatabase` (for DB) and `toFirebase` (for FCM) methods.
- Specifies which channels to use via the `via()` method.

### ii. `src/app/notifications/channels/firebase.ts`
- Implements the Firebase notification channel.
- Handles authentication with Google, builds the FCM payload, and sends notifications to each device token.
- Used by the notification system when the `firebase` channel is specified.

### iii. `src/app/models/notification.ts`
- Lucid ORM model for the `notifications` table.
- Handles storing, querying, and marking notifications as read.
- Provides helper methods and query scopes.

### iv. `src/app/controllers/notification_controller.ts`
- Exposes API endpoints for listing, viewing, and marking notifications as read.
- Fetches notifications from the database for the authenticated user.

### v. `src/config/notification.ts`
- Configures the notification system and registers available channels (`database`, `mail`, `firebase`).
- Extends type definitions for channel data payloads.

### vi. `src/database/migrations/1733286631683_create_notifications_table.ts`
- Migration for the `notifications` table schema.
- Defines fields for user, data, read status, and timestamps.

### vii. `src/app/validators/notification.ts`
- Validation schema for notification-related API requests (pagination, etc.).

### viii. `src/commands/send_firebase_notification.ts`
- CLI command to send FCM notifications to users (all or specific).
- Useful for admin/developer testing and manual notification sending.

### ix. `src/app/mails/withdrawal_status_notification.ts`
- Example of a mail notification (not FCM/database), showing extensibility to other channels.

---


## III. How to Add a New Notification

1. **Create a Notification Class:**
   - Implement the `NotificationContract` interface.
   - Define `toDatabase` and/or `toFirebase` methods.
   - Specify channels in `via()`.
2. **Dispatch the Notification:**
   - Use the notification system to send the notification to the user(s).
3. **(Optional) Add API Endpoints:**
   - If needed, add endpoints in the controller for new notification-related features.

---

## IV. Examples: When Notifications Are Sent, Payloads, and Channel Methods

### A. When Are Notifications Sent?

Notifications are typically sent when a business event occurs. For example, when a cashback conversion status changes, the system triggers a notification to the user. This is handled by instantiating a notification class and dispatching it to the user(s).

**Example scenario:**

- A user's cashback conversion is marked as `paid`, `pending`, or `rejected`.
- The backend creates a `ConversionStatusNotification` and sends it to the user via both database and Firebase channels.

### B. Notification Class: `ConversionStatusNotification`

This class defines how the notification is formatted for each channel.

```typescript
// src/app/notifications/conversion_status_notification.ts
export default class ConversionStatusNotification implements NotificationContract<User> {
  // ...existing code...
  public toDatabase(_notifiable: User): DatabaseChannelData {
    return {
      title: this.getTitle(),
      body: this.getBody()
    }
  }

  public toFirebase(_notifiable: User): FirebaseChannelData {
    const data: any = {
      type: 'conversion',
      conversionId: String(this.#conversion.conversionId),
      status: this.getStatus()
    }

    // Add amount for paid status
    if (this.getStatus() === 'paid') {
      data.amount = parseFloat(this.#conversion.cashbackPayout.toString()).toFixed(2)
    }

    return {
      title: this.getTitle(),
      body: this.getBody(),
      data,
      analyticLabel: 'conversion_notification',
      token: this.#deviceTokens,
    }
  }
}
```

### C. Example Payloads

### C. Notification Payload Types (Table)


| Channel   | Field           | Type     | Example Value / Description                                                                 | Required | Notes |
|-----------|-----------------|----------|--------------------------------------------------------------------------------------------|----------|-------|
| Database  | `title`         | string   | `"🎉 Yay! You've got cashback! "`                                                          | Yes      | Main notification title |
|           | `body`          | string   | `"RM12.34 cashback from Shopee has been credited into your account!"`                      | Yes      | Main notification body |
|           | `data.type`     | string   | `"conversion"`                                                                            | Optional | Type of notification (e.g., conversion, withdrawal, etc.) |
|           | `data.status`   | string   | `"paid"`, `"pending"`, `"rejected"`                                                      | Optional | Status of the event |
|           | `data.conversionId` | string | `"12345"`                                                                                 | Optional | Conversion ID (if applicable) |
|           | `data.amount`   | string   | `"12.34"`                                                                                  | Optional | Amount for paid status |
|           | `data` (other)  | any      | Any key-value pairs                                                                        | Optional | Custom data for other notification types |
| Firebase  | `title`         | string   | `"🎉 Yay! You've got cashback! "`                                                          | Yes      | Main notification title |
|           | `body`          | string   | `"RM12.34 cashback from Shopee has been credited into your account!"`                      | Yes      | Main notification body |
|           | `data.type`     | string   | `"conversion"`                                                                            | Optional | Type of notification |
|           | `data.status`   | string   | `"paid"`, `"pending"`, `"rejected"`                                                      | Optional | Status of the event |
|           | `data.conversionId` | string | `"12345"`                                                                                 | Optional | Conversion ID |
|           | `data.amount`   | string   | `"12.34"`                                                                                  | Optional | Amount for paid status |
|           | `data` (other)  | any      | Any key-value pairs                                                                        | Optional | Custom data for other notification types |
|           | `analyticLabel` | string   | `"conversion_notification"`, `"admin_notification"`                                      | Optional | Used for analytics in FCM |
|           | `token`         | string[] | `["fcm_token_1", "fcm_token_2"]`                                                          | Yes      | Device tokens to send to |

#### Other Example Payloads

**Withdrawal Status Notification (Mail channel, for reference):**

| Channel | Field         | Type   | Example Value / Description         | Required | Notes |
|---------|---------------|--------|-------------------------------------|----------|-------|
| Mail    | `withdrawal`  | object | Withdrawal model instance           | Yes      | Used in email template |
|         | `bankAccountLastFour` | string | `"1234"`                        | Yes      | Last 4 digits of account |
|         | `supportEmail`| string | `"support@example.com"`             | Yes      | Support contact |

---

#### Example: Database Channel Payload

```json
{
  "title": "🎉 Yay! You've got cashback! ",
  "body": "RM12.34 cashback from Shopee has been credited into your account!",
  "data": {
    "type": "conversion",
    "status": "paid",
    "conversionId": "12345",
    "amount": "12.34"
  }
}
```

#### Example: Firebase Channel Payload

```json
{
  "title": "🎉 Yay! You've got cashback! ",
  "body": "RM12.34 cashback from Shopee has been credited into your account!",
  "data": {
    "type": "conversion",
    "status": "paid",
    "conversionId": "12345",
    "amount": "12.34"
  },
  "analyticLabel": "conversion_notification",
  "token": ["fcm_token_1", "fcm_token_2"]
}
```

### D. Channel Methods Explained

#### 1. `toDatabase`

Returns the payload to be stored in the database. This is what users will see when they fetch their notifications via the API.

**Example:**

```typescript
public toDatabase(_notifiable: User): DatabaseChannelData {
  return {
    title: this.getTitle(),
    body: this.getBody()
  }
}
```

#### 2. `toFirebase`

Returns the payload to be sent to Firebase Cloud Messaging. Includes the notification title, body, additional data, analytics label, and device tokens.

**Example:**

```typescript
public toFirebase(_notifiable: User): FirebaseChannelData {
  const data: any = {
    type: 'conversion',
    conversionId: String(this.#conversion.conversionId),
    status: this.getStatus()
  }
  if (this.getStatus() === 'paid') {
    data.amount = parseFloat(this.#conversion.cashbackPayout.toString()).toFixed(2)
  }
  return {
    title: this.getTitle(),
    body: this.getBody(),
    data,
    analyticLabel: 'conversion_notification',
    token: this.#deviceTokens,
  }
}
```

#### 3. Firebase Channel Implementation

The `FirebaseChannel` class handles sending the notification to FCM:

```typescript
// src/app/notifications/channels/firebase.ts
export default class FirebaseChannel implements NotificationChannelContract {
  async send(data: FirebaseChannelData, _to: NotifiableModel) {
    // ...existing code...
    for (const deviceToken of data.token) {
      payload.token = deviceToken
      // Send to FCM
    }
    // ...existing code...
  }
}
```

---

---


## V. How to Send a Notification

- **Automatically:** Triggered by business logic (e.g., after a conversion is updated). For example:

  ```typescript
  // Pseudocode
  await user.notify(new ConversionStatusNotification(conversion, deviceTokens))
  ```

- **Manually:** Use the CLI command `notification:send-firebase` to send FCM notifications for testing or admin purposes.

  ```sh
  node ace notification:send-firebase --title "Test" --body "This is a test" --user-id 123
  ```

---


## VI. How Users Receive Notifications

- **Database:**
  - Users fetch notifications via API endpoints.
  - Notifications are stored and can be marked as read.
- **Firebase:**
  - Users receive push notifications on their devices if they have registered device tokens.

---


## VII. Extending the System

- **Add new channels** by implementing the `NotificationChannelContract` and registering in `config/notification.ts`.
- **Add new notification types** by creating new notification classes.
- **Customize payloads** by editing the `toDatabase` and `toFirebase` methods.

---


## VIII. Troubleshooting

- **No notifications sent?**
  - Check credentials in environment variables.
  - Ensure device tokens are present.
  - Check logs for errors (Sentry, Firebase Crashlytics).
- **API not returning notifications?**
  - Check the database for records.
  - Ensure the user is authenticated and has notifications.

---


## IX. References

- [AdonisJS Notifications Documentation](https://github.com/osenco/adonisjs-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

For further questions, check the code comments or contact the project maintainers.
