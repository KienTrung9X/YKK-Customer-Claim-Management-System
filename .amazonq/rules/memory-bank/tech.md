# Technology Stack

## Programming Languages
- **TypeScript 5.8.2**: Primary language for type-safe development
- **JavaScript (ES Modules)**: Module system
- **CSS**: Styling

## Frontend Framework
- **React 19.2.0**: UI library with functional components and hooks
- **React DOM 19.2.0**: React rendering for web

## Build System
- **Vite 6.2.0**: Fast build tool and development server
- **@vitejs/plugin-react 5.0.0**: React support for Vite

## Key Dependencies

### AI & Backend
- **@google/genai 1.28.0**: Google Gemini AI integration
- **@supabase/supabase-js 2.39.0**: Supabase backend client

### Visualization
- **recharts 3.3.0**: Chart and data visualization library
- **reactflow 11.11.3**: Interactive node-based diagrams (Fishbone/Ishikawa)

### Development Tools
- **@types/node 22.14.0**: Node.js type definitions

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)
- Strict type checking enabled
- ES module support
- React JSX transformation

### Vite Configuration (`vite.config.ts`)
- React plugin configuration
- Development server settings
- Build optimization

### Environment Configuration (`.env.local`)
- `GEMINI_API_KEY`: Required for AI features

## Development Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Starts Vite development server with hot module replacement

### Build for Production
```bash
npm run build
```
Creates optimized production build

### Preview Production Build
```bash
npm run preview
```
Serves production build locally for testing

## Project Configuration

### Package Information
- **Name**: ykk-customer-claim-management-system
- **Version**: 0.0.0
- **Type**: ES Module
- **Private**: true

## External Services

### Supabase
- Backend database for data persistence
- Authentication and user management
- Real-time subscriptions
- File storage

### Google Gemini AI
- Natural language processing
- Root cause analysis assistance
- Intelligent recommendations
- Pattern recognition

## Development Environment

### Prerequisites
- Node.js (latest LTS recommended)
- npm (comes with Node.js)
- Gemini API key from Google AI Studio

### Setup Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Configure `.env.local` with `GEMINI_API_KEY`
4. Run development server: `npm run dev`
5. Access application at local development URL

## Browser Support
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)

## Module System
- ES Modules (ESM) throughout
- Import/export syntax
- Tree-shaking enabled for optimal bundle size
