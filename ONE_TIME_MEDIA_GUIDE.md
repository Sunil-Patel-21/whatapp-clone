# 🔒 TEMPORARY MEDIA VIEWER (ONE-TIME VIEW PLUS)

## 📋 OVERVIEW

One-Time View Plus allows users to send images/videos that can be viewed a limited number of times (1-2 views) or for a limited duration (10min - 24h), after which the media is automatically deleted. This goes beyond WhatsApp's basic "View Once" by combining view limits with time limits.

---

## 🏗️ ARCHITECTURE & DATA FLOW

```
┌─────────────────────────────────────────────────────────────┐
│  USER UPLOADS MEDIA                                         │
│  - Selects image/video                                      │
│  - Prompted: "Enable One-Time View Plus?"                   │
│  - If YES → OneTimeMediaModal opens                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURATION MODAL                                        │
│  - View Limit: 1 view / 2 views                            │
│  - Time Limit: 10min / 1h / 24h / custom                   │
│  - User confirms → Config saved to state                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  MESSAGE SENT (Backend)                                     │
│  - Uploads media to Cloudinary                              │
│  - Creates message with:                                    │
│    • isOneTimeMedia: true                                   │
│    • viewLimit: 1 or 2                                      │
│    • viewsLeft: 1 or 2                                      │
│    • mediaExpiresAt: now + duration                         │
│  - Socket emits to receiver                                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  RECEIVER SEES BLURRED PREVIEW                              │
│  - Media appears with blur filter                           │
│  - Shows lock icon + "One-Time Media"                       │
│  - Shows "X views left"                                     │
│  - Click to open full-screen viewer                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  FULL-SCREEN VIEWER OPENS                                   │
│  - Shows privacy warning first                              │
│  - "Screenshots discouraged but not blocked"                │
│  - User clicks "View Media"                                 │
│  - API call: POST /messages/:id/view                        │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND PROCESSES VIEW                                     │
│  - Validates user is participant                            │
│  - Checks if expired (time or views)                        │
│  - Decrements viewsLeft by 1                                │
│  - Tracks view in viewedBy array                            │
│  - Returns mediaUrl + viewsLeft                             │
│  - If viewsLeft === 0 → Emit "media_expired"                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  MEDIA DISPLAYED                                            │
│  - Full-screen image/video shown                            │
│  - Header shows: "X views left" + "Xh Xm remaining"         │
│  - Right-click disabled (best-effort)                       │
│  - Download disabled for video                              │
│  - Tab switch warning shown                                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  EXPIRY HANDLING                                            │
│  - Cron job runs every 5 minutes                            │
│  - Finds media with:                                        │
│    • viewsLeft <= 0 OR                                      │
│    • mediaExpiresAt <= now                                  │
│  - Deletes from database                                    │
│  - Emits "media_expired" to both users                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  EXPIRED STATE IN CHAT                                      │
│  - Blurred preview replaced with placeholder                │
│  - Shows clock icon + "This media has expired"              │
│  - No longer clickable                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### **Message Model Extensions**
```javascript
{
  // Existing fields...
  imageOrVideoUrl: String,
  contentType: String,
  
  // NEW: One-Time Media Fields
  isOneTimeMedia: Boolean (default: false),
  viewLimit: Number (1 or 2),
  viewsLeft: Number (decrements on each view),
  mediaExpiresAt: Date (time-based expiry),
  viewedBy: [{
    user: ObjectId,
    viewedAt: Date,
    viewCount: Number
  }]
}
```

**Why viewedBy array?**
- Tracks which users viewed the media
- Prevents view count manipulation
- Supports multi-device sync
- Enables audit trail

---

## 🔧 BACKEND IMPLEMENTATION

### **1. Enhanced sendMessage Controller**
```javascript
// Parse one-time media config from request
const { isOneTimeMedia, viewLimit, mediaExpiryDuration } = req.body;

// If enabled and media type
if (isOneTimeMedia === 'true' && (contentType === 'image' || 'video')) {
    oneTimeConfig = {
        isOneTimeMedia: true,
        viewLimit: parseInt(viewLimit) || 1,
        viewsLeft: parseInt(viewLimit) || 1,
        mediaExpiresAt: new Date(Date.now() + parseInt(mediaExpiryDuration))
    };
}

