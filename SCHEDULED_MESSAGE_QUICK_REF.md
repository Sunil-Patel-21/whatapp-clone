# ⚡ SCHEDULED MESSAGES - QUICK REFERENCE

## 🎯 WHAT WAS IMPLEMENTED

A complete scheduled message delivery system that:
- ✅ Allows users to schedule messages for future delivery
- ✅ Delivers messages automatically even if sender is offline
- ✅ Supports text, images, and videos
- ✅ Works with E2E encryption (server never sees plaintext)
- ✅ Handles all edge cases (user deletion, conversation deletion, etc.)
- ✅ Includes retry logic (3 attempts with 1-minute delay)
- ✅ Provides edit and cancel functionality
- ✅ Real-time status updates via Socket.IO

---

## 📁 FILES MODIFIED/CREATED

### Backend (4 new files + 1 modified):
```
✨ models/scheduledMessage.model.js          [NEW]
✨ controllers/scheduledMessage.controller.js [NEW]
✨ services/scheduledMessageService.js        [NEW]
✨ routes/scheduledMessage.route.js           [NEW]
📝 index.js                                   [MODIFIED]
```

### Frontend (2 new files + 3 modified):
```
✨ components/ScheduleMessageModal.jsx        [NEW]
✨ components/ScheduledMessagesList.jsx       [NEW]
📝 store/chatStore.js                         [MODIFIED]
📝 services/chat.service.js                   [MODIFIED]
📝 pages/chatSection/ChatWindow.jsx           [MODIFIED]
```

---

## 🔌 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scheduled-messages` | Create scheduled message |
| PUT | `/api/scheduled-messages/:id` | Update scheduled message |
| DELETE | `/api/scheduled-messages/:id` | Cancel scheduled message |
| GET | `/api/scheduled-messages?conversationId=xxx` | List scheduled messages |

---

## 🎨 UI INTEGRATION

### Where to Find:
1. **Schedule Button:** Clock icon (⏰) in message input area (next to emoji picker)
2. **Scheduled List:** Chat menu (3-dot icon) → "Scheduled Messages"

### User Actions:
- **Schedule:** Type message → Click clock icon → Select date/time → Schedule
- **View:** Chat menu → Scheduled Messages
- **Edit:** Scheduled Messages list → Edit icon → Update → Save
- **Cancel:** Scheduled Messages list → X icon → Confirm

---

## ⚙️ BACKGROUND WORKER

### Configuration:
```javascript
// Runs every 1 minute
cron.schedule('* * * * *', processScheduledMessages);

// Retry settings
MAX_RETRIES = 3
RETRY_DELAY = 60000ms (1 minute)
```

### What It Does:
1. Queries pending messages where `scheduledTime <= now`
2. Validates conversation, sender, receiver still exist
3. Creates actual Message document
4. Updates Conversation (lastMessage, unreadCount)
5. Emits Socket.IO events to receiver and sender
6. Marks scheduled message as 'sent'
7. Retries on failure (max 3 times)

---

## 🔄 SOCKET EVENTS

### Emitted by Server:
```javascript
'scheduled_message_created'  // When user schedules a message
'scheduled_message_updated'  // When user edits scheduled message
'scheduled_message_cancelled' // When user cancels scheduled message
'scheduled_message_sent'     // When worker delivers the message
'scheduled_message_failed'   // When delivery fails after retries
```

### Frontend Listeners:
All events are handled in `chatStore.js` → `initializeSocketListeners()`

---

## 🗄️ DATABASE SCHEMA

