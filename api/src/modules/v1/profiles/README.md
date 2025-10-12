# Profile Module

The Profile module provides comprehensive user profile management functionality, including personal information, social links, notification preferences, and privacy settings.

## Features

- **User Profile Management**: Create, read, update, and delete user profiles
- **Social Links**: Manage social media and website links (website, linkedin, github, twitter, instagram)
- **Notification Preferences**: Configure email and push notification settings with frequency controls
- **Privacy Controls**: Set profile visibility (PUBLIC, FRIENDS, PRIVATE)
- **Theme & Localization**: Support for theme preferences (LIGHT, DARK) and language settings
- **Profile Statistics**: View project, task, and note counts with completion metrics
- **Settings Management**: Separate endpoints for profile data vs. user preferences

## API Endpoints

### Profile CRUD Operations

- `POST /api/v1/profiles` - Create a new profile
- `GET /api/v1/profiles/me` - Get current user's profile
- `GET /api/v1/profiles/:uuid` - Get profile by UUID (respects privacy settings)
- `PUT /api/v1/profiles/:uuid` - Update profile (owner or admin only)
- `DELETE /api/v1/profiles/:uuid` - Delete profile (owner or admin only)

### Profile Discovery

- `GET /api/v1/profiles/public` - List public profiles with filtering and pagination
  - Query parameters: `page`, `limit`, `search`, `language`, `theme`

### Profile Statistics

- `GET /api/v1/profiles/:uuid/stats` - Get profile statistics (projects, tasks, notes counts)

### Settings Management

- `GET /api/v1/profiles/settings` - Get user's profile settings
- `PUT /api/v1/profiles/settings` - Update user's profile settings

## Data Models

### Profile

```typescript
{
  id: number
  uuid: string
  userId: number
  bio?: string
  avatarUrl?: string
  coverUrl?: string
  timezone: string
  language: string
  theme: Theme (LIGHT | DARK)
  socialLinks: SocialLinks
  notifications: NotificationSettings
  visibility: Visibility (PUBLIC | FRIENDS | PRIVATE)
  createdAt: Date
  updatedAt: Date
}
```

### Social Links

```typescript
{
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
}
```

### Notification Settings

```typescript
{
  email?: {
    projects?: boolean
    tasks?: boolean
    notes?: boolean
    mentions?: boolean
  }
  push?: {
    projects?: boolean
    tasks?: boolean
    notes?: boolean
    mentions?: boolean
  }
  frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
}
```

## Security & Privacy

- **Authentication Required**: All endpoints require valid JWT token
- **Authorization**: Users can only modify their own profiles (except admins)
- **Privacy Levels**:
  - `PUBLIC`: Visible to everyone
  - `FRIENDS`: Visible to friends only (future implementation)
  - `PRIVATE`: Visible only to owner and admins
- **Data Validation**: Comprehensive input validation with Zod schemas
- **URL Validation**: Social links are validated as proper URLs

## File Structure

```
profiles/
├── profile.model.ts       # Data models and database operations
├── profile.service.ts     # Business logic and validation
├── profile.controller.ts  # HTTP request handlers
├── profile.routes.ts      # Route definitions
├── index.ts              # Module exports
└── README.md             # This documentation
```

## Business Rules

1. **One Profile Per User**: Each user can have only one profile
2. **Default Settings**: New profiles get sensible defaults (public visibility, light theme, etc.)
3. **Cascading Deletes**: Deleting a profile also marks the user as deleted
4. **Social Platform Validation**: Only allowed social platforms are accepted
5. **Privacy Enforcement**: Private profiles are hidden from public listings
6. **Admin Override**: Admins can view/modify any profile regardless of privacy settings

## Usage Examples

### Create Profile

```typescript
POST /api/v1/profiles
{
  "bio": "Full-stack developer passionate about clean code",
  "timezone": "America/New_York",
  "language": "en",
  "theme": "DARK",
  "socialLinks": {
    "github": "https://github.com/username",
    "linkedin": "https://linkedin.com/in/username"
  },
  "visibility": "PUBLIC"
}
```

### Update Settings

```typescript
PUT /api/v1/profiles/settings
{
  "theme": "LIGHT",
  "notifications": {
    "email": {
      "projects": true,
      "tasks": false
    },
    "frequency": "daily"
  }
}
```

### Get Public Profiles

```typescript
GET /api/v1/profiles/public?page=1&limit=10&search=developer&theme=DARK
```

## Error Handling

- **400 Bad Request**: Validation errors, invalid data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions or private profile
- **404 Not Found**: Profile doesn't exist
- **500 Internal Server Error**: Server-side errors

## Dependencies

- **Prisma**: Database ORM for data persistence
- **Zod**: Runtime type validation
- **Express**: HTTP framework
- **JWT**: Authentication middleware

## Testing

The profile module follows the same testing patterns as other modules:

- Unit tests for service logic
- Integration tests for database operations
- E2E tests for API endpoints
- Security tests for authorization

## Future Enhancements

- **Friend System**: Implement friends/followers for FRIENDS visibility
- **Profile Pictures**: Add image upload and processing
- **Activity Feed**: Show recent profile activities
- **Profile Themes**: Custom theme settings beyond LIGHT/DARK
- **Verification Badges**: Verified profiles for notable users
- **Profile Analytics**: Detailed view statistics and engagement metrics