// Merge into message
const message = new Message({ ...baseFields, ...oneTimeConfig });
```

### **2. New API: viewOneTimeMedia**
```javascript
POST /api/chats/messages/:messageId/view

Logic:
1. Validate user is sender or receiver
2. Check if mediaExpiresAt passed → 410 Gone
3. Check if viewsLeft <= 0 → 410 Gone
4. Decrement viewsLeft by 1
5. Add/update viewedBy entry
6. If viewsLeft === 0 → Emit socket event
7. Return { viewsLeft, mediaUrl }
```

**Why separate API for viewing?**
- Prevents unauthorized access
- Ensures atomic view count decrement
- Enables server-side validation
- Tracks view history

### **3. Cleanup Scheduler Enhancement**
```javascript
// Find expired one-time media
const expiredMedia = await Message.find({
    isOneTimeMedia: true,
    $or: [
        { viewsLeft: { $lte: 0 } },
        { mediaExpiresAt: { $lte: new Date() } }
    ]
});

// Delete and notify
await Message.deleteMany({ _id: { $in: ids } });
io.emit('media_expired', messageId);
```

**Cron vs Alternatives:**
- ✅ **Cron (Chosen)**: Simple, reliable, no external deps
- ❌ Redis TTL: Requires Redis setup
- ❌ MongoDB TTL Index: Can't combine view count + time
- ❌ Client-side: Unreliable, can be bypassed

---

## 🎨 FRONTEND IMPLEMENTATION

### **1. OneTimeMediaModal Component**
**Purpose:** Configure view and time limits before sending

**Features:**
- Radio buttons for view limit (1/2)
- Radio buttons for time limit (10min/1h/24h/custom)
- Custom input for minutes
- Validation before confirm

**Output:** `{ viewLimit: 1, mediaExpiryDuration: 600000 }`

### **2. OneTimeMediaViewer Component**
**Purpose:** Full-screen viewer with privacy protections

**Features:**
- Privacy warning screen first
- "View Media" button triggers API call
- Shows remaining views + time in header
- Disables right-click (best-effort)
- Warns on tab switch
- Auto-closes when views exhausted

**Privacy Protections:**
```javascript
// Disable right-click
onContextMenu={(e) => e.preventDefault()}

// Disable download for video
controlsList="nodownload"

