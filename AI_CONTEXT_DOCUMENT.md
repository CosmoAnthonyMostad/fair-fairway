# AI Context Document - Developer Profile

> **How to use this document:** Copy the entire contents and paste into the first message of any new Lovable project. Fill in the "Current Project" section for that specific app. Update the "Past Apps Registry" section as you complete each app.

---

## Section 1: Personal Context & Journey

### Who I Am
- 20 years old, UW background (Human Centered Design & Engineering)
- Self-directed learner building toward financial independence through app development
- Transitioned from "get rich quick" thinking to genuine skill building

### My Philosophy
I treat apps like YouTube videos - each one is a potential recurring revenue stream. I'm building a portfolio of apps, learning with each one, so that by App #4 I have all the skills to build something polished and monetizable.

### Timeline Goals
- **June 2026**: Have a real conversation about path forward
- **September 2026**: Target for financial independence through apps
- **17-month runway**: Building sustainably without desperation

### What I Need From AI Assistants
- Direct, practical advice over theoretical explanations
- Honest assessments of difficulty and timelines
- Step-by-step breakdowns for complex tasks
- Focus on learning, not just completing tasks
- Treat me as a capable learner, not a beginner who needs hand-holding

---

## Section 2: Learning Curriculum

I'm building increasingly complex apps to learn specific skills:

### App #1: MyGolfApp ✅ COMPLETE
**Focus**: Social/Groups mechanics, full-stack fundamentals
- Authentication with email-based signup
- Database design with relationships (friends, groups, matches)
- Row Level Security (RLS) patterns
- Mobile deployment via Capacitor
- Full App Store submission process

### App #2: [TBD] 🎯 NEXT
**Focus**: Native iOS features
- Camera access and photo handling
- Share sheet integration
- Haptic feedback
- Push notifications
- Device-specific APIs via Capacitor plugins

### App #3: [TBD]
**Focus**: Payment integration
- Stripe or StoreKit implementation
- Subscription management
- Payment flows and error handling

### App #4: The "Real" App
**Focus**: Combining everything
- A genuine problem to solve
- Polish and professional feel
- Monetization from day one
- Everything I've learned applied

---

## Section 3: The 15-Step Framework

My refined development process from idea to App Store:

### Phase 1: Planning
1. **Build Idea** - Define MVP scope, core features only
2. **Design UI/UX** - Layouts, color scheme, component structure
3. **Architect Backend** - Database schema, auth strategy, security model
4. **Mental UX Walkthrough** - Imagine using every feature, find friction points
5. **Plan Build Order** - Dependencies, what builds on what

### Phase 2: Development
6. **Build Core Features** - Iterative development, one feature at a time
7. **Test Functionality** - Try to break it, log issues
8. **Fix & Iterate** - Repeat until solid

### Phase 3: Mobile & Deployment
9. **Physical Device Testing** - Real hardware via Xcode/Android Studio
10. **Developer Account & Certificates** - Apple/Google setup, signing certificates
11. **App Store Assets** - Screenshots, icons, metadata, privacy policy
12. **TestFlight Submission** - Beta distribution for testing
13. **User Testing (5+ people)** - Gather feedback, note issues
14. **Final Polish** - Address feedback, fix edge cases
15. **App Store Submission** - The real thing

---

## Section 4: Past Apps Registry

### App #1: MyGolfApp (Golf Match Tracking)

**What It Does**: Track golf matches with friends, manage groups, calculate handicaps, record match history.

**Status**: Complete - Submitted to App Store

#### Technical Learnings

##### Authentication
```typescript
// Pattern: AuthProvider wrapping the entire app
// useAuth hook provides: user, session, loading, signUp, signIn, signOut

// Key files:
// - src/hooks/useAuth.tsx (the hook)
// - App.tsx wraps everything in <AuthProvider>

// Email-based auth with auto-confirm enabled
// No OAuth providers (simplified for initial submission)
```

**What I Learned**:
- Always enable auto-confirm for email signups during development
- `onAuthStateChange` listener handles session persistence
- ProtectedRoute component redirects unauthenticated users
- PublicRoute component redirects authenticated users away from login

##### Database Architecture
```sql
-- Core tables and their relationships:

-- profiles: User data, auto-created on signup via trigger
-- friendships: Bi-directional system (requester_id, addressee_id, status)
-- groups: Owner-based with avatar support
-- group_members: Many-to-many relationship
-- group_invites: Invitation system with status tracking
-- matches: Game records linked to groups and courses
-- teams: Match participants with scores
-- team_players: Individual players on teams
-- courses: Golf course data with ratings
-- notifications: In-app notification system
```

**Key Database Functions**:
```sql
-- Auto-create profile on user signup
CREATE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call it
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update timestamps
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

##### Row Level Security (RLS) Patterns

**Pattern 1: User-Owned Data**
```sql
-- User can only see/modify their own data
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
```

**Pattern 2: Membership-Based Access**
```sql
-- User can access data if they're a member
CREATE POLICY "Members can view group"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

-- Helper functions for cleaner policies
CREATE FUNCTION is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = _group_id AND user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Pattern 3: Public Read Access**
```sql
-- Anyone can read (but not modify)
CREATE POLICY "Public profiles are viewable"
ON profiles_public FOR SELECT
USING (true);
```

**Pattern 4: Bi-Directional Relationships (Friendships)**
```sql
-- User can see friendships where they're either party
CREATE POLICY "Users can view own friendships"
ON friendships FOR SELECT
USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);
```

##### Secure Operations

**Email Lookup via RPC** (hides emails from frontend):
```sql
-- Function that searches by email server-side
CREATE FUNCTION search_user_by_email(search_email TEXT)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM profiles
  WHERE email = search_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Frontend Usage**:
```typescript
const { data, error } = await supabase
  .rpc('search_user_by_email', { search_email: email });
```

##### Custom Hook Pattern
```typescript
// Standard structure I use for all data hooks

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      toast.success('Profile updated');
      await fetchProfile(); // Refresh data
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };
  
  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
```

##### Mobile Deployment (Capacitor)

**Setup**:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
npx cap add ios
```

**capacitor.config.ts**:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.yourprojectid',
  appName: 'Your App Name',
  webDir: 'dist',
  // For development only - remove for production builds:
  server: {
    url: 'https://your-preview-url.lovableproject.com',
    cleartext: true
  }
};

export default config;
```

**iOS Safe Area Handling**:
```css
/* In index.css */
.pt-safe {
  padding-top: max(env(safe-area-inset-top, 0px), 44px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* When using bottom navigation, add pb-20 to main content */
```

**iOS Deployment Checklist**:
1. Remove `server` block from capacitor.config.ts
2. `npm run build`
3. `npx cap sync ios`
4. Open Xcode: `npx cap open ios`
5. Set destination to "Any iOS Device (arm64)"
6. Product > Archive
7. Distribute App > App Store Connect
8. Handle Export Compliance (select "No" for standard HTTPS)
9. TestFlight: Add testers via External Testing groups
10. App Store: Fill metadata, upload screenshots, submit

**Bundle ID Consistency**:
- Use the same Bundle ID everywhere: capacitor.config.ts, Apple Developer certificates, App Store Connect
- Format: `app.lovable.yourprojectid`

---

## Section 5: Reusable Code Templates

### File Structure
```text
src/
  hooks/          # Custom data hooks (useAuth, useProfile, useFriends, etc.)
  components/     # UI components organized by feature
    auth/         # Authentication components
    groups/       # Group-related components
    matches/      # Match-related components
    navigation/   # Nav components (BottomNav, etc.)
    ui/           # Shadcn UI components
  pages/          # Route-level page components
  integrations/   # Supabase client (auto-generated, don't edit)
  lib/            # Utility functions
  index.css       # Design system / CSS variables
supabase/
  migrations/     # Database migrations (read-only, managed by Lovable)
  config.toml     # Supabase config (auto-managed)
capacitor.config.ts  # Mobile app configuration
```

### Auth Context Pattern
```typescript
// src/hooks/useAuth.tsx

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... signUp, signIn, signOut implementations
  
  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Protected Route Pattern
```typescript
// Wrap authenticated-only routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

// Wrap public-only routes (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}
```

### Database Table Template
```sql
-- Standard table structure
CREATE TABLE public.your_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- Link to auth.users (not FK, just reference)
  
  -- Your columns here
  name TEXT NOT NULL,
  description TEXT,
  
  -- Standard timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS immediately
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own data"
ON public.your_table FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
ON public.your_table FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
ON public.your_table FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
ON public.your_table FOR DELETE
USING (auth.uid() = user_id);

-- Add timestamp trigger
CREATE TRIGGER update_your_table_updated_at
  BEFORE UPDATE ON public.your_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Mobile-Safe Layout CSS
```css
/* iOS Safe Area handling */
.pt-safe {
  padding-top: max(env(safe-area-inset-top, 0px), 44px);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* When using bottom navigation */
/* Add pb-20 to main content container to prevent overlap */
```

---

## Section 6: Current Project Template

> **Fill this in for each new project**

```markdown
## Current Project: [App Name]

This is App #[X] in my learning curriculum.

### Learning Objectives for This App:
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

### What This App Does:
[1-2 sentence description]

### Core Features (MVP):
1. Feature 1
2. Feature 2
3. Feature 3

### Success Criteria:
- [ ] App works on physical iOS device
- [ ] All learning objectives achieved
- [ ] Submitted to TestFlight
- [ ] Tested by 5+ people
- [ ] Submitted to App Store

### Technical Approach:
[Any specific technical decisions or patterns to use]
```

---

## Section 7: Quick Reference

### Lovable-Specific Notes
- Backend is called "Lovable Cloud" (runs on Supabase under the hood)
- Never edit: `src/integrations/supabase/client.ts`, `types.ts`, `supabase/config.toml`
- Database changes via migrations tool only
- Edge functions auto-deploy
- Use `@/integrations/supabase/client` for Supabase access

### Common Gotchas I've Encountered
1. **RLS blocking inserts**: Always set `user_id` in insert statements
2. **Nullable user_id**: If RLS uses user_id, it shouldn't be nullable
3. **Missing auth**: If tables have RLS, app must have authentication
4. **TestFlight stuck**: Check Export Compliance in App Store Connect
5. **Safe area issues**: Use pt-safe/pb-safe classes, not hardcoded values
6. **Bottom nav overlap**: Main content needs pb-20 with bottom navigation

### Key Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Capacitor sync (after git pull or build)
npx cap sync ios

# Open in Xcode
npx cap open ios

# Run on device/simulator
npx cap run ios
```

---

## Changelog

| Date | App | What I Added |
|------|-----|--------------|
| Jan 2026 | MyGolfApp | Initial document with auth, RLS, Capacitor patterns |

---

*Last updated: January 2026*
*Document version: 1.0*
