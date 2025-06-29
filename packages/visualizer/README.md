# Elevo Visualizer

Real-time web-based visualization for Elevo state machines.

## Features

- **Real-time Updates**: Automatically reflects changes from CLI
- **Interactive Graphs**: Zoom, pan, and explore state machines
- **Multiple Machines**: Switch between different state machines
- **State Information**: View transitions, events, and metadata
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

1. **Start the CLI**:
   ```bash
   elevo graph ./src
   ```

2. **Open Visualizer**:
   Navigate to `http://localhost:3000?token=<your-token>`
   
   The token is displayed in the CLI output.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Components

- **Sidebar**: Lists all detected state machines
- **Graph**: Interactive visualization using React Flow
- **Connection Status**: Shows CLI connection state
- **State Node**: Custom node component for states

### Real-time Communication

The visualizer connects to the CLI via WebSocket:

1. **Initial Connection**: Receives current state machines
2. **File Changes**: Real-time updates when files change
3. **Error Handling**: Automatic reconnection on disconnect

### Graph Layout

- **Algorithm**: Dagre hierarchical layout
- **Node Types**: State nodes with custom styling
- **Edge Types**: Smooth step connections with labels
- **Interactive**: Zoom, pan, minimap, and controls

## Configuration

### URL Parameters

- `token`: Authentication token from CLI
- `server`: Custom WebSocket server URL (default: ws://localhost:8080)

### Environment Variables

- `VITE_WS_URL`: Override WebSocket URL
- `VITE_DEFAULT_TOKEN`: Default token for development

## Customization

### Themes

The visualizer uses TailwindCSS for styling:

- Modify `tailwind.config.js` for theme changes
- Custom node styles in `StateNode.tsx`
- Graph colors in `StateMachineGraph.tsx`

### Layout

Customize graph layout in `graphLayout.ts`:

```typescript
g.setGraph({
  rankdir: 'TB',    // Top to bottom
  align: 'UL',      // Upper left alignment
  nodesep: 50,      // Node separation
  ranksep: 100,     // Rank separation
});
```

### Node Appearance

Customize state nodes:

- Initial state styling (green border)
- Transition labels and counts
- Hover effects and selection

## Integration

### IDE Plugins

The visualizer can be embedded in:

- VS Code extensions
- JetBrains IDEs
- Vim/Neovim plugins

### CI/CD

Use for documentation generation:

```bash
# Generate static visualization
elevo graph --no-watch --export-html
```

### Custom Applications

Embed the visualizer:

```tsx
import { StateMachineGraph } from 'elevo-visualizer';

function MyApp() {
  return (
    <StateMachineGraph 
      stateInfo={stateInfo}
      onNodeClick={handleNodeClick}
    />
  );
}
```

## Troubleshooting

### Connection Issues

1. **Check CLI**: Ensure CLI is running and accessible
2. **Token Mismatch**: Verify token in URL matches CLI output
3. **Port Conflicts**: CLI default port is 8080
4. **Firewall**: Check WebSocket connections are allowed

### Performance

1. **Large Graphs**: Use React Flow's viewport optimization
2. **Many Machines**: Sidebar virtualizes long lists
3. **Real-time Updates**: Debounced to prevent excessive renders

### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **WebSocket Support**: Required for real-time features
- **SVG Support**: Needed for graph rendering