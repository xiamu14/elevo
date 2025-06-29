# Elevo

**Elevo** is a modern, TypeScript-first state machine library designed specifically for React applications. It combines the power of state machines with functional programming patterns, reactive state management, and real-time visualization tools.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Valtio](https://img.shields.io/badge/Valtio-FF6B6B?style=for-the-badge&logo=javascript&logoColor=white)](https://valtio.pmnd.rs/)

## Why Elevo?

While libraries like Redux, Zustand, and Valtio solve state storage and reactivity, they don't address the fundamental challenge of **modeling complex business logic**. That's where state machines shine - and Elevo makes them accessible, type-safe, and delightful to use.

### The Problem

```tsx
// Traditional approach - imperative and error-prone
const [state, setState] = useState('idle');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSave = async () => {
  if (state !== 'editing') return; // Easy to forget these guards
  setLoading(true);
  try {
    await saveDocument();
    setState('saved');
  } catch (err) {
    setError(err);
    setState('error');
  } finally {
    setLoading(false);
  }
};
```

### The Elevo Solution

```tsx
// Elevo approach - declarative and bulletproof
const editorMachine = createMachine("editor", (ctx) => {
  const { state, on } = ctx;
  return [
    state("idle", () => [on("EDIT", "editing")]),
    state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
    state("saving", () => [on("SUCCESS", "idle"), on("FAILURE", "editing")]),
  ];
});

const EditorComponent = () => {
  const { current, currentState } = useMachine(editorMachine);
  
  return (
    <Show when={current === "editing"}>
      <button onClick={() => currentState.transition("SAVE")}>
        Save Document
      </button>
    </Show>
  );
};
```

## Key Features

### 🚀 **Functional-First DSL**
Clean, composable syntax with excellent TypeScript inference
```tsx
const machine = createMachine("workflow", (ctx) => {
  const { state, on } = ctx;
  return [
    state("pending", () => [on("START", "active")]),
    state("active", () => [on("COMPLETE", "done")])
  ];
});
```

### 🎯 **Complete Type Safety**
TypeScript knows exactly which events are valid for each state
```tsx
machine.can("pending", "START"); // ✅ true
machine.can("pending", "COMPLETE"); // ✅ false
machine.currentState.transition("START"); // ✅ Auto-completion
```

### 🔄 **Dual Context System**
Separate global and private contexts for better organization
```tsx
// Global context - set once, immutable
machine.setGlobalOnly({ userId: "123", theme: "dark" });

// Private context - state-specific, mutable
machine.currentState.transition("EDIT", { fileName: "doc.md" });
```

### ⚡ **Reactive Integration**
Seamless integration with Valtio for reactive updates
```tsx
const { current, context, globalContext } = useMachine(editorMachine);
// Automatically re-renders when state changes
```

### 📊 **Real-Time Visualization**
Live state machine visualization during development
```bash
elevo graph ./src
# Opens interactive visualizer at http://localhost:3000
```

### 🧪 **Pure Side Effects**
Clean separation between state logic and side effects
```tsx
// Pure state machine
const machine = createMachine("async", (ctx) => { /* ... */ });

// Side effects handled separately
machine.watchEntry("loading", async (context) => {
  const data = await fetchData();
  machine.currentState.transition("SUCCESS", data);
});
```

## Quick Start

### Installation

```bash
npm install elevo elevo-react
npm install -g elevo-cli  # For visualization
```

### Basic Usage

```tsx
import { createMachine } from 'elevo';
import { useMachine, Show } from 'elevo-react';

// 1. Create a state machine
const toggleMachine = createMachine("toggle", (ctx) => {
  const { state, on } = ctx;
  return [
    state("off", () => [on("TOGGLE", "on")]),
    state("on", () => [on("TOGGLE", "off")])
  ];
});

// 2. Use in React
function ToggleButton() {
  const { current, currentState } = useMachine(toggleMachine);
  
  return (
    <button onClick={() => currentState.transition("TOGGLE")}>
      <Show when={current === "on"}>Turn Off</Show>
      <Show when={current === "off"}>Turn On</Show>
    </button>
  );
}
```

### Start Visualization

```bash
elevo graph ./src
```

Visit `http://localhost:3000` to see your state machines visualized in real-time!

## Architecture

Elevo promotes a **multi-level state architecture** that scales with your application:

- **Application Level**: Global concerns (auth, theme, routing)
- **Page Level**: Route-specific workflows (document editing, search)
- **Component Level**: UI interactions (modals, forms, drag & drop)

```tsx
// Application level
const authMachine = createMachine("auth", (ctx) => { /* ... */ });

// Page level  
const documentWorkflow = createMachine("document", (ctx) => { /* ... */ });

// Component level
const modalMachine = createMachine("modal", (ctx) => { /* ... */ });
```

## Comparison with Other Libraries

| Feature | Elevo | XState | Zag.js |
|---------|--------|---------|---------|
| **TypeScript Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Bundle Size** | ~15KB | ~45KB | ~8KB |
| **Learning Curve** | Gentle | Steep | Moderate |
| **Visualization** | Real-time CLI | Online tool | Basic |
| **React Integration** | First-class | Excellent | Good |
| **Side Effects** | Separated | Built-in | Service-based |

### When to Choose Elevo

- ✅ Building React applications with complex state logic
- ✅ You want excellent TypeScript support out of the box
- ✅ Real-time visualization during development is important
- ✅ You prefer functional programming patterns
- ✅ You need clean separation between state logic and side effects

### When to Choose XState

- ✅ Building enterprise applications with complex requirements
- ✅ You need full SCXML compliance and hierarchical states
- ✅ Maximum correctness and validation is critical
- ✅ Working with multiple frameworks

### When to Choose Zag.js

- ✅ Building headless UI component libraries
- ✅ Framework-agnostic solutions are required
- ✅ You need a lightweight solution

## Packages

This repository is a monorepo containing several packages:

### Core Packages

- **[`elevo`](./packages/core)** - Core state machine engine
- **[`elevo-react`](./packages/elevo-react)** - React integration with Valtio
- **[`elevo-cli`](./packages/cli)** - Command-line visualization tools

### Development Packages

- **[`elevo-visualizer`](./packages/visualizer)** - Web-based state machine visualizer
- **[`elevo-docs`](./packages/doc)** - Documentation site

### Examples

- **[`examples`](./packages/example)** - Example applications and state machines

## Documentation

📚 **[Read the full documentation](./packages/doc)** for comprehensive guides, API reference, and advanced patterns.

### Key Documentation Sections

- **[Getting Started](./packages/doc/content/docs/getting-started.mdx)** - Quick setup and first state machine
- **[Core Concepts](./packages/doc/content/docs/concepts.mdx)** - Understanding Elevo's architecture
- **[Unique Characteristics](./packages/doc/content/docs/characteristics.mdx)** - What makes Elevo special
- **[Comparison Guide](./packages/doc/content/docs/comparison.mdx)** - How Elevo compares to XState and Zag.js
- **[Architecture](./packages/doc/content/docs/architecture.mdx)** - Design philosophy and patterns
- **[API Reference](./packages/doc/content/docs/api.mdx)** - Complete API documentation

## Real-World Example

Here's a more complex example showing document editing workflow:

```tsx
const editorMachine = createMachine("editor", (ctx) => {
  const { state, on } = ctx;
  return [
    state("loading", () => [on("LOADED", "viewing"), on("ERROR", "error")]),
    state("viewing", () => [on("EDIT", "editing"), on("DELETE", "deleting")]),
    state("editing", () => [on("SAVE", "saving"), on("CANCEL", "viewing")]),
    state("saving", () => [on("SUCCESS", "viewing"), on("FAILURE", "editing")]),
    state("deleting", () => [on("CONFIRMED", "deleted"), on("CANCELLED", "viewing")]),
    state("deleted", () => [on("RESTORE", "viewing")]),
    state("error", () => [on("RETRY", "loading")])
  ];
});

// Set global context
editorMachine.setGlobalOnly({ userId: "user-123", permissions: ["read", "write"] });

// Handle side effects
editorMachine.watchEntry("saving", async (context) => {
  try {
    await saveDocument(context);
    editorMachine.currentState.transition("SUCCESS");
  } catch (error) {
    editorMachine.currentState.transition("FAILURE", { error });
  }
});

function DocumentEditor() {
  const { current, context, globalContext, currentState } = useMachine(editorMachine);
  
  return (
    <div>
      <h1>Document Editor - {current}</h1>
      <Show when={current === "editing"}>
        <button onClick={() => currentState.transition("SAVE", { content: "..." })}>
          Save Document
        </button>
      </Show>
    </div>
  );
}
```

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/elevo.git
cd elevo

# Install dependencies
npm install

# Build all packages
npm run build

# Start development with visualization
npm run dev
elevo graph ./packages/example
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Run the test suite
6. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Community

- **Documentation**: [docs.elevo.dev](https://docs.elevo.dev)
- **GitHub**: [github.com/your-org/elevo](https://github.com/your-org/elevo)
- **Discord**: [discord.gg/elevo](https://discord.gg/elevo)
- **Twitter**: [@elevo_dev](https://twitter.com/elevo_dev)

---

**Elevo** - Elevating state management from simple reducers to sophisticated, visual state machines that make complex application logic both understandable and maintainable.

*Built with ❤️ by the Elevo team*