# Development Guidelines

## Code Quality Standards

### File Headers and Comments
- Use descriptive comments at the top of files to explain purpose (e.g., `// FIX: Create the ClaimDetail component...`)
- Avoid excessive inline comments; prefer self-documenting code
- Use JSDoc-style comments for complex functions when necessary

### Naming Conventions
- **Components**: PascalCase (e.g., `ClaimDetail`, `ReportSection`, `InfoItem`)
- **Functions/Variables**: camelCase (e.g., `handleChange`, `editableClaim`, `isGeneratingReport`)
- **Constants**: camelCase for local, UPPER_SNAKE_CASE for global (e.g., `maxSize`)
- **Enums**: PascalCase for enum names and values (e.g., `UserRole.Admin`, `ClaimStatus.New`)
- **Interfaces**: PascalCase (e.g., `User`, `Claim`, `FishboneAnalysisData`)
- **Service Objects**: camelCase with 'Service' suffix (e.g., `databaseService`, `aiService`, `notificationService`)
- **Event Handlers**: Prefix with 'handle' (e.g., `handleSave`, `handleFileAdd`, `handleNavigate`)
- **Boolean Variables**: Prefix with 'is', 'can', 'has' (e.g., `isEditable`, `canEditAnything`, `hasPermission`)

### Code Formatting
- Use 4-space indentation consistently
- Place opening braces on same line for functions and conditionals
- Use template literals for string interpolation
- Prefer arrow functions for callbacks and functional components
- Use destructuring for props and object properties
- Keep lines under 120 characters when possible

### TypeScript Standards
- Always define explicit types for function parameters and return values
- Use interfaces for object shapes, enums for fixed value sets
- Leverage union types for multiple possible types (e.g., `'success' | 'error' | 'info'`)
- Use type assertions sparingly; prefer type guards
- Define types in centralized `types.ts` file for reusability

## React Component Patterns

### Component Structure
```typescript
// 1. Imports (React, types, components, services, utilities)
import React, { useState, useEffect } from 'react';
import { Type1, Type2 } from '../types';
import { ChildComponent } from './ChildComponent';
import { someService } from '../services/someService';

// 2. Sub-components (if small and specific to parent)
const SubComponent: React.FC<Props> = ({ prop1, prop2 }) => (
    <div>...</div>
);

// 3. Main component
export const MainComponent: React.FC<Props> = ({ prop1, onAction }) => {
    // 3a. State declarations
    const [state1, setState1] = useState<Type>(initialValue);
    
    // 3b. Effects
    useEffect(() => {
        // effect logic
    }, [dependencies]);
    
    // 3c. Event handlers
    const handleEvent = () => {
        // handler logic
    };
    
    // 3d. Render helpers
    const renderSection = () => {
        // render logic
    };
    
    // 3e. Return JSX
    return (
        <div>...</div>
    );
};
```

### State Management
- Use `useState` for local component state
- Use `useEffect` for side effects and data loading
- Lift state up when multiple components need access
- Use functional updates when new state depends on previous state:
  ```typescript
  setEditableClaim(prev => ({ ...prev, [name]: value }))
  ```
- Initialize state with proper types: `useState<Type>(initialValue)`

### Props Patterns
- Define props inline with `React.FC<{ prop: Type }>` for simple components
- Extract to interface for complex props
- Use destructuring in function parameters
- Provide default values when appropriate
- Pass callbacks for child-to-parent communication

### Conditional Rendering
- Use ternary operators for simple conditions: `{condition ? <A /> : <B />}`
- Use logical AND for conditional display: `{condition && <Component />}`
- Use early returns for complex conditions
- Use switch statements for multiple status-based renders

### Event Handling
- Prefix handlers with 'handle' (e.g., `handleSave`, `handleChange`)
- Use inline arrow functions sparingly; prefer defined handlers
- Prevent default behavior explicitly when needed: `e.preventDefault()`
- Stop propagation when necessary: `e.stopPropagation()`
- Handle async operations with try-catch blocks

## Service Layer Patterns

### Service Object Structure
```typescript
export const serviceName = {
    async methodName(params: Type): Promise<ReturnType> {
        try {
            // Implementation
            return result;
        } catch (error) {
            console.error('Error message:', error);
            throw error;
        }
    }
};
```

### Database Service Patterns
- Use snake_case for database column names, camelCase in application
- Transform data between database and application formats:
  ```typescript
  // DB to App
  avatarUrl: user.avatar_url
  
  // App to DB
  avatar_url: user.avatarUrl
  ```
- Always handle errors with try-catch
- Return typed data using type assertions: `as User[]`
- Use async/await for all database operations
- Fetch related data and join in application layer

### AI Service Patterns
- Construct detailed prompts with structured data
- Sanitize input data before sending to AI
- Use template literals for multi-line prompts
- Handle API errors gracefully with user-friendly messages
- Check for API key availability before making requests
- Use environment variables for API keys: `process.env.API_KEY`

### Error Handling
- Always wrap async operations in try-catch blocks
- Log errors to console with descriptive messages
- Show user-friendly error notifications
- Throw errors for caller to handle when appropriate
- Provide fallback values for failed operations

## State Update Patterns

### Immutable Updates
```typescript
// Object updates
setObject(prev => ({ ...prev, field: newValue }))

// Nested object updates
setObject(prev => ({
    ...prev,
    nested: { ...prev.nested, field: newValue }
}))

// Array additions
setArray(prev => [...prev, newItem])

// Array filtering
setArray(prev => prev.filter((item, index) => index !== removeIndex))

// Array mapping
setArray(prev => prev.map(item => item.id === targetId ? updatedItem : item))
```

### Async State Updates
```typescript
const handleAsyncAction = async () => {
    setLoading(true);
    try {
        const result = await service.method();
        setState(result);
        showToast('Success message', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error message', 'error');
    } finally {
        setLoading(false);
    }
};
```

## UI/UX Patterns

### Styling Conventions
- Use Tailwind CSS utility classes
- Support dark mode with `dark:` prefix
- Use semantic color names: `text-gray-800 dark:text-gray-100`
- Apply hover states: `hover:bg-gray-50 dark:hover:bg-gray-700`
- Use transitions for smooth interactions: `transition-opacity duration-300`
- Maintain consistent spacing with Tailwind spacing scale

### Loading States
- Show loading indicators during async operations
- Disable buttons during loading: `disabled={isLoading}`
- Use spinner icons for visual feedback
- Provide loading text: `{isLoading ? 'Loading...' : 'Action'}`

### Form Patterns
- Use controlled components with value and onChange
- Disable inputs based on permissions: `readOnly={!canEdit}`
- Provide placeholder text for guidance
- Use appropriate input types (textarea, select, checkbox)
- Handle file uploads with proper validation

### Notification Patterns
- Use toast notifications for user feedback
- Provide success, error, and info variants
- Auto-dismiss after appropriate duration (2-4 seconds)
- Show detailed error messages for failures
- Use Vietnamese language for user-facing messages

## Permission and Security

### Permission Checks
```typescript
const canEdit = permissionService.canEditField(currentUser, claim);

{canEdit && (
    <button onClick={handleEdit}>Edit</button>
)}

<input readOnly={!canEdit} />
```

### Role-Based Access
- Check permissions before rendering sensitive UI
- Disable actions user cannot perform
- Show appropriate error messages for unauthorized actions
- Use permission service for centralized logic

## Data Validation

### File Upload Validation
```typescript
const maxSize = 2 * 1024 * 1024; // 2MB
const oversizedFiles = files.filter(f => f.size > maxSize);

if (oversizedFiles.length > 0) {
    notificationService.notify(`File too large: ${oversizedFiles.map(f => f.name).join(', ')}`, { type: 'error' });
    return;
}
```

### Input Validation
- Validate required fields before submission
- Check data types and formats
- Provide clear error messages
- Prevent invalid state updates

## Performance Optimization

### Code Splitting
- Use `React.lazy()` for route-based code splitting
- Wrap lazy components in `<Suspense>` with fallback
- Load heavy components only when needed

### Memoization
- Use `useMemo` for expensive computations
- Use `useCallback` for callback stability
- Avoid premature optimization

### Data Loading
- Load data on mount with `useEffect`
- Use `Promise.all()` for parallel requests
- Show loading states during data fetch
- Handle errors gracefully

## Common Code Idioms

### Conditional Class Names
```typescript
className={`base-classes ${condition ? 'conditional-classes' : 'alternative-classes'}`}
```

### Dynamic Styles Based on Data
```typescript
const getStatusStyles = (status: ClaimStatus) => {
    switch (status) {
        case ClaimStatus.New: return 'bg-blue-100 text-blue-800';
        case ClaimStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};
```

### Array Mapping with Keys
```typescript
{items.map((item, index) => (
    <div key={`${item.id}-${index}`}>
        {item.name}
    </div>
))}
```

### Async Data Loading Pattern
```typescript
useEffect(() => {
    loadData();
}, []);

const loadData = async () => {
    try {
        const [data1, data2] = await Promise.all([
            service1.getData(),
            service2.getData()
        ]);
        setState1(data1);
        setState2(data2);
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        setLoading(false);
    }
};
```

### Modal Pattern
```typescript
{isModalOpen && (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
            {/* Modal content */}
            <button onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
    </div>
)}
```

## Testing and Debugging

### Console Logging
- Use descriptive log messages
- Log important state changes
- Log errors with context
- Remove debug logs before production

### Error Boundaries
- Wrap components in error boundaries for graceful failures
- Provide fallback UI for errors
- Log errors for debugging

## Internationalization

### Language Support
- Use Vietnamese for user-facing text
- Use English for code and technical terms
- Maintain consistent terminology
- Support bilingual content where appropriate

## Best Practices Summary

1. **Type Safety**: Always use TypeScript types and interfaces
2. **Immutability**: Never mutate state directly; use spread operators
3. **Error Handling**: Wrap async operations in try-catch blocks
4. **Permissions**: Check user permissions before rendering/enabling actions
5. **Loading States**: Show feedback during async operations
6. **Validation**: Validate user input before processing
7. **Code Splitting**: Use lazy loading for better performance
8. **Consistent Naming**: Follow established naming conventions
9. **Service Layer**: Keep business logic in services, not components
10. **User Feedback**: Provide clear notifications for all actions
