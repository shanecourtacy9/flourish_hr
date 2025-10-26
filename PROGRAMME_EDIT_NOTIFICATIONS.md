# Programme Edit Notifications Feature

## Overview
This feature allows users to edit programme details and automatically sends push notifications to registered users when changes are made, particularly when the programme date changes.

## Features Implemented

### Frontend (Angular)
1. **Notification Service** (`src/app/services/notification.service.ts`)
   - `sendProgrammeDateChangeNotification()` - Sends notifications when programme dates change
   - `sendProgrammeDetailsChangeNotification()` - Sends notifications when other details change

2. **Enhanced Programme Detail Component** (`src/app/pages/dashboard/programmes/programme-detail/programme-detail.component.ts`)
   - Tracks original programme dates for comparison
   - Detects date changes using `date-fns` library
   - Automatically sends appropriate notifications based on change type
   - Provides user feedback via snackbar messages
   - Shows loading states during updates

3. **UI Improvements**
   - Added loading spinners to update buttons
   - Enhanced user feedback with specific notification messages

### Backend (Node.js/Express)
1. **New API Endpoints** (`/api/scheduledProgrammes/:id/`)
   - `POST /notifyDateChange` - Handles date change notifications
   - `POST /notifyDetailsChange` - Handles other detail change notifications

2. **Enhanced Controller** (`api/controllers/scheduledProgrammeController.js`)
   - `notifyDateChange()` - Sends push notifications for date changes
   - `notifyDetailsChange()` - Sends push notifications for other changes
   - Integrates with existing OneSignal notification system

3. **Updated Routes** (`api/routes/scheduledProgrammeRoute.js`)
   - Added new notification endpoints with JWT authentication

## How It Works

### Date Change Detection
1. When editing a programme, the original start and end dates are stored
2. When the form is submitted, the system compares new dates with original dates
3. If dates have changed, a specific date change notification is sent
4. If only other details changed, a general details change notification is sent

### Notification Content
- **Date Changes**: "The programme '[Name]' date has been changed from [Old Date] to [New Date]. Please check the updated details."
- **Other Changes**: "The programme '[Name]' has been updated: [List of changes]. Please check the updated details."

### User Experience
1. User edits programme details in the existing form
2. System automatically detects what changed
3. Programme is updated in the database
4. Appropriate notifications are sent to all registered users
5. User receives feedback about the update and notification status

## Technical Details

### Dependencies
- `date-fns` - For date comparison and formatting
- `@onesignal/node-onesignal` - For push notifications (backend)
- Angular Material - For UI components and feedback

### Error Handling
- Graceful handling of notification failures
- User feedback for both successful updates and notification errors
- Console logging for debugging

### Security
- All notification endpoints require JWT authentication
- Only authorized users can send notifications
- Notifications are sent only to users registered for the specific programme

## Usage

1. Navigate to any programme detail page
2. Make changes to programme details (especially date/time)
3. Click "Update"
4. System will automatically:
   - Update the programme
   - Send notifications to registered users
   - Show confirmation messages

## Future Enhancements
- Email notifications in addition to push notifications
- Notification preferences for users
- Batch notification sending for multiple programme updates
- Notification history and tracking