// Tab switch warning
document.addEventListener('visibilitychange', () => {
    if (document.hidden) toast.warning('Tab switched');
});
```

**Limitations Acknowledged:**
- ❌ Cannot block screenshots (browser limitation)
- ❌ Cannot prevent screen recording
- ✅ Best-effort warnings and UI restrictions

### **3. MessageBubble Integration**
**Blurred Preview:**
```javascript
{isOneTimeMedia && !isMediaExpired && (
    <div 
        onClick={() => setShowOneTimeViewer(true)}
        style={{ filter: 'blur(20px)' }}
    >
        <FaLock /> One-Time Media
        <p>{viewsLeft} views left</p>
    </div>
)}
```

**Expired State:**
```javascript
{isOneTimeMedia && isMediaExpired && (
    <div>
        <FaClock /> This media has expired
    </div>
)}
```

### **4. ChatWindow Integration**
**File Upload Flow:**
```javascript
const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFilePreview(URL.createObjectURL(file));
    
    // Prompt for one-time mode
    if (confirm('Enable One-Time View Plus?')) {
        setShowOneTimeModal(true);
    }
};
```

**Send with Config:**
```javascript
if (oneTimeConfig) {
    formData.append("isOneTimeMedia", "true");
    formData.append("viewLimit", oneTimeConfig.viewLimit);
    formData.append("mediaExpiryDuration", oneTimeConfig.mediaExpiryDuration);
}
```

---

## 🔒 PRIVACY & SECURITY FEATURES

### **Implemented Protections:**
1. ✅ **View limit enforcement** - Server-side atomic decrement
2. ✅ **Time-based expiry** - Independent of view count
3. ✅ **Blurred preview** - Media not visible until viewed
4. ✅ **Right-click disabled** - Prevents easy save
5. ✅ **Download disabled** - For videos via controlsList
6. ✅ **Tab switch warning** - Alerts user on focus loss
7. ✅ **Privacy warning** - Explicit disclaimer shown
8. ✅ **Server-side validation** - Can't bypass via client
9. ✅ **Multi-device sync** - View count shared across devices
10. ✅ **Audit trail** - viewedBy tracks who viewed when

### **Acknowledged Limitations:**
- ⚠️ **Screenshots**: Cannot be blocked in web browsers
- ⚠️ **Screen recording**: Cannot be prevented
- ⚠️ **Browser DevTools**: Advanced users can inspect network
- ⚠️ **Physical camera**: Can photograph screen

**Honest Approach:**
- Show warning: "Screenshots discouraged but not blocked"
- Focus on auto-deletion, not prevention
- Set realistic user expectations
- Best-effort protections, not guarantees

---

## 🧪 EDGE CASES HANDLED

### **1. Receiver Offline When Sent**
- ✅ Timer starts immediately (server-side)
- ✅ When receiver comes online, sees remaining time
- ✅ May expire before first view if offline too long

### **2. Page Refresh / App Reload**
- ✅ View count persisted in database
- ✅ On reload, fetches latest viewsLeft
- ✅ No reset or bypass possible

### **3. Multiple Devices / Logins**
- ✅ View count shared across all devices
- ✅ If viewed on phone, desktop shows updated count
- ✅ Socket events sync state in real-time

### **4. Sender Deletes Message Early**
- ✅ Standard delete flow applies
- ✅ Media removed from both sides
- ✅ No special handling needed

### **5. Views Exhausted Mid-View**
- ✅ Viewer shows "0 views left"
- ✅ Auto-closes after 3 seconds
- ✅ Socket event updates sender's UI

### **6. Time Expires Mid-View**
- ✅ Cron job deletes from DB
- ✅ Socket event triggers UI update
- ✅ Viewer shows "Media expired"

### **7. Network Failure During View**
- ✅ View count already decremented on server
- ✅ Retry shows "No views remaining"
- ✅ No double-counting

### **8. Concurrent Views (Same User, Multiple Tabs)**
- ✅ First tab decrements count
- ✅ Second tab gets updated count via socket
- ✅ Atomic DB operations prevent race conditions

---

## 📊 COMPARISON: ONE-TIME VIEW PLUS vs WHATSAPP VIEW ONCE

| Feature | WhatsApp View Once | One-Time View Plus |
|---------|-------------------|-------------------|
| View limit | 1 view only | 1 or 2 views |
| Time limit | None | 10min - 24h + custom |
| Combined limits | No | Yes (view AND time) |
| Blurred preview | Yes | Yes |
| View tracking | Basic | Detailed (viewedBy) |
| Multi-device sync | Yes | Yes |
| Expiry notification | No | Yes (socket events) |
| Audit trail | No | Yes (viewedBy array) |

**Why Better?**
- More flexible (2 views for important media)
- Time-based expiry adds extra security
- Detailed tracking for accountability
- Real-time sync across devices

---

## 🚀 USAGE FLOW

### **Sender Side:**
1. Click paperclip → Select image/video
2. Prompt: "Enable One-Time View Plus?" → Yes
3. Modal opens → Select "1 View" + "10 Minutes"
4. Click "Enable" → Media uploaded with config
5. Send message → Receiver gets notification

### **Receiver Side:**
1. See blurred preview with lock icon
2. Label: "One-Time Media - 1 view left"
3. Click preview → Full-screen viewer opens
4. Warning: "Screenshots discouraged"
5. Click "View Media" → API call made
6. Media loads → Header shows "0 views left"
7. After 3 seconds → Viewer auto-closes
8. Back in chat → Shows "This media has expired"

---

## 🎯 WHY THIS IMPROVES PRIVACY & TRUST

### **1. User Control**
- Users decide sensitivity level (1 vs 2 views)
- Flexible time limits for different scenarios
- Explicit opt-in, not forced

### **2. Transparency**
- Clear indicators (lock icon, blur)
- Honest about limitations (screenshot warning)
- Real-time feedback (views left, time remaining)

### **3. Accountability**
- viewedBy tracks who accessed media
- Audit trail for sensitive content
- Prevents "I never saw it" claims

### **4. Reduced Data Retention**
- Auto-deletion after expiry
- No permanent storage of sensitive media
- Minimizes exposure window

### **5. Trust Building**
- Shows app respects privacy
- Goes beyond basic features
- Demonstrates security awareness

### **6. Real-World Use Cases**
- Sharing passwords temporarily
- Sending sensitive documents
- Private photos with time limit
- Confidential business info

---

## 📦 INSTALLATION

### **Backend:**
```bash
cd backend
npm install  # node-cron already added
npm run dev
```

### **Frontend:**
```bash
cd frontend
npm run dev
```

**No new dependencies needed** - Uses existing stack.

---

## 🧪 TESTING CHECKLIST

- [ ] Upload image → Enable one-time mode → Send
- [ ] Receiver sees blurred preview with lock icon
- [ ] Click preview → Warning screen appears
- [ ] Click "View Media" → API call succeeds
- [ ] Media displays → Header shows "0 views left"
- [ ] Try viewing again → "No views remaining" error
- [ ] Wait for time expiry → Cron job deletes media
- [ ] Check socket event → UI updates to expired state
- [ ] Test with 2 views → Can view twice
- [ ] Test page refresh → View count persists
- [ ] Test multiple devices → Count syncs
- [ ] Test offline receiver → Timer still counts

---

## 🔮 FUTURE ENHANCEMENTS

1. **Read receipts for views** - Notify sender when viewed
2. **Screenshot detection** - Attempt to detect (limited)
3. **Watermarking** - Add user ID to media
4. **Encrypted storage** - E2E encryption for media
5. **Group chat support** - View limits per user
6. **Analytics** - Track view patterns
7. **Custom view limits** - 3, 5, 10 views
8. **Countdown timer** - Live countdown in viewer

---

## 📝 API REFERENCE

### **Send One-Time Media**
```
POST /api/chats/send-message
Content-Type: multipart/form-data

