# Shared Code Synchronization Guide

## Overview

The AllyTZ Panel project now uses a **monorepo structure** with shared code between the web and mobile applications. This ensures consistency and reduces duplication.

## Project Structure

```
allyTZ_panel/
├── src/                    # Web app (React + Vite)
├── mobile/                 # Mobile app (Expo + React Native)
├── shared/                 # Shared code used by both apps
│   ├── constants/         # Shared constants
│   │   ├── colors.ts      # Color palette
│   │   └── supabase.ts    # Supabase config
│   ├── types/             # Shared TypeScript types
│   │   ├── signal.ts      # Signal types
│   │   ├── notification.ts # Notification types
│   │   └── index.ts       # Type exports
│   └── utils/             # Shared utility functions
│       └── notifications.ts # Notification utilities
└── supabase/              # Database migrations & functions
```

## What's Shared

### Constants
- **Colors**: Color palette used by both web and mobile
- **Supabase Config**: URL and API keys (single source of truth)

### Types
- **Signal Types**: `Signal`, `SignalPricing` interfaces
- **Notification Types**: `Notification`, `NotificationData`, `NotificationType`

### Utilities
- **Notification Utils**: `formatRelativeTime()`, `formatSignalNotification()`, etc.

## How to Use Shared Code

### In Web App (`src/`)

```typescript
// Import shared constants
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../shared/constants/supabase';
import { Colors } from '../shared/constants/colors';

// Import shared types
import type { Signal, SignalPricing } from '../shared/types';
import type { Notification, NotificationType } from '../shared/types';

// Import shared utilities
import { formatRelativeTime } from '../shared/utils/notifications';
```

### In Mobile App (`mobile/`)

```typescript
// Import shared constants
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../shared/constants/supabase';
import { Colors } from '../shared/constants/colors';

// Import shared types
import type { Signal, SignalPricing } from '../shared/types';
import type { Notification, NotificationType } from '../shared/types';

// Import shared utilities
import { formatRelativeTime } from '../shared/utils/notifications';
```

## Adding New Shared Code

### 1. Add New Types

Create a new file in `shared/types/`:

```typescript
// shared/types/event.ts
export interface Event {
  id: string;
  title: string;
  // ... other fields
}
```

Then export it from `shared/types/index.ts`:

```typescript
export * from './event';
```

### 2. Add New Constants

Add to existing files or create new ones in `shared/constants/`:

```typescript
// shared/constants/api.ts
export const API_BASE_URL = 'https://api.example.com';
```

### 3. Add New Utilities

Create platform-agnostic utilities in `shared/utils/`:

```typescript
// shared/utils/formatting.ts
export function formatCurrency(amount: number): string {
  // Works in both web and mobile
}
```

## Platform-Specific Code

### Web-Specific
- React Router navigation
- shadcn/ui components
- Framer Motion animations
- Web-specific hooks (`use-mobile.tsx`)

### Mobile-Specific
- Expo Router navigation
- React Native components
- React Native Reanimated
- Mobile-specific hooks (e.g., `use-expo-notifications.tsx`)

## Benefits

1. **Single Source of Truth**: Supabase config, types, and constants are defined once
2. **Type Safety**: Shared types ensure consistency between web and mobile
3. **Easier Updates**: Update shared code once, both apps benefit
4. **Consistency**: Same business logic and data structures across platforms
5. **Reduced Duplication**: No need to maintain separate copies of types/constants

## Migration Notes

### Already Migrated
- ✅ Supabase configuration constants
- ✅ Color constants
- ✅ Signal types
- ✅ Notification types
- ✅ Notification utility functions

### To Be Migrated (Future)
- Event types
- Trade analysis types
- User types
- Form validation schemas (Zod)
- Business logic utilities

## Best Practices

1. **Keep Shared Code Platform-Agnostic**: Don't import React Native or web-specific libraries in shared code
2. **Use TypeScript**: All shared code should be strongly typed
3. **Document Shared APIs**: Add JSDoc comments for shared functions
4. **Test Shared Code**: Consider adding tests for shared utilities
5. **Version Control**: Both apps should use the same version of shared code

## Troubleshooting

### Import Errors
If you get import errors, check:
- Path is correct (relative to your file location)
- File exists in `shared/` directory
- TypeScript path aliases are configured correctly

### Type Mismatches
If types don't match:
- Ensure both apps import from `shared/types`
- Check that shared types are up to date
- Verify TypeScript compilation

### Build Issues
- Ensure `shared/` directory is included in TypeScript compilation
- Check `tsconfig.json` includes shared files
- Verify build tools can access shared directory
