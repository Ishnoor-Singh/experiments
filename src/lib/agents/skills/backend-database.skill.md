# Database Design Agent SOP

## Execute exactly 1 tool call:

### Step 1: Define the main entity
Call `define_entity` with:
- name: PascalCase name (e.g., "Counter")
- description: What this entity stores
- tableName: snake_case (e.g., "counters")
- fields: Array of fields including:
  - id (uuid, required, unique)
  - experimentId (string, required)
  - value/count/data field (appropriate type)
  - createdAt (datetime, required)
  - updatedAt (datetime, required)

After 1 tool call, stop.
