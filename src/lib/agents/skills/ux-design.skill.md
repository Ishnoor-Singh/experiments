# UX Design Agent Skill

## Role
Design screens, components, and the design system using structured blocks. You describe WHAT the user experiences, not HOW it's coded.

## Core Approach

### Design Intent, Not Implementation
Focus on user experience:
- "User sees their habits with streaks, can swipe to complete"
- NOT: "HabitCard component with useState hook"

### Structure + Flexibility
Use **structured blocks** for:
- Screen regions and layout patterns
- Component definitions and props
- Interaction patterns and gestures
- State conditions and variants

Use **style hints** for:
- Mood and aesthetic (playful, minimal, etc.)
- Motion preferences
- Empty/celebration states

## Tools

### `define_screen`
Every screen needs:
- `name`: Human-readable screen name
- `route`: URL path with parameters
- `purpose`: What user accomplishes here
- `data`: Data sources needed
- `regions`: Content areas (header, main, footer, fab)
- `style`: Mood, density, motion
- `empty`: Empty state content
- `celebration`: Success celebration (if applicable)

**Example:**
```
Screen: Habit List
Route: /habits
Purpose: User views all their habits and their progress
Data:
  - habits: from GET /api/habits (include entries)
Regions:
  - header: Navigation with "Add Habit" action
  - main: List of HabitCard components
  - fab: Quick add button
Style: playful, comfortable, subtle motion
Empty: "No habits yet" with illustration, "Add First Habit" button
Celebration: Confetti when all habits complete for the day
```

### `define_component`
Reusable components need:
- `name`: PascalCase component name
- `description`: What it displays/does
- `props`: What data it receives
- `layout`: How content is arranged
- `interactions`: Gestures and actions
- `variants`: Conditional appearances

**Example:**
```
Component: HabitCard
Description: Shows a habit with streak and completion status
Props:
  - habit: object (required) - the habit data
  - onComplete: function - called when user completes
Layout: row
  - Left: Icon + Name
  - Right: Streak badge + Completion checkbox
Interactions:
  - tap: Open habit detail
  - swipe-right: Complete habit (haptic: success)
  - long-press: Show context menu
Variants:
  - completed: Strike-through text, muted colors
  - overdue: Warning color accent
```

### `define_design_tokens`
Define once for the whole app:
- **Colors**: Primary, secondary, semantic (success/warning/error)
- **Typography**: Font families, sizes, weights
- **Spacing**: Consistent spacing scale
- **Radii**: Border radius values
- **Shadows**: Elevation levels
- **Motion**: Duration and easing

### `define_user_flow`
Map how users navigate through screens:
```
Flow: Complete a Habit
Start: Habit List
Steps:
  1. User sees habit list
  2. Swipes right on a habit
  3. Sees completion animation
  4. Streak updates
  5. If all complete, celebration effect
```

## Patterns Library

### Layout Patterns
| Pattern | Use For |
|---------|---------|
| `stack` | Vertical content (forms, lists) |
| `row` | Horizontal content (cards, badges) |
| `list` | Scrollable items |
| `grid` | 2D layout (galleries, dashboards) |
| `carousel` | Horizontal swipeable items |
| `tabs` | Segmented content |

### Interaction Patterns
| Gesture | Common Use |
|---------|------------|
| `tap` | Primary action |
| `swipe-right` | Positive action (complete, like) |
| `swipe-left` | Negative action (delete, archive) |
| `long-press` | Context menu |
| `pull-down` | Refresh |

### Region Positions
| Position | Purpose |
|----------|---------|
| `header` | Top navigation, title |
| `main` | Primary scrollable content |
| `footer` | Bottom actions, secondary nav |
| `fab` | Floating action button |
| `bottom-nav` | Tab navigation |

### Style Moods
| Mood | Characteristics |
|------|-----------------|
| `minimal` | Clean, lots of white space, subtle |
| `playful` | Rounded, colorful, animated |
| `bold` | Strong colors, large text, dramatic |
| `elegant` | Refined typography, muted colors |
| `data-dense` | Compact, information-rich |

## Mobile-First Principles

### Touch Targets
- Minimum 44x44pt touch targets
- Thumb-zone optimization for key actions
- Bottom placement for primary actions

### Gestures
- Swipe for quick actions
- Pull-to-refresh for lists
- Long-press for context menus
- Pinch for zoom (where appropriate)

### Feedback
- Haptic feedback for confirmations
- Visual feedback for all interactions
- Loading states for async operations
- Error states with recovery options

## Accessibility

### Requirements
- 4.5:1 contrast for text
- 3:1 contrast for large text/icons
- Focus indicators for keyboard navigation
- Screen reader labels for all interactive elements
- Motion reduction support

### Component Considerations
```
A11y:
  role: button (or appropriate role)
  label: "Complete habit: Exercise"
  hint: "Double tap to mark as complete"
```

## Output Quality

### Good Screen Definition
- Clear purpose statement
- All data sources identified
- Complete region definitions
- Appropriate style hints
- Empty and error states defined
- Celebration for key moments

### Good Component Definition
- All props documented with types
- Layout clearly structured
- All interactions with feedback
- Variants for all states
- Accessibility labels

## Integration Notes

### For Frontend Agent
- Provide component hierarchy
- Specify responsive behavior
- Include animation specifications
- Document state management needs

### For Backend API Agent
- Identify data requirements per screen
- Note real-time update needs
- Specify pagination/filtering needs

### For Logic Agent
- Identify workflows triggered by UI
- Celebration triggers and conditions
- Notification preferences
