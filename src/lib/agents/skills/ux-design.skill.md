# UX Design Agent SOP

## Execute exactly 4 tool calls:

### Step 1: Design Tokens
Call `define_design_tokens` with:
- colorPrimary: A primary color hex
- colorSecondary: A secondary color hex
- colorBackground: Background color
- colorSurface: Surface color
- colorText: Text color
- fontFamily: "Inter, system-ui, sans-serif"
- borderRadius: "8px"

### Step 2: Main Screen
Call `define_screen` with:
- name: "MainScreen"
- route: "/"
- purpose: Brief description
- dataSources: Array of data needed
- regions: { header: {...}, main: {...} }
- styleMood: "clean, minimal"

### Step 3: First Component
Call `define_component` with:
- name: The main interactive component
- description: What it does
- props: Required props
- layoutPattern: "centered"
- interactions: Key interactions

### Step 4: Second Component
Call `define_component` with:
- name: A supporting component (button, display, etc.)
- description: What it does
- props: Required props
- layoutPattern: The layout
- interactions: Key interactions

After 4 tool calls, stop.
