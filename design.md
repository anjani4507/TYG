# FlowFocus App - Mobile Interface Design

## Overview

FlowFocus is a high-performance competitive focus mobile application that emphasizes flow state, accountability, and real-time synchronization. Users can create focus sessions, join groups, and compete with others in real-time to maintain accountability and maximize productivity.

---

## Screen List

### Authentication Screens
1. **Login Screen** — Email/social OAuth login with branding
2. **Signup Screen** — Create account with profile setup
3. **Profile Setup** — Set display name and avatar

### Core Application Screens
4. **Home Screen** — Dashboard with quick-start session, active groups, and stats
5. **Session Timer Screen** — Active focus session with timer, intensity tracking, and group presence
6. **Session History Screen** — Past sessions with duration, intensity, and notes
7. **Groups Screen** — Browse and manage focus groups
8. **Group Detail Screen** — Group members, leaderboard, and active sessions
9. **Create Group Screen** — Set up new focus group
10. **Settings Screen** — Profile, notifications, theme, and account management

---

## Primary Content and Functionality

### 1. Login Screen
- **Content**: Email input, social OAuth buttons (Apple, Google), signup link
- **Functionality**: Authenticate user, store session token securely
- **Layout**: Centered form, full-width buttons, branding at top

### 2. Home Screen
- **Content**: 
  - Welcome header with user name
  - "Start Focus Session" CTA button
  - Active groups carousel (horizontal scroll)
  - Quick stats: Total hours, sessions completed, current streak
  - Recent sessions list (last 5)
- **Functionality**: Quick session start, navigate to groups, view stats
- **Layout**: ScrollView with sections, card-based design

### 3. Session Timer Screen
- **Content**:
  - Large countdown timer (MM:SS format)
  - Session subject/goal input
  - Intensity slider (1-10)
  - Current group members (real-time presence)
  - Pause/Resume/End buttons
  - Group chat/presence indicator
- **Functionality**: Track focus time, broadcast presence, update intensity, end session
- **Layout**: Full-screen, timer centered, controls at bottom, presence list scrollable

### 4. Groups Screen
- **Content**:
  - Search/filter bar
  - List of joined groups with member count
  - "Create Group" button
  - Group cards showing: name, members, active sessions
- **Functionality**: Browse groups, join new groups, create groups
- **Layout**: FlatList with card items, sticky header

### 5. Group Detail Screen
- **Content**:
  - Group name and description
  - Member list with presence status (Active/Idle/Offline)
  - Active sessions list
  - Leaderboard (top performers this week)
  - "Start Session" button
- **Functionality**: View group info, see live presence, start session with group
- **Layout**: ScrollView with tabs/sections

### 6. Settings Screen
- **Content**:
  - Profile section: name, email, avatar
  - Preferences: theme (light/dark), notifications
  - Account: logout, delete account
- **Functionality**: Update profile, change settings, logout
- **Layout**: Grouped list with sections

---

## Key User Flows

### Flow 1: Start a Focus Session
1. User taps "Start Focus Session" on Home
2. Session Timer Screen opens
3. User enters session subject (optional)
4. User adjusts intensity slider
5. Timer starts counting down
6. Real-time presence broadcast to group
7. User pauses/resumes or ends session
8. Session saved with stats (duration, intensity, subject)

### Flow 2: Join a Group
1. User navigates to Groups tab
2. User searches or scrolls through groups
3. User taps group card
4. Group Detail Screen shows members and active sessions
5. User taps "Join Group" button
6. User is added to group members
7. User can now start sessions within this group

### Flow 3: Monitor Group Presence
1. User starts a focus session in a group
2. Session Timer Screen shows group members
3. Real-time presence updates show who is active, idle, or offline
4. User sees other members' intensity levels
5. Competitive element drives accountability

---

## Color Choices

| Element | Color | Usage |
|---------|-------|-------|
| **Primary** | `#0066FF` (Vibrant Blue) | CTAs, active states, progress bars |
| **Background** | `#FFFFFF` (Light) / `#0F1419` (Dark) | Screen backgrounds |
| **Surface** | `#F5F7FA` (Light) / `#1A1E27` (Dark) | Cards, elevated surfaces |
| **Foreground** | `#1A1A1A` (Light) / `#FFFFFF` (Dark) | Primary text |
| **Muted** | `#666666` (Light) / `#AAAAAA` (Dark) | Secondary text |
| **Success** | `#22C55E` (Green) | Session complete, presence active |
| **Warning** | `#F59E0B` (Amber) | Idle status, low intensity |
| **Error** | `#EF4444` (Red) | Offline status, session ended |
| **Border** | `#E5E7EB` (Light) / `#334155` (Dark) | Dividers, card borders |

---

## Design Principles

1. **Flow State First**: Minimal distractions, large touch targets, clear visual hierarchy
2. **Real-time Feedback**: Instant presence updates, live member counts, competitive indicators
3. **Accountability**: Visible group presence, leaderboards, session history
4. **One-handed Usage**: All interactive elements within thumb reach, bottom-aligned controls
5. **Dark Mode Support**: Full dark mode implementation with proper contrast ratios
6. **Accessibility**: Clear labels, sufficient color contrast, haptic feedback for actions

---

## Technical Considerations

- **State Management**: Zustand for global app state (auth, sessions, groups, presence)
- **Real-time Sync**: Supabase Realtime for presence updates and group broadcasts
- **Database**: Supabase PostgreSQL with RLS policies for data security
- **Navigation**: Expo Router with tab-based navigation
- **Styling**: NativeWind (Tailwind CSS) for responsive design
- **Performance**: Memoized components, optimized re-renders, efficient list rendering
