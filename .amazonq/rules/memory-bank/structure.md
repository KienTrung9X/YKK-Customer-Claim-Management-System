# Project Structure

## Directory Organization

```
YKK-Customer-Claim-Management-System/
├── components/          # React UI components
├── context/            # React context providers
├── data/               # Mock data and fixtures
├── services/           # Business logic and external integrations
├── utils/              # Utility functions and helpers
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
├── index.tsx           # Application entry point
└── index.css           # Global styles
```

## Core Components

### UI Components (`/components`)
- **ClaimDetail.tsx**: Detailed view of individual claims with 8D report sections
- **ClaimsBoard.tsx**: Kanban-style board for claim status visualization
- **Dashboard.tsx**: Main dashboard with metrics and overview
- **CreateClaimModal.tsx**: Form for creating new claims
- **IshikawaDiagram.tsx**: Fishbone diagram visualization for root cause analysis
- **TraceabilitySection.tsx**: Traceability analysis interface
- **TraceabilityModal.tsx**: Modal for detailed traceability data entry
- **CommentSection.tsx**: Commenting system for collaboration
- **ReportsPage.tsx**: Report generation and viewing
- **ReportModal.tsx**: Custom report creation interface
- **SettingsPage.tsx**: Application settings and configuration
- **NotificationBell.tsx**: Real-time notification display
- **Layout.tsx**: Application layout wrapper
- **Toast.tsx**: Toast notification component
- **Loading.tsx**: Loading state indicator
- **Icons.tsx**: SVG icon components

### Context Providers (`/context`)
- **ThemeContext.tsx**: Theme management (light/dark mode)

### Services Layer (`/services`)
- **databaseService.ts**: Data persistence and retrieval operations
- **aiService.ts**: Gemini AI integration for intelligent analysis
- **activityService.ts**: User activity tracking
- **notificationService.ts**: Notification management
- **emailService.ts**: Email notification handling
- **permissionService.ts**: Role-based access control
- **storageService.ts**: File storage operations
- **supabaseClient.ts**: Supabase backend client configuration

### Data Layer (`/data`)
- **mockData.ts**: Sample data for development and testing

### Utilities (`/utils`)
- **time.ts**: Time formatting and manipulation helpers

## Architectural Patterns

### Component Architecture
- **Functional Components**: All components use React functional components with hooks
- **Component Composition**: Complex UIs built from smaller, reusable components
- **Props-based Communication**: Parent-child data flow through props
- **State Management**: Local state with useState, context for global state

### Service Layer Pattern
- **Separation of Concerns**: Business logic isolated in service modules
- **Single Responsibility**: Each service handles specific domain functionality
- **Async Operations**: Services handle all asynchronous data operations
- **Error Handling**: Centralized error handling in service layer

### Type Safety
- **TypeScript Throughout**: Full TypeScript implementation
- **Centralized Types**: All interfaces and enums in types.ts
- **Type Exports**: Types exported for use across application
- **Enum Usage**: Enums for fixed value sets (UserRole, ClaimStatus, ClaimSeverity)

### Data Flow
1. **User Interaction** → Component event handlers
2. **Component** → Service layer calls
3. **Service** → External APIs (Supabase, Gemini AI)
4. **Response** → Service processing
5. **Service** → Component state update
6. **State Change** → UI re-render

### Integration Points
- **Supabase**: Backend database and authentication
- **Gemini AI**: AI-powered analysis and recommendations
- **React Flow**: Interactive diagram visualization
- **Recharts**: Data visualization and charts

## Key Relationships

### Claim Management Flow
```
Dashboard → ClaimsBoard → ClaimDetail
                ↓
         CreateClaimModal
                ↓
         databaseService
```

### Analysis Flow
```
ClaimDetail → IshikawaDiagram → aiService
           → TraceabilitySection → databaseService
```

### Notification Flow
```
User Action → activityService → notificationService → NotificationBell
                              → emailService
```

### Permission Flow
```
User Login → permissionService → Component Access Control
```
