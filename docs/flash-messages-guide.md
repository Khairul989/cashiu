# Flash Messages Guide

This guide explains how to use the flash message system in the Cashiu application.

## Overview

The application uses a toast notification system to display flash messages to users. Flash messages are temporary messages that appear after a redirect and automatically disappear after a few seconds.

## How It Works

### Backend (AdonisJS)

Flash messages are set using the session flash method:

```typescript
// Set a success message
ctx.session.flash('success', 'Operation completed successfully!')

// Set an error message
ctx.session.flash('error', 'Something went wrong!')

// Set a warning message
ctx.session.flash('warning', 'Please check your input.')

// Set an info message
ctx.session.flash('info', 'Here is some information.')
```

### Frontend (Vue.js)

The flash messages are automatically shared with all pages through the Inertia.js shared data configuration and displayed as toast notifications using `vue3-toastify`.

## Flash Message Types

- **success**: Green toast for successful operations
- **error**: Red toast for errors and failures
- **warning**: Yellow/orange toast for warnings
- **info**: Blue toast for informational messages

## Toast Configuration

Toasts are configured with the following settings:
- Position: Top-right corner
- Theme: Colored (different colors for different message types)
- Auto-close: 5 seconds
- Animation: Smooth fade in/out

## Usage Examples

### In Controllers

```typescript
// After successful operation
await user.save()
ctx.session.flash('success', 'Profile updated successfully!')
return ctx.response.redirect().back()

// After error
ctx.session.flash('error', 'Failed to update profile. Please try again.')
return ctx.response.redirect().back()
```

### In Middleware

```typescript
// ACL middleware example
if (!hasPermission) {
  ctx.session.flash('error', 'No permission to view the page')
  return ctx.response.redirect().back()
}
```

## Components

### FlashMessageHandler

The `FlashMessageHandler` component is included in all pages and automatically:
1. Watches for flash messages in the page props
2. Displays them as toast notifications
3. Handles different message types with appropriate styling

### Adding to New Pages

To add flash message support to a new page, simply import and include the component:

```vue
<script setup lang="ts">
import FlashMessageHandler from '~/components/FlashMessageHandler.vue'
</script>

<template>
  <!-- Your page content -->
  
  <!-- Global flash message handler -->
  <FlashMessageHandler />
</template>
```

## Testing

Flash messages can be tested by:
1. Setting flash messages in controllers/middleware
2. Verifying they appear as toast notifications on the frontend
3. Checking that they automatically disappear after the configured timeout

## Troubleshooting

### Messages Not Appearing

1. Check that the `FlashMessageHandler` component is included in the page
2. Verify that flash messages are being set correctly in the backend
3. Ensure the Inertia.js shared data configuration includes flash messages

### Styling Issues

1. Verify that `vue3-toastify` CSS is properly imported
2. Check that the toast configuration is correct in `app.ts`
3. Ensure no CSS conflicts are overriding toast styles 