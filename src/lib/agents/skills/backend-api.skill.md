# API Design Agent SOP

## Execute exactly 3 tool calls:

### Step 1: GET endpoint
Call `define_endpoint` with:
- name: "get[Entity]s" (e.g., "getCounters")
- description: "Get all [entities] for this experiment"
- method: "GET"
- path: "/api/[entities]" (e.g., "/api/counters")
- auth: "authenticated"
- primaryEntity: The entity name

### Step 2: POST endpoint
Call `define_endpoint` with:
- name: "create[Entity]" (e.g., "createCounter")
- description: "Create a new [entity]"
- method: "POST"
- path: "/api/[entities]"
- auth: "authenticated"
- primaryEntity: The entity name

### Step 3: PUT endpoint
Call `define_endpoint` with:
- name: "update[Entity]" (e.g., "updateCounter")
- description: "Update an existing [entity]"
- method: "PUT"
- path: "/api/[entities]/:id"
- auth: "authenticated"
- primaryEntity: The entity name

After 3 tool calls, stop.
