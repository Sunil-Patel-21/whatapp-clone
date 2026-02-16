# ⚡ QUICK INSTALLATION GUIDE

## 🚀 SETUP (5 Minutes)

### **Step 1: Install Dependencies**

```bash
# Backend
cd backend
npm install node-cron
```

**That's it!** No other dependencies needed.

### **Step 2: Start Servers**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### **Step 3: Verify Installation**

**Check Backend Console:**
```
✅ Message cleanup scheduler initialized
🗑️ Cleaned up X expired messages/media
```

**Check Frontend:**
1. Login to app
2. Open any chat
3. Click 3-dot menu → See "Temporary Mode" option
4. Upload image → See "Enable One-Time View Plus?" prompt

---

## ✅ VERIFICATION CHECKLIST

### **Backend**
- [ ] `node-cron` installed: `npm list node-cron`
- [ ] Server running on port 3000 (or your port)
- [ ] Console shows: "Message cleanup scheduler initialized"
- [ ] MongoDB connected
- [ ] Socket.io initialized

### **Frontend**
- [ ] App running on port 5173 (or your port)
- [ ] Can login successfully
- [ ] Chat window loads
- [ ] 3-dot menu shows new options

### **Features**
- [ ] Temporary Chat Mode toggle visible
- [ ] One-Time Media prompt on image upload
- [ ] Shield icons appear on temporary messages
- [ ] Lock icons appear on one-time media
- [ ] Blurred previews work
- [ ] Full-screen viewer opens

---

## 🧪 QUICK TEST

### **Test Temporary Chat Mode:**
```bash
1. Open chat
2. Click 3-dot menu → "Temporary Mode"
3. Select "1 Hour" → Enable
4. Send message "Test"
5. See 🛡️ shield icon
6. Check menu → "✓ Temporary Mode ON"
✅ Working!
```

### **Test One-Time Media:**
```bash
1. Open chat
2. Click paperclip → Select image
3. Prompt: "Enable One-Time View Plus?" → Yes
4. Select "1 View" + "10 Minutes" → Enable
5. Send image
6. Receiver sees blurred preview with 🔒
7. Click preview → Full-screen viewer
8. Click "View Media" → Image loads
9. Try viewing again → "No views remaining"
✅ Working!
```

---

## 🔧 TROUBLESHOOTING

### **Problem: "node-cron not found"**
```bash
cd backend
npm install node-cron
npm run dev
```

### **Problem: Cron job not running**
**Check backend console for:**
```
✅ Message cleanup scheduler initialized
```

**If missing:**
1. Verify `messageCleanupService.js` exists
2. Check `index.js` imports it
3. Restart backend server

### **Problem: Temporary Mode option not showing**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify backend is running

### **Problem: One-Time Media prompt not appearing**
1. Ensure you're uploading image/video (not document)
2. Check browser allows popups
3. Verify `OneTimeMediaModal.jsx` exists
4. Check console for errors

### **Problem: Socket events not working**
1. Check backend console: "socket connected"
2. Verify frontend connects to correct backend URL
3. Check CORS settings
4. Test with both users online

### **Problem: Messages not deleting**
**Wait 5 minutes** - Cron runs every 5 minutes

**Check backend console:**
```
🗑️ Cleaned up X expired messages/media
```

**If not appearing:**
1. Verify cron schedule: `*/5 * * * *`
2. Check MongoDB connection
3. Manually trigger: Restart backend

---

## 📁 FILE STRUCTURE

```
backend/
├── models/
│   ├── conversation.model.js ✅ Updated
│   └── message.model.js ✅ Updated
├── controllers/
│   └── chat.controller.js ✅ Updated
├── routes/
│   └── chat.route.js ✅ Updated
├── services/
│   ├── messageCleanupService.js ✅ NEW
│   └── socketService.js (unchanged)
├── index.js ✅ Updated
└── package.json ✅ Updated

frontend/
├── src/
│   ├── components/
│   │   ├── TemporaryModeModal.jsx ✅ NEW
│   │   ├── OneTimeMediaModal.jsx ✅ NEW
│   │   └── OneTimeMediaViewer.jsx ✅ NEW
│   ├── pages/
│   │   └── chatSection/
│   │       ├── ChatWindow.jsx ✅ Updated
│   │       └── MessageBubble.jsx ✅ Updated
│   ├── store/
│   │   └── chatStore.js ✅ Updated
│   └── services/
│       └── chat.service.js ✅ Updated
```

---

## 🎯 WHAT CHANGED

### **Backend (6 files)**
1. `message.model.js` - Added 8 new fields
2. `conversation.model.js` - Added 2 new fields
3. `chat.controller.js` - Added 1 new controller, updated sendMessage
4. `chat.route.js` - Added 1 new route
5. `messageCleanupService.js` - NEW file (cron job)
6. `index.js` - Initialize cleanup service

### **Frontend (7 files)**
1. `TemporaryModeModal.jsx` - NEW component
2. `OneTimeMediaModal.jsx` - NEW component
3. `OneTimeMediaViewer.jsx` - NEW component
4. `ChatWindow.jsx` - Added modals + handlers
5. `MessageBubble.jsx` - Added one-time media UI
6. `chatStore.js` - Added socket listeners
7. `chat.service.js` - Added API function

### **Documentation (5 files)**
1. `TEMPORARY_CHAT_MODE_GUIDE.md`
2. `ONE_TIME_MEDIA_GUIDE.md`
3. `ONE_TIME_MEDIA_USAGE.md`
4. `PRIVACY_FEATURES_SUMMARY.md`
5. `QUICK_INSTALLATION_GUIDE.md` (this file)

---

## 🔐 SECURITY NOTES

### **Environment Variables**
No new env variables needed. Uses existing:
- `MONGODB_URI`
- `FRONTEND_URL`
- `CLOUDINARY_*`

### **Database Indexes (Recommended)**
```javascript
// Add indexes for performance
db.messages.createIndex({ "isTemporary": 1, "expiresAt": 1 })
db.messages.createIndex({ "isOneTimeMedia": 1, "mediaExpiresAt": 1 })
db.messages.createIndex({ "viewsLeft": 1 })
```

### **Cloudinary**
Expired media URLs remain in Cloudinary. To fully delete:
1. Store Cloudinary public_id in message
2. Delete from Cloudinary in cleanup job
3. Requires additional API calls (optional)

---

## 📊 MONITORING

### **Backend Logs to Watch**
```bash
✅ Message cleanup scheduler initialized
🗑️ Cleaned up X expired messages/media
socket connected <socketId>
User <userId> disconnected
```

### **Frontend Console**
```bash
socket connected <socketId>
🟢 RAW API RESPONSE: {...}
Zustand messages AFTER set: [...]
```

### **Database Queries**
```javascript
// Check temporary messages
db.messages.find({ isTemporary: true })

// Check one-time media
db.messages.find({ isOneTimeMedia: true })

// Check expired
db.messages.find({ 
    $or: [
        { expiresAt: { $lte: new Date() } },
        { mediaExpiresAt: { $lte: new Date() } }
    ]
})
```

---

## 🎓 NEXT STEPS

1. **Test thoroughly** - Use checklist above
2. **Read documentation** - Understand edge cases
3. **Educate users** - Share usage guides
4. **Monitor logs** - Watch for errors
5. **Gather feedback** - Improve based on usage

---

## 📞 SUPPORT

**If you encounter issues:**

1. **Check logs** - Backend console + browser console
2. **Verify files** - All files created/updated correctly
3. **Test basics** - Can you send normal messages?
4. **Restart servers** - Sometimes fixes socket issues
5. **Check documentation** - Detailed guides available

---

## 🎉 SUCCESS!

If you can:
- ✅ Toggle temporary mode
- ✅ Send one-time media
- ✅ See blurred previews
- ✅ View media with count decrement
- ✅ See expired states

**You're all set! Privacy features are working. 🚀**

---

**Total Setup Time: ~5 minutes**  
**Total Files Changed: 13**  
**New Dependencies: 1 (node-cron)**  
**Breaking Changes: 0**

**Enjoy your privacy-first messaging app! 🛡️🔒**
