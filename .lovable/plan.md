

# AI Context Document - Knowledge Transfer Plan

## Overview
I'll create a comprehensive markdown document (`AI_CONTEXT_DOCUMENT.md`) that serves as your "developer profile" to paste into any new Lovable project. This gives the AI instant context about who you are, what you've learned, and what you're trying to achieve with each project.

---

## Document Structure

### Section 1: Personal Context & Journey
Your background, current situation, and goals:
- 20 years old, UW background (HCDE)
- Transitioned from "get rich quick" approaches to genuine skill building
- Portfolio approach: apps as recurring revenue streams (like YouTube videos)
- Timeline goals (June conversation, September independence)
- 17-month financial runway to build sustainably

### Section 2: Learning Curriculum
Your planned progression through increasingly complex apps:
- App #1 (Complete): Social/Groups mechanics, full-stack fundamentals
- App #2 (Next): Native iOS features (camera, share, haptics, notifications)
- App #3: Payment integration (Stripe/StoreKit)
- App #4: The "real" app combining everything

### Section 3: The 15-Step Framework
Your refined development process:
1. Build Idea (MVP scope)
2. Design UI/UX
3. Architect Backend
4. Mental UX Walkthrough
5. Plan Build Order
6. Build Core Features
7. Test Functionality
8. Fix & Iterate
9. Physical Device Testing
10. Developer Account & Certificates
11. App Store Assets
12. TestFlight Submission
13. User Testing (5+ people)
14. Final Polish
15. App Store Submission

### Section 4: App #1 Technical Debrief (MyGolfApp)
Detailed documentation of what you learned:

**Authentication**
- Email-based auth with auto-confirm enabled
- AuthProvider pattern wrapping the app
- ProtectedRoute and PublicRoute components
- Session management with onAuthStateChange

**Database Architecture**
- Profiles table with auto-creation trigger on signup
- Bi-directional friendship system (requester/addressee)
- Group membership with owner permissions
- Matches/Teams/TeamPlayers for game tracking
- Updated_at triggers for timestamp management

**Row Level Security (RLS) Patterns**
Three core patterns you mastered:
1. User-owned data: `auth.uid() = user_id`
2. Membership-based: `EXISTS (SELECT 1 FROM members WHERE...)`
3. Public read: `USING (true)` for SELECT only

**Secure Operations**
- RPC function for email lookup (hides emails from frontend)
- SECURITY DEFINER functions for privileged operations
- Input validation triggers on the database side

**Custom Hook Pattern**
Standard structure for data management:
- useState for data, loading, error
- useEffect for initial fetch
- Async functions for CRUD
- Toast notifications for feedback
- Return object with data and methods

**Mobile Deployment**
- Capacitor setup and configuration
- iOS safe area handling (pt-safe, pb-safe)
- Bottom navigation with proper spacing
- Xcode archive workflow
- TestFlight submission process
- Export compliance for TestFlight

### Section 5: Reusable Code Patterns
Ready-to-reference templates:

**Auth Context Pattern**
```typescript
// AuthProvider structure
// useAuth hook returning: user, session, loading, signUp, signIn, signOut
```

**Custom Hook Template**
```typescript
// Standard hook structure with loading/error states
// Fetch on mount, CRUD operations, toast feedback
```

**RLS Policy Templates**
```sql
-- User-owned data
CREATE POLICY "name" ON table FOR operation USING (auth.uid() = user_id);

-- Membership-based access
CREATE POLICY "name" ON table FOR operation USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND ...)
);
```

**Database Table Template**
```sql
-- Standard table structure with:
-- id UUID primary key
-- user_id reference
-- created_at, updated_at timestamps
-- RLS enabled immediately
```

**Mobile-Safe Layout**
```css
.pt-safe { padding-top: max(env(safe-area-inset-top, 0px), 44px); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0); }
/* pb-20 when using bottom navigation */
```

### Section 6: Project Introduction Template
A fill-in-the-blank section for each new project:

```markdown
## Current Project: [App Name]
This is App #[X] in my learning curriculum.

### Learning Objectives:
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

### What This App Does:
[Brief description]

### Success Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
```

### Section 7: Communication Preferences
How you like to work with the AI:
- Direct, practical advice over theoretical
- Honest about difficulty levels and timelines
- Step-by-step breakdowns for complex tasks
- Focus on learning, not just completing

---

## Technical Patterns Reference

### File Structure from App #1
```text
src/
  hooks/          # Custom data hooks (useAuth, useProfile, etc.)
  components/     # UI components organized by feature
  pages/          # Route-level page components
  integrations/   # Supabase client (auto-generated)
  lib/            # Utility functions
  index.css       # Design system / CSS variables
supabase/
  migrations/     # Database migrations
  config.toml     # Supabase configuration (auto-managed)
capacitor.config.ts  # Mobile app configuration
```

### Key Database Functions from App #1
- `handle_new_user()` - Auto-creates profile on signup
- `update_updated_at_column()` - Manages timestamps
- `search_user_by_email()` - Secure email lookup via RPC
- `is_group_member()` / `is_group_owner()` - Permission checks

### iOS Deployment Checklist
1. Remove server block from capacitor.config.ts for production
2. npm run build
3. npx cap sync ios
4. Xcode > Product > Archive
5. Distribute to App Store Connect
6. Handle Export Compliance (select "No" for standard HTTPS)
7. TestFlight review and distribution

---

## Document Location
The file will be created at the project root as `AI_CONTEXT_DOCUMENT.md` - easy to find and copy for your next project.

## How to Use
1. Open the document in this project
2. Copy the entire contents
3. Paste into the first message of your new project
4. Fill in the "Current Project" section for that specific app
5. After completing each app, update the "Past Apps Registry" section

---

## What I'll Include
- Your complete journey and goals (the personal context we discussed)
- The 15-step framework with explanations
- All technical patterns from MyGolfApp with real code examples
- RLS policy templates you can copy-paste
- Mobile deployment checklist
- The project introduction template for each new app

This will be approximately 600-700 lines of well-organized markdown.

