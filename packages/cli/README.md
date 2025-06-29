# Elevo CLI

Command-line interface for Elevo state machine visualization and development tools.

## Installation

```bash
npm install -g elevo-cli
```

## Usage

### Start State Machine Visualizer

```bash
# Watch current directory for *.state.ts files
elevo graph

# Watch specific directory
elevo graph ./src/states

# Specify custom port
elevo graph --port 8081

# Disable file watching (one-time scan)
elevo graph --no-watch

# Disable server (cache only)
elevo graph --no-server
```

## Features

- **File Watching**: Automatically detects changes in `*.state.ts` files
- **Caching**: Stores state machine JSON in `node_modules/elevo/.cache/`
- **Real-time Updates**: Streams updates to visualizer via WebSocket
- **History**: Keeps cache history for debugging and rollback
- **Token Security**: Uses secure tokens for WebSocket communication

## Cache Management

The CLI automatically manages cache files:

- `node_modules/elevo/.cache/latest.json` - Current state
- `node_modules/elevo/.cache/[timestamp].json` - Historical snapshots
- Automatically cleans old cache files (keeps last 10)

## Integration

The CLI works seamlessly with:

- **Elevo Visualizer**: Real-time web-based visualization
- **Development Tools**: IDE integration and debugging
- **CI/CD**: State machine validation and documentation

## State File Format

Create `*.state.ts` files using the Elevo DSL:

```typescript
import { createMachine } from 'elevo';

export const myMachine = createMachine("myMachine", (ctx) => {
  const { state, on } = ctx;
  
  return [
    state("idle", () => [on("START", "running")]),
    state("running", () => [on("STOP", "idle")])
  ];
});
```

## WebSocket API

The CLI exposes a WebSocket server for real-time communication:

- **Port**: 8080 (default)
- **Protocol**: WebSocket with JSON messages
- **Authentication**: Token-based security

### Message Format

```typescript
interface VisualizerMessage {
  type: 'state_update' | 'initial_data' | 'error';
  data: StateFileInfo[] | string;
  token: string;
  timestamp: number;
}
```

## Troubleshooting

### No State Machines Found

1. Ensure files end with `.state.ts`
2. Check file contains exported state machine
3. Verify TypeScript syntax is valid

### Connection Issues

1. Check port availability (default: 8080)
2. Verify firewall settings
3. Check WebSocket connection in browser console

### Cache Issues

1. Clear cache: `rm -rf node_modules/elevo/.cache`
2. Restart CLI with fresh scan
3. Check file permissions in project directory