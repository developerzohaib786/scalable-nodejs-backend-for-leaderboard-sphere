# Messages API Documentation

## Overview
API endpoint to fetch all messages for a specific chat room.

## Endpoint

### Get All Messages for a Room
**GET** `/api/messages/room/:roomId`

Retrieves all messages for a specified room, ordered by creation time (oldest first).

#### URL Parameters
- `roomId` (required): The ID of the room to fetch messages from (e.g., "room1", "room2", etc.)

#### Example Requests

**Using cURL:**
```bash
# Fetch messages for room1
curl http://localhost:3003/api/messages/room/room1

# Fetch messages for room2
curl http://localhost:3003/api/messages/room/room2
```

**Using JavaScript (Fetch API):**
```javascript
const roomId = 'room1';
const response = await fetch(`http://localhost:3003/api/messages/room/${roomId}`);
const data = await response.json();

if (data.success) {
  console.log(`Fetched ${data.count} messages`);
  console.log(data.messages);
}
```

**Using Axios:**
```javascript
import axios from 'axios';

const roomId = 'room1';
const { data } = await axios.get(`http://localhost:3003/api/messages/room/${roomId}`);

if (data.success) {
  console.log(`Total messages: ${data.count}`);
  data.messages.forEach(msg => {
    console.log(`${msg.userName}: ${msg.text}`);
  });
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid-1",
      "text": "Hello, this is the first message",
      "userName": "John Doe",
      "userImage": "https://avatar.iran.liara.run/public/1",
      "userId": "user123",
      "roomId": "room1",
      "createdAt": "2026-01-24T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "text": "This is the second message",
      "userName": "Jane Smith",
      "userImage": "https://avatar.iran.liara.run/public/2",
      "userId": "user456",
      "roomId": "room1",
      "createdAt": "2026-01-24T10:31:00.000Z"
    }
  ],
  "count": 2
}
```

#### Error Responses

**400 Bad Request** - Missing room ID:
```json
{
  "error": "Room ID is required"
}
```

**500 Internal Server Error** - Server or database error:
```json
{
  "error": "Failed to fetch messages",
  "message": "Database connection error"
}
```

---

### Get Room Information
**GET** `/api/messages/room/:roomId/info`

Retrieves information about a room including message count.

#### URL Parameters
- `roomId` (required): The ID of the room

#### Example Request
```bash
curl http://localhost:3003/api/messages/room/room1/info
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "room": {
    "id": "room1-uuid",
    "name": "Room 1",
    "createdAt": "2026-01-20T08:00:00.000Z",
    "messageCount": 42
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "error": "Room not found"
}
```

---

## Message Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the message (UUID) |
| `text` | string | The message content |
| `userName` | string | Display name of the user who sent the message |
| `userImage` | string | URL to the user's avatar image |
| `userId` | string | Unique identifier for the user |
| `roomId` | string | ID of the room this message belongs to |
| `createdAt` | string | ISO 8601 timestamp of when the message was created |

---

## Frontend Integration Examples

### React Component
See `examples/ChatMessages.tsx` for a complete React component example.

### Vanilla JavaScript
Open `test-messages-pagination.html` in a browser to test the API with a simple HTML/JS interface.

---

## Testing

1. **Make sure your server is running:**
   ```bash
   npm run dev
   ```

2. **Test with the HTML file:**
   - Open `test-messages-pagination.html` in your browser
   - Select a room from the dropdown
   - Messages will load automatically

3. **Test with cURL:**
   ```bash
   curl http://localhost:3003/api/messages/room/room1
   ```

4. **Test with Postman:**
   - Create a GET request to `http://localhost:3003/api/messages/room/room1`
   - Send the request
   - You should see the JSON response with all messages

---

## Notes

- Messages are returned in ascending order (oldest first)
- All messages for the room are returned in a single response
- The `count` field in the response indicates the total number of messages
- Make sure the room exists in your database, or you'll get an empty array
- The API uses Prisma to query the PostgreSQL database

---

## Available Rooms

By default, the following rooms are available:
- `room1`
- `room2`
- `room3`
- `room4`

You can create more rooms by sending messages to them via Socket.io, which will automatically create the room if it doesn't exist.