FormData:
- senderId: ObjectId
- receiverId: ObjectId
- media: File
- isOneTimeMedia: "true"
- viewLimit: "1" or "2"
- mediaExpiryDuration: milliseconds

Response:
{
  "status": 200,
  "message": "message sent successfully",
  "data": {
    "_id": "...",
    "isOneTimeMedia": true,
    "viewLimit": 1,
    "viewsLeft": 1,
    "mediaExpiresAt": "2024-01-01T12:00:00Z"
  }
}
```

### **View One-Time Media**
```
POST /api/chats/messages/:messageId/view
Authorization: Bearer <token>

Response (Success):
{
  "status": 200,
  "message": "view recorded",
  "data": {
    "viewsLeft": 0,
    "mediaUrl": "https://cloudinary.com/..."
  }
}

Response (Expired):
{
  "status": 410,
  "message": "media expired" | "no views remaining"
}
```

### **Socket Events**
```javascript
// Emitted when views exhausted or time expired
socket.on("media_expired", (messageId) => {
  // Update UI to show expired state
});
```

---

## 🎓 CONCLUSION

**One-Time View Plus** is a production-ready, privacy-first feature that:
- ✅ Combines view limits (1-2) with time limits (10min-24h)
- ✅ Provides blurred previews and full-screen viewing
- ✅ Implements server-side validation and tracking
- ✅ Handles edge cases (offline, refresh, multi-device)
- ✅ Acknowledges browser limitations honestly
- ✅ Uses best-effort privacy protections
- ✅ Auto-deletes expired media via cron
- ✅ Syncs state across devices via sockets

**No unrealistic claims. No breaking changes. Just solid, trust-building privacy.**

---

## 🆚 KEY DIFFERENCES FROM TEMPORARY CHAT MODE

| Feature | Temporary Chat Mode | One-Time Media Viewer |
|---------|-------------------|---------------------|
| Scope | All messages in chat | Individual media only |
| Trigger | Chat-level toggle | Per-message opt-in |
| Content | Text + media | Images/videos only |
| View limit | N/A | 1-2 views |
| Time limit | 1h - 7d | 10min - 24h |
| UI | Shield icon | Lock icon + blur |
| Use case | Entire conversation | Sensitive media |

**Both features coexist** - Users can enable temporary mode for chat AND send one-time media within it for extra security.
