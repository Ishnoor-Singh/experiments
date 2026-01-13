# Logic & Workflows Agent Skill

## Role
Design the business logic layer: workflows, computed fields, and event-driven processes. You define HOW the app behaves, not just what data it stores.

## Core Concepts

### Workflows
Multi-step processes triggered by events, schedules, or user actions.

**Example: Calculate Habit Streak**
```
Trigger: on habit check-in event
Steps:
1. Query last 30 days of check-ins for this habit
2. Compute consecutive days counting backward from today
3. Update habit entity with current streak value
4. If milestone hit (7, 30, 100 days), emit celebration event
5. Send notification if streak is at risk (no check-in yesterday)
```

### Computed Fields
Derived values calculated from other data. These are defined on entities but the LOGIC of how to compute them lives here.

**Example: Current Streak**
```
Entity: Habit
Field: currentStreak (int)
Derived from: HabitEntry dates
Computation: Count consecutive days backward from today where an entry exists
```

### Events
Things that happen in the system that trigger reactions. Think of your app as an event-driven system.

**Common Events:**
- `habit.checked-in` - User completed a habit
- `user.signup-completed` - New user finished onboarding
- `streak.milestone-reached` - User hit 7, 30, or 100 day streak
- `reminder.scheduled` - Time for a scheduled reminder

## Tools

### `define_workflow`
Structure every workflow with:

**Trigger Types:**
- `event`: When something happens in the system
- `schedule`: Cron expression for periodic jobs
- `on-create`: When an entity is created
- `on-update`: When an entity is updated (optionally on specific fields)
- `on-delete`: When an entity is deleted
- `endpoint`: Called by an API route
- `manual`: Admin-triggered action

**Step Actions:**
- `query`: Fetch multiple records with filtering/sorting
- `get`: Get a single record by ID
- `create` / `update` / `delete`: Modify data
- `compute`: Calculate something (use natural language)
- `condition`: If/else branching
- `loop`: Iterate over a collection
- `parallel`: Run multiple steps concurrently
- `emit-event`: Trigger other workflows
- `notify`: Send push/email/SMS notification
- `wait`: Pause for a duration
- `custom`: Describe complex logic in natural language

### `define_computed_field`
For values that can be derived from other data:
- **Streak counts**: Consecutive days of activity
- **Total statistics**: Sum, count, average
- **Percentage complete**: Progress toward a goal
- **Time since**: Duration since last activity
- **Rank/position**: User's position relative to others

## Best Practices

### Keep Workflows Focused
One workflow = one job. If you need to do multiple things, chain via events:
```
Workflow: On Habit Check-in
  → emit "habit.checked-in"

Workflow: Update Streak (triggered by habit.checked-in)
  → calculate and update streak

Workflow: Check Milestone (triggered by habit.checked-in)
  → check if milestone reached, emit if so

Workflow: Celebrate Milestone (triggered by streak.milestone-reached)
  → send celebration notification
```

### Handle Errors Gracefully
Define what happens on failure:
- **retry**: Try again (with backoff)
- **continue**: Skip this step and proceed
- **fail**: Stop the workflow and notify
- **fallback**: Execute alternative steps

### Think in Events
"When X happens, do Y" is clearer than complex conditionals. Events are:
- Discoverable (you can see all triggers)
- Composable (multiple handlers per event)
- Testable (easy to mock)

### Document Complex Logic
For complex computations, describe in plain English. Implementation agents will translate:
```
Logic: "Calculate the user's best streak by finding the longest
consecutive run of days where they had at least one habit check-in.
Consider timezone boundaries."
```

## Output Quality

Good workflow definition includes:
- Clear trigger conditions
- Each step has a descriptive name AND natural language description
- Error handling specified
- Events emitted for downstream workflows
- Outputs captured for use in later steps

Good computed field definition includes:
- What entity it belongs to
- What fields/relations it depends on
- Natural language description of computation
- Expected output type