### ScheduledMessage Collection:
```javascript
{
  conversation: ObjectId,      // Ref: Conversation
  sender: ObjectId,            // Ref: User
  receiver: ObjectId,          // Ref: User
  content: String,             // Encrypted content
  imageOrVideoUrl: String,     // Media URL
  contentType: Enum,           // 'text' | 'image' | 'video'
  scheduledTime: Date,         // When to send (indexed)
  status: Enum,                // 'pending' | 'sent' | 'failed' | 'cancelled'
  isOneTimeMedia: Boolean,
  viewLimit: Number,
  mediaExpiryDuration: Number,
  failureReason: String,
  sentAt: Date,
  retryCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
- `{ scheduledTime: 1, status: 1 }` (compound index)

---

## 🛡️ EDGE CASES HANDLED

| Scenario | Handling |
|----------|----------|
| Sender deletes chat | Mark as 'failed' - "Conversation deleted" |
| Receiver blocks sender | Mark as 'failed' - "Sender left conversation" |
| User account deleted | Mark as 'failed' - "Account deleted" |
| Server restart | Worker resumes on startup, processes pending |
| Clock drift | All times stored/compared in UTC |
| Duplicate sends | Status check prevents reprocessing |
| Network failure | Retry logic (3 attempts) |

---

## 🔐 SECURITY

### E2E Encryption:
- ✅ Content stored encrypted in database
- ✅ Server never decrypts message content
- ✅ Decryption happens only on receiver device
- ✅ Compatible with existing encryption setup

### Authorization:
- ✅ JWT authentication required for all endpoints
- ✅ Users can only edit/cancel their own scheduled messages
- ✅ Sender validation before delivery

---

## 🧪 TESTING

### Quick Test (1 minute delivery):
1. Open chat with any contact
2. Type a message
3. Click clock icon (⏰)
4. Select today's date
5. Select time = current time + 1 minute
6. Click "Schedule"
7. Wait 1 minute
8. Message should appear in chat automatically

### Test Edit:
1. Chat menu → Scheduled Messages
2. Click edit icon on any pending message
3. Change content or time
4. Click "Save"

### Test Cancel:
1. Chat menu → Scheduled Messages
2. Click X icon on any pending message
3. Confirm cancellation

---

## 📊 STATUS LIFECYCLE

```
User schedules → pending
                    ↓
Worker processes → sent (success)
                    ↓
                 failed (after 3 retries)
                    ↓
User cancels → cancelled
```

---

## 🚀 DEPLOYMENT

### Backend:
```bash
cd backend
npm install  # node-cron already in package.json
npm run dev
```

### Frontend:
```bash
cd frontend
npm install  # date-fns already in package.json
npm run dev
```

### Verify:
- Check console for: `📅 Scheduled message delivery service initialized`
- Schedule a test message
- Monitor logs for delivery confirmation

---

## 🔧 CUSTOMIZATION

### Change Cron Frequency:
```javascript
// In services/scheduledMessageService.js
cron.schedule('*/5 * * * *', ...); // Every 5 minutes
cron.schedule('*/30 * * * *', ...); // Every 30 minutes
```

### Change Retry Settings:
```javascript
// In services/scheduledMessageService.js
const MAX_RETRIES = 5;           // Increase retries
const RETRY_DELAY = 120000;      // 2 minutes delay
```

---

## 📈 PERFORMANCE

### Database Queries:
- Indexed query on `scheduledTime + status`
- Only queries messages with `scheduledTime <= now`
- Efficient batch processing

### Memory:
- Stateless worker (no in-memory cache)
- Processes messages on-demand
- Minimal memory footprint

### Scalability:
- Current: Single server (sufficient for most apps)
- Future: Add distributed locks (Redis) for multi-server

---

## 🐛 TROUBLESHOOTING

### Message Not Delivered:
1. Check server logs for worker activity
2. Verify cron service is running
3. Check scheduled message status in MongoDB
4. Ensure scheduledTime is in the past

### Socket Events Not Received:
1. Verify Socket.IO connection
2. Check browser console for socket errors
3. Ensure user is authenticated
4. Check socketUserMap has user's socket ID

### Edit/Cancel Not Working:
1. Verify JWT token is valid
2. Check user is the sender of the message
3. Ensure message status is 'pending'
4. Check API response in network tab

---

## 📞 LOGS TO MONITOR

### Success:
```
📅 Scheduled message delivery service initialized
✅ Scheduled message 507f1f77bcf86cd799439011 delivered successfully
```

### Retry:
```
🔄 Retry 1/3 scheduled for message 507f1f77bcf86cd799439011
```

### Failure:
```
❌ Error delivering scheduled message 507f1f77bcf86cd799439011: Conversation deleted
```

---

## 🎯 KEY FEATURES

✅ **Automatic Delivery** - Messages sent at exact scheduled time  
✅ **Offline Support** - Works even if sender is offline  
✅ **Edit & Cancel** - Full control before delivery  
✅ **Retry Logic** - 3 automatic retry attempts  
✅ **Real-time Updates** - Socket.IO for instant feedback  
✅ **E2E Encryption** - Server never sees plaintext  
✅ **Edge Case Handling** - Robust error handling  
✅ **Clean UI** - Seamless integration with existing chat  

---

## 🎉 DONE!

Your scheduled message delivery feature is **production-ready** and fully integrated with your existing WhatsApp clone architecture.

**No third-party services required. No code rewrites. Clean, maintainable, and scalable.**

---

## 📚 FULL DOCUMENTATION

See `SCHEDULED_MESSAGE_GUIDE.md` for complete implementation details.
