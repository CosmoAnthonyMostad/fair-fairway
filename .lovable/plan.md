
# Fix: Terms of Service Navigation for Native iOS

## Problem
The "Terms of Service" button in Settings uses `window.open('/terms', '_blank')` which doesn't work in a native iOS app because the app runs in a WKWebView that doesn't support opening new browser tabs.

## Solution
Change the navigation method to use React Router's `useNavigate()` hook for in-app navigation instead of trying to open a new browser window.

## Changes Required

### File: `src/pages/Settings.tsx`

1. **Add useNavigate import** from react-router-dom
2. **Initialize the navigate function** in the Settings component
3. **Update the Terms of Service onClick** to use `navigate('/terms')` instead of `window.open()`

## Technical Details

```text
Before:
  onClick={() => window.open('/terms', '_blank')}

After:
  onClick={() => navigate('/terms')}
```

This matches how the Terms page already handles its "Back" button navigation using `navigate(-1)`, maintaining consistency throughout the app.

## Expected Behavior After Fix
- Tapping "Terms of Service" navigates to the Terms page within the app
- The Terms page displays with its existing "Back" button
- Tapping "Back" returns to Settings
- Works correctly on both iPad and iPhone simulators/devices

## App Store Impact
This is a simple navigation fix that won't affect your pending review, but you'll want to include it in your next build update to ensure all features work properly for users.
