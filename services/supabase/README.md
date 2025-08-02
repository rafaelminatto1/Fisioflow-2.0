# Supabase Integration

This directory contains the complete Supabase integration for FisioFlow 2.0, providing authentication, database, and storage services.

## Setup

### 1. Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Installation

The Supabase client is already installed. If you need to reinstall:

```bash
npm install @supabase/supabase-js
```

## Services Overview

### AuthService
Handles user authentication and profile management.

```typescript
import { AuthService } from '@/services/supabase';

// Sign up new user
const result = await AuthService.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  firstName: 'João',
  lastName: 'Silva',
  role: 'patient'
});

// Sign in
const signInResult = await AuthService.signIn('user@example.com', 'password');

// Update profile
const updateResult = await AuthService.updateProfile({
  firstName: 'João Carlos',
  phone: '+5511999999999'
});
```

### DatabaseService
Generic database operations with type safety.

```typescript
import { DatabaseService } from '@/services/supabase';

// Select with filters
const patients = await DatabaseService.select('patients', {
  filter: { active: true },
  order: { column: 'created_at', ascending: false },
  limit: 10
});

// Insert new record
const newPatient = await DatabaseService.insert('patients', {
  first_name: 'Maria',
  last_name: 'Santos',
  email: 'maria@example.com'
});

// Update record
const updated = await DatabaseService.update('patients', patientId, {
  phone: '+5511888888888'
});
```

### StorageService
File upload and management.

```typescript
import { StorageService } from '@/services/supabase';

// Upload file
const uploadResult = await StorageService.uploadFile(
  'user-uploads', 
  'avatars/user-123.jpg', 
  file
);

// Get public URL
const publicUrl = StorageService.getPublicUrl('user-uploads', 'avatars/user-123.jpg');

// List files
const files = await StorageService.listFiles('user-uploads', 'avatars/');
```

## Error Handling

All services return a consistent response format:

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}
```

Use the error handler for user-friendly messages:

```typescript
import { SupabaseErrorHandler } from '@/services/supabase';

const result = await AuthService.signIn(email, password);

if (!result.success) {
  const errorInfo = SupabaseErrorHandler.parseError(result.error);
  console.log(errorInfo.userMessage); // Portuguese error message
}
```

## Connection Testing

Test your Supabase connection:

```typescript
import { SupabaseConnectionTester } from '@/services/supabase';

// Run comprehensive health check
const healthCheck = await SupabaseConnectionTester.runHealthCheck();
console.log(`Status: ${healthCheck.overall}`);

// Test specific table
const tableTest = await SupabaseConnectionTester.testTableAccess('profiles');
```

## Database Schema

The integration expects a `profiles` table that extends Supabase's built-in auth:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('therapist', 'patient', 'partner', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## File Structure

```
services/supabase/
├── client.ts              # Supabase client configuration
├── authService.ts         # Authentication service
├── databaseService.ts     # Database operations
├── storageService.ts      # File storage operations
├── connectionTest.ts      # Connection testing utilities
├── errorHandler.ts        # Error handling and parsing
├── examples.ts           # Usage examples
├── integration-test.ts   # Manual integration testing
├── index.ts              # Main exports
└── README.md             # This file
```

## Testing

Run the integration test to verify your setup:

```typescript
import { runIntegrationTests } from '@/services/supabase/integration-test';

await runIntegrationTests();
```

## Security Features

- **Row Level Security (RLS)**: Database policies enforce data access rules
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different user roles with appropriate permissions
- **LGPD Compliance**: Built-in support for Brazilian data protection requirements
- **Error Sanitization**: User-friendly error messages without exposing sensitive data

## Best Practices

1. **Always check the success flag** before using data
2. **Use the error handler** for consistent error messages
3. **Implement retry logic** for network-related errors
4. **Test connections** during application startup
5. **Use TypeScript interfaces** for type safety
6. **Follow the service layer pattern** for clean architecture

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check environment variables and Supabase project status
2. **Authentication Errors**: Verify email confirmation and user roles
3. **Database Errors**: Ensure tables exist and RLS policies are configured
4. **Storage Errors**: Check bucket permissions and file size limits

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will log detailed error information to the console.

## Support

For issues specific to this integration, check:

1. Environment variable configuration
2. Supabase project settings
3. Database schema and policies
4. Network connectivity

For Supabase-specific issues, refer to the [official documentation](https://supabase.com/docs).