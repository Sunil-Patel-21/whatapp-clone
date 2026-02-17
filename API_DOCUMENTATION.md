# 📡 API DOCUMENTATION - New Features

## Base URL
```
http://localhost:3000/api/messages
```

All endpoints require authentication via JWT token in cookies.

---

## 📌 PINNED MESSAGES API

### 1. Pin a Message
**Endpoint:** `POST /api/messages/pin`

**Request Body:**
```json
{
  "messageId": "507f1f77bcf86cd799439011",
  "category": "important",
  "note": "Meeting details for tomorrow"
}
```

**Response:** `201 Created`
```json
{
  "status": 201,
  "message": "message pinned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439013",
    "message": {
      "_id": "507f1f77bcf86cd799439011",
      "content": "Meeting at 3 PM",
      "sender": { "username": "John", "profilePicture": "..." },
      "receiver": { "username": "Jane", "profilePicture": "..." }
    },
    "conversation": "507f1f77bcf86cd799439014",
    "category": "important",
    "note": "Meeting details for tomorrow",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Categories:** `important`, `todo`, `reference`, `funny`, `other`

---

### 2. Get Pinned Messages
**Endpoint:** `GET /api/messages/pins`

**Query Parameters:**
- `conversationId` (optional) - Filter by conversation
- `category` (optional) - Filter by category

**Example:**
```
GET /api/messages/pins?conversationId=507f1f77bcf86cd799439014&category=important
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "pinned messages retrieved",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "message": { /* populated message */ },
      "category": "important",
      "note": "Meeting details",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Unpin a Message
**Endpoint:** `DELETE /api/messages/pins/:pinnedId`

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "message unpinned successfully"
}
```

---

### 4. Update Pin
**Endpoint:** `PUT /api/messages/pins/:pinnedId`

**Request Body:**
```json
{
  "category": "todo",
  "note": "Updated note"
}
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "pin updated successfully",
  "data": { /* updated pin */ }
}
```

---

## ⏰ SCHEDULED MESSAGES API

### 1. Schedule a Message
**Endpoint:** `POST /api/messages/schedule`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `receiverId` (required) - Receiver user ID
- `content` (optional) - Text content
- `scheduledFor` (required) - ISO date string
- `media` (optional) - File upload

**Example:**
```javascript
const formData = new FormData();
formData.append('receiverId', '507f1f77bcf86cd799439013');
formData.append('content', 'Happy Birthday!');
formData.append('scheduledFor', '2024-01-16T00:00:00.000Z');
```

**Response:** `201 Created`
```json
{
  "status": 201,
  "message": "message scheduled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "sender": { "username": "John", "profilePicture": "..." },
    "receiver": { "username": "Jane", "profilePicture": "..." },
    "content": "Happy Birthday!",
    "scheduledFor": "2024-01-16T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get Scheduled Messages
**Endpoint:** `GET /api/messages/scheduled`

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `sent`, `failed`, `cancelled`

**Example:**
```
GET /api/messages/scheduled?status=pending
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "scheduled messages retrieved",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "sender": { /* user */ },
      "receiver": { /* user */ },
      "content": "Happy Birthday!",
      "scheduledFor": "2024-01-16T00:00:00.000Z",
      "status": "pending"
    }
  ]
}
```

---

### 3. Cancel Scheduled Message
**Endpoint:** `DELETE /api/messages/scheduled/:scheduledId`

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "scheduled message cancelled"
}
```

**Note:** Only works for `pending` messages

---

### 4. Update Scheduled Message
**Endpoint:** `PUT /api/messages/scheduled/:scheduledId`

**Request Body:**
```json
{
  "content": "Updated message",
  "scheduledFor": "2024-01-16T12:00:00.000Z"
}
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "scheduled message updated",
  "data": { /* updated scheduled message */ }
}
```

---

## 🎭 MESSAGE TEMPLATES API

### 1. Create Template
**Endpoint:** `POST /api/messages/templates`

**Request Body:**
```json
{
  "title": "Meeting Link",
  "content": "Join meeting: https://meet.google.com/xyz",
  "category": "work",
  "variables": [
    { "name": "name", "placeholder": "John" },
    { "name": "time", "placeholder": "3 PM" }
  ]
}
```

**Response:** `201 Created`
```json
{
  "status": 201,
  "message": "template created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "user": "507f1f77bcf86cd799439013",
    "title": "Meeting Link",
    "content": "Join meeting: https://meet.google.com/xyz",
    "category": "work",
    "usageCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Categories:** `work`, `personal`, `meeting`, `address`, `other`

---

### 2. Get Templates
**Endpoint:** `GET /api/messages/templates`

**Query Parameters:**
- `category` (optional) - Filter by category
- `sortBy` (optional) - Sort by: `usage`, `recent`, or default (createdAt)

**Example:**
```
GET /api/messages/templates?category=work&sortBy=usage
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "templates retrieved",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "title": "Meeting Link",
      "content": "Join meeting: https://meet.google.com/xyz",
      "category": "work",
      "usageCount": 5,
      "lastUsedAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

---

### 3. Update Template
**Endpoint:** `PUT /api/messages/templates/:templateId`

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "category": "personal"
}
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "template updated",
  "data": { /* updated template */ }
}
```

---

### 4. Delete Template
**Endpoint:** `DELETE /api/messages/templates/:templateId`

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "template deleted"
}
```

---

### 5. Use Template
**Endpoint:** `POST /api/messages/templates/:templateId/use`

**Request Body:**
```json
{
  "variables": {
    "name": "John",
    "time": "3 PM"
  }
}
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "template processed",
  "data": {
    "content": "Join meeting at 3 PM, John",
    "template": { /* updated template with incremented usageCount */ }
  }
}
```

**Note:** Variables in template use `{{variableName}}` syntax

---

## 🔍 ADVANCED SEARCH API

### Search Messages
**Endpoint:** `GET /api/messages/search`

**Query Parameters:**
- `query` (optional) - Text search query
- `conversationId` (optional) - Filter by conversation
- `contentType` (optional) - Filter by type: `text`, `image`, `video`
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `senderId` (optional) - Filter by sender
- `limit` (optional, default: 50) - Results per page
- `skip` (optional, default: 0) - Pagination offset

**Example:**
```
GET /api/messages/search?query=meeting&contentType=text&startDate=2024-01-01&limit=20
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "search results",
  "data": {
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "content": "Meeting at 3 PM",
        "sender": { "username": "John", "profilePicture": "..." },
        "receiver": { "username": "Jane", "profilePicture": "..." },
        "contentType": "text",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 15,
    "hasMore": false
  }
}
```

---

## 📊 CHAT ANALYTICS API

### Get Analytics
**Endpoint:** `GET /api/messages/analytics`

**Query Parameters:**
- `conversationId` (optional) - Analytics for specific conversation
- `period` (optional, default: 30) - Days to analyze (7, 30, 90)

**Example:**
```
GET /api/messages/analytics?period=30
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "analytics retrieved",
  "data": {
    "period": 30,
    "totalMessages": 150,
    "sentMessages": 75,
    "receivedMessages": 75,
    "messagesByType": {
      "text": 120,
      "image": 20,
      "video": 10
    },
    "messagesByDay": [
      { "_id": "2024-01-15", "count": 25 },
      { "_id": "2024-01-14", "count": 30 }
    ],
    "topConversations": [
      {
        "conversation": { /* populated conversation */ },
        "messageCount": 50
      }
    ],
    "avgResponseTimeMinutes": 15
  }
}
```

---

## 🔒 AUTHENTICATION

All endpoints require JWT authentication. Include token in cookies:

```javascript
// Frontend (axios)
import { axiosInstance } from '../services/url.service';

const response = await axiosInstance.get('/messages/pins');
```

**Error Response (401 Unauthorized):**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

## ❌ ERROR RESPONSES

### 400 Bad Request
```json
{
  "status": 400,
  "message": "Validation error message"
}
```

### 403 Forbidden
```json
{
  "status": 403,
  "message": "unauthorized user"
}
```

### 404 Not Found
```json
{
  "status": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": 500,
  "message": "Internal server error"
}
```

---

## 🔔 SOCKET EVENTS

### Scheduled Message Sent
**Event:** `scheduled_message_sent`

**Payload:**
```json
{
  "scheduledId": "507f1f77bcf86cd799439015",
  "message": { /* actual message that was sent */ }
}
```

**Listen:**
```javascript
socket.on('scheduled_message_sent', (data) => {
  console.log('Scheduled message sent:', data);
});
```

---

### Scheduled Message Failed
**Event:** `scheduled_message_failed`

**Payload:**
```json
{
  "scheduledId": "507f1f77bcf86cd799439015",
  "reason": "Error message"
}
```

---

## 📝 NOTES

### Rate Limiting
- No rate limiting currently implemented
- Recommended: Add rate limiting for production

### Pagination
- Search API supports pagination via `limit` and `skip`
- Default limit: 50 messages

### Text Search
- Uses MongoDB text index
- Supports partial word matching
- Case-insensitive

### Date Formats
- All dates in ISO 8601 format
- Example: `2024-01-15T10:30:00.000Z`

### File Uploads
- Scheduled messages support media uploads
- Uses existing Cloudinary configuration
- Max file size: As configured in multer

---

## 🧪 TESTING WITH CURL

### Pin a Message
```bash
curl -X POST http://localhost:3000/api/messages/pin \
  -H "Content-Type: application/json" \
  -b "token=YOUR_JWT_TOKEN" \
  -d '{
    "messageId": "507f1f77bcf86cd799439011",
    "category": "important",
    "note": "Test note"
  }'
```

### Schedule a Message
```bash
curl -X POST http://localhost:3000/api/messages/schedule \
  -b "token=YOUR_JWT_TOKEN" \
  -F "receiverId=507f1f77bcf86cd799439013" \
  -F "content=Test message" \
  -F "scheduledFor=2024-01-16T12:00:00.000Z"
```

### Search Messages
```bash
curl -X GET "http://localhost:3000/api/messages/search?query=meeting&limit=10" \
  -b "token=YOUR_JWT_TOKEN"
```

---

## 📚 RELATED DOCUMENTATION

- **QUICK_START.md** - Setup guide
- **FEATURES_USAGE_GUIDE.md** - User guide
- **PROJECT_COMPLETION_SUMMARY.md** - Complete overview

---

**API Version:** 1.0  
**Last Updated:** 2024-01-15  
**Base URL:** http://localhost:3000/api/messages
