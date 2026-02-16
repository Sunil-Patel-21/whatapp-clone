# 🔒 HOW TO USE ONE-TIME MEDIA VIEWER

## 🚀 QUICK START

### **Step 1: Send One-Time Media**

1. Open any chat
2. Click **📎 paperclip icon**
3. Select **image or video**
4. Popup asks: **"Enable One-Time View Plus?"**
5. Click **Yes**

### **Step 2: Configure Settings**

Modal opens with options:

**View Limit:**
- ○ 1 View (media deleted after 1 view)
- ○ 2 Views (media deleted after 2 views)

**Time Limit:**
- ○ 10 Minutes
- ○ 1 Hour
- ○ 24 Hours
- ○ Custom (enter minutes)

**Example:** Select "1 View" + "10 Minutes"

Click **"Enable"** → Media sent with restrictions

### **Step 3: Receiver Views Media**

**What receiver sees:**
- Blurred preview with 🔒 lock icon
- Label: "One-Time Media"
- Text: "1 view left"

**To view:**
1. Click blurred preview
2. Full-screen viewer opens
3. Warning: "Screenshots discouraged but not blocked"
4. Click **"View Media"**
5. Media loads (image/video)
6. Header shows: "0 views left" + time remaining

**After viewing:**
- Viewer auto-closes after 3 seconds
- Back in chat: "This media has expired" 🕒

---

## 💡 USE CASES

### **Scenario 1: Sharing Password**
```
You: Send screenshot of password
Settings: 1 View + 10 Minutes
Friend: Views once → Screenshot deleted
Result: Password not stored permanently
```

### **Scenario 2: Confidential Document**
```
You: Send photo of contract
Settings: 2 Views + 1 Hour
Client: Views twice to read carefully
After 1 hour: Document auto-deleted
```

### **Scenario 3: Private Photo**
```
You: Send personal photo
Settings: 1 View + 24 Hours
Recipient: Has 24h to view once
After viewing: Photo deleted immediately
```

---

## 🎯 VISUAL INDICATORS

| Icon | Meaning |
|------|---------|
| 🔒 Lock icon | One-time media (not viewed yet) |
| Blurred image | Media hidden until viewed |
| "X views left" | Remaining view count |
| 🕒 Clock icon | Media expired |
| "This media has expired" | No longer viewable |

---

## ⚠️ IMPORTANT NOTES

### **What's Protected:**
✅ Media auto-deletes after views/time  
✅ Blurred until viewed  
✅ Right-click disabled  
✅ Download disabled (videos)  
✅ View count tracked  
✅ Works across devices  

### **What's NOT Protected:**
❌ Screenshots (browser can't block)  
❌ Screen recording  
❌ Physical camera photos  

**Honest Disclaimer:**  
This feature focuses on **auto-deletion**, not screenshot prevention. Use for temporary sharing, not absolute security.

---

## 🔄 EXPIRY RULES

**Media expires when:**
1. View limit reached (1 or 2 views) **OR**
2. Time limit reached (10min - 24h)

**Whichever comes first!**

**Example:**
- Settings: 2 Views + 10 Minutes
- Viewed once at 5 minutes → Still available
- Viewed twice at 7 minutes → Expired (view limit)
- If not viewed by 10 minutes → Expired (time limit)

---

## 🛠️ TROUBLESHOOTING

**Problem: Can't see One-Time option**  
→ Only works for images/videos, not text

**Problem: Media already expired**  
→ Check time limit - may have passed before viewing

**Problem: "No views remaining"**  
→ Already viewed maximum times

**Problem: Blurred preview not showing**  
→ Refresh page, check internet connection

**Problem: Can't view on second device**  
→ View count is shared - if viewed on phone, desktop shows 0 views left

---

## 📱 MULTI-DEVICE BEHAVIOR

**Scenario:**
1. Send one-time media (1 view)
2. Receiver has phone + laptop logged in
3. Views on phone → Count decrements to 0
4. Laptop automatically updates → Shows "expired"

**View count is synced across ALL devices in real-time.**

---

## ⏱️ TIMING EXAMPLES

| Setting | Sent At | Expires At | Notes |
|---------|---------|-----------|-------|
| 10 Minutes | 2:00 PM | 2:10 PM | Quick share |
| 1 Hour | 2:00 PM | 3:00 PM | Standard |
| 24 Hours | 2:00 PM | 2:00 PM next day | Long window |
| Custom 30min | 2:00 PM | 2:30 PM | Flexible |

**Timer starts when you send, not when they view!**

---

## 🆚 WHEN TO USE WHAT

| Feature | Use For |
|---------|---------|
| **Normal Message** | Permanent conversations |
| **Temporary Chat Mode** | Entire conversation temporary |
| **One-Time Media** | Single sensitive image/video |
| **Both Combined** | Maximum privacy (temp chat + one-time media) |

---

## 🎓 BEST PRACTICES

✅ **DO:**
- Use for passwords, IDs, sensitive docs
- Set appropriate time limits
- Inform recipient it's one-time
- Check "views left" before closing

❌ **DON'T:**
- Assume screenshots are blocked
- Share extremely sensitive data (use encrypted channels)
- Forget timer starts immediately
- Expect unlimited views

---

## 🔐 PRIVACY TIPS

1. **Combine with Temporary Chat Mode** for double protection
2. **Use 1 view for passwords** (no second chances)
3. **Use 2 views for documents** (allows careful reading)
4. **Set short time limits** for urgent info
5. **Warn recipient** before sending one-time media

---

## 📞 SUPPORT

**Media not loading?**
- Check backend is running
- Verify Cloudinary config
- Check browser console for errors

**View count not updating?**
- Refresh page
- Check socket connection
- Verify both users online

**Cron job not deleting?**
- Check backend console for cron logs
- Wait up to 5 minutes after expiry
- Verify node-cron is installed

---

**That's it! You now have a privacy-first one-time media viewer. 🎉**

**Remember:** This feature is about **temporary sharing**, not absolute security. Use responsibly!
