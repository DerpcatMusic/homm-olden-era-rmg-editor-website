# RMG Editor Web

A modern web-based editor for Heroes of Might & Magic Olden Era RMG (Random Map Generator) templates. This application provides an intuitive graphical interface for creating, editing, and validating map templates used by the Heroes of Might & Magic map generation system.

## Features

### Core Functionality
- **Visual Template Editor**: Interactive canvas-based editing with drag-and-drop zone placement
- **Zone Management**: Create, edit, and configure map zones with custom properties
- **Connection Editor**: Define connections between zones with configurable parameters
- **Content Browser**: Browse and manage game content for placement rules
- **Rule Builder**: Create complex placement rules for content distribution
- **Real-time Validation**: Instant feedback on template validity and potential issues
- **Export/Import**: Full support for RMG JSON template files

### User Interface
- **Responsive Design**: Works on desktop and tablet devices
- **Dark/Light Themes**: Customizable appearance with multiple theme options
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Undo/Redo**: Complete history management for all operations
- **Zoom Controls**: Precise canvas navigation and scaling
- **Status Indicators**: Real-time feedback on file status and memory usage

### Technical Features
- **TypeScript**: Fully typed codebase for better development experience
- **Modular Architecture**: Clean separation of concerns with service layers
- **Event-Driven**: Reactive updates using a custom event bus system
- **State Management**: Centralized state with history tracking
- **Validation Engine**: Comprehensive template validation with detailed error reporting

## Project Structure

```
rmg-editor-web/
├── src/
│   ├── components/
│   │   ├── core/           # Core editor components
│   │   │   ├── CanvasEditor.ts
│   │   │   ├── CanvasStatusBar.ts
│   │   │   ├── CanvasToolbar.ts
│   │   │   ├── ConnectionEditor.ts
│   │   │   ├── ZoneEditor.ts
│   │   │   └── ZoneManager.ts
│   │   ├── dialogs/        # Modal dialogs
│   │   │   ├── ContentBrowser.ts
│   │   │   └── RuleBuilder.ts
│   │   └── ui/             # UI components
│   │       ├── PropertyPanel.ts
│   │       ├── Sidebar.ts
│   │       └── ValidationPanel.ts
│   ├── models/             # Data models and schemas
│   │   ├── rmg.ts
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── services/           # Business logic services
│   │   ├── ExportService.ts
│   │   ├── FileService.ts
│   │   ├── GameDataService.ts
│   │   └── ValidationService.ts
│   ├── store/              # State management
│   │   ├── EventBus.ts
│   │   ├── HistoryManager.ts
│   │   └── StateManager.ts
│   ├── utils/              # Utility functions
│   │   ├── constants.ts
│   │   ├── geometry.ts
│   │   └── validation.ts
│   ├── App.ts              # Main application class
│   └── main.ts             # Application entry point
├── styles.css              # Main stylesheet
├── index.html              # Main HTML file
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rmg-editor-web
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

### Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:web` - Build for web deployment
- `npm run start` - Run the compiled application
- `npm run serve` - Serve the built application
- `npm run dev` - Start development server with hot reload
- `npm run dev:web` - Development server for web version
- `npm run test` - Run test suite
- `npm run clean` - Clean build artifacts

## Usage

### Creating a New Template
1. Click the "New" button in the header or press `Ctrl+N`
2. Configure basic template settings in the property panel
3. Add zones by clicking the "+" button in the sidebar
4. Position zones on the canvas by dragging
5. Create connections between zones
6. Add content placement rules
7. Validate and save your template

### Loading Existing Templates
1. Click "Open" or press `Ctrl+O`
2. Select an RMG JSON file from your computer
3. The template will load and display on the canvas

### Editing Zones
- Select a zone by clicking on it
- Use the property panel to modify zone settings
- Drag to reposition zones
- Right-click for context menu options

### Managing Connections
- Click the "Add Connection" button
- Select source and target zones
- Configure connection properties
- Use the connection editor for advanced settings

### Validation
- Click "Validate" to check template integrity
- Review validation results in the validation panel
- Fix any reported issues before exporting

## Architecture

### Component Architecture
The application follows a component-based architecture with clear separation of concerns:

- **Core Components**: Handle the main editing functionality (CanvasEditor, ZoneManager, etc.)
- **UI Components**: Manage user interface elements (Sidebar, PropertyPanel, etc.)
- **Dialog Components**: Handle modal interactions (ContentBrowser, RuleBuilder)
- **Services**: Contain business logic (ValidationService, ExportService, etc.)
- **Store**: Manage application state (StateManager, HistoryManager, EventBus)

### State Management
The application uses a centralized state management system with:
- **StateManager**: Central state store
- **HistoryManager**: Undo/redo functionality
- **EventBus**: Decoupled communication between components

### Data Flow
1. User interactions trigger events through the EventBus
2. Components update the StateManager
3. State changes propagate to affected components
4. UI updates reflect the new state

## API Reference

### Core Classes

#### App
Main application class that initializes and coordinates all components.

#### CanvasEditor
Handles canvas rendering and user interactions for zone and connection editing.

#### ZoneManager
Manages zone creation, editing, and validation.

#### ValidationService
Provides comprehensive template validation with detailed error reporting.

### Services

#### FileService
Handles file operations including import/export of RMG templates.

#### ExportService
Manages template export functionality with various output formats.

#### GameDataService
Provides access to game content data for content placement.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write unit tests for new functionality
- Ensure code passes linting and validation

## Testing

Run the test suite with:
```bash
npm test
```

Tests are located in the `src/` directory alongside the code they test, with the `.test.ts` extension.

## Deployment

### Web Deployment
1. Build the project: `npm run build:web`
2. Deploy the `dist/` directory to your web server
3. Ensure the server supports CORS for API calls

### Static Hosting
The application can be hosted on any static file server. No server-side processing is required.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Heroes of Might & Magic community for the inspiration
- Open source contributors and maintainers
- Font Awesome for icons
- Google Fonts for typography

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Join the community discussions

---

**Version:** 1.0.0
**Last Updated:** 2024
**Authors:** RMG Editor Development Team