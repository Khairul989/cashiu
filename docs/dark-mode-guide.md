# Dark Mode Guide for Admin Users

## Overview

The admin interface now supports a dark mode theme that can be toggled on/off by admin users. This feature provides a more comfortable viewing experience in low-light environments and follows modern UI/UX practices.

## Features

- **Theme Toggle Button**: Located in the top navigation bar next to the user profile dropdown
- **Automatic Persistence**: Theme preference is saved to both localStorage and the user's database profile
- **System Preference Detection**: Automatically detects and applies the user's system dark mode preference on first visit
- **Smooth Transitions**: All theme changes include smooth transitions for a polished user experience
- **Responsive Design**: Dark mode works across all screen sizes and devices

## How to Use

### Toggle Dark Mode

1. **Desktop**: Look for the theme toggle button (sun/moon icon) in the top-right corner of the admin interface
2. **Mobile**: The theme toggle button is also available in the mobile navigation
3. **Click the button** to switch between light and dark themes

### Theme Icons

- **Sun Icon** (☀️): Click to switch to light mode
- **Moon Icon** (🌙): Click to switch to dark mode

## Theme Persistence

- **Local Storage**: Theme preference is immediately saved to your browser's localStorage
- **Browser-Specific**: Theme preference is stored per browser and device
- **No Database Storage**: Theme preferences are not stored in the database for security and simplicity

## System Integration

- **First Visit**: If you haven't set a theme preference, the system will automatically detect your operating system's dark mode setting
- **System Changes**: If you change your system theme while using the admin interface, it will automatically update (unless you've manually set a preference)

## Dark Mode Styling

The dark mode theme includes:

- **Background Colors**: Dark backgrounds for main content areas
- **Text Colors**: 
  - Light text (gray-100) on dark backgrounds for optimal contrast
  - Dark text (gray-900) on light backgrounds (like table headers) for readability
- **Border Colors**: Adjusted border colors for better visibility
- **Interactive Elements**: Hover states and focus indicators optimized for dark mode
- **Custom Scrollbars**: Dark-themed scrollbars for a cohesive experience
- **Form Components**: Multiselect dropdowns with proper dark mode styling

## Technical Implementation

### Components Updated

- `AdminLayout.vue` - Main admin layout with dark mode classes
- `ThemeToggle.vue` - Theme toggle button component
- `useDarkMode.ts` - Dark mode state management composable
- Admin pages (withdrawals, conversions, etc.) - Dark mode styling

### CSS Classes Used

- `dark:` prefix for dark mode variants
- Tailwind CSS dark mode utilities
- Minimal custom CSS for basic dark mode setup
- Component-level dark mode styling using Tailwind classes

### Storage Method

- **Local Storage**: Theme preference is stored in the browser's localStorage
- **No Database Changes**: No database modifications are required
- **Valid Values**: `'light'` or `'dark'`

## Browser Support

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **Local Storage**: Required for theme persistence
- **CSS Custom Properties**: Used for dynamic theme switching

## Troubleshooting

### Theme Not Saving

- Verify your browser supports localStorage
- Check browser console for any JavaScript errors
- Ensure cookies are enabled for the site

### Theme Not Applying

- Refresh the page to ensure all styles are loaded
- Check if dark mode CSS classes are being applied to the `<html>` element
- Verify Tailwind CSS is properly configured with `darkMode: 'class'`

### Performance Issues

- Theme switching is optimized with CSS transitions
- No JavaScript performance impact during normal usage
- Minimal CSS overhead for dark mode variants

## Future Enhancements

Potential improvements for future versions:

- **Custom Color Schemes**: Allow users to choose from multiple dark theme variants
- **Auto-Schedule**: Automatically switch themes based on time of day
- **High Contrast Mode**: Additional accessibility options
- **Theme Export/Import**: Share theme preferences across accounts

## Support

If you encounter any issues with the dark mode feature:

1. Check this documentation first
2. Try refreshing the page
3. Clear browser localStorage and try again
4. Contact the development team with specific error details
