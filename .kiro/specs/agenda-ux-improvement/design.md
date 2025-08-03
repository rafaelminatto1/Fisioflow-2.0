# Design Document

## Overview

Este documento detalha o design da nova interface da agenda do Fisioflow 2.0, transformando-a em uma experiência moderna, intuitiva e profissional. O design é inspirado nas melhores práticas de calendários como Google Calendar, Outlook, e Calendly, adaptadas para o contexto clínico de fisioterapia.

## Architecture

### Component Structure

```
AgendaPage (Container)
├── AgendaHeader (Navigation & Controls)
│   ├── DateNavigator
│   ├── ViewModeSelector
│   ├── QuickActions
│   └── SearchAndFilters
├── AgendaToolbar (Secondary Controls)
│   ├── TodayButton
│   ├── MiniCalendar
│   └── FilterTags
├── AgendaGrid (Main Calendar View)
│   ├── TimeColumn
│   ├── CalendarHeader
│   └── CalendarBody
│       ├── DayColumn (Week/Day view)
│       ├── MonthGrid (Month view)
│       └── AppointmentCard (Enhanced)
├── QuickCreateModal (Inline Creation)
├── AppointmentDetailPopover (Quick View)
└── ContextMenu (Right-click Actions)
```

### State Management

```typescript
interface AgendaState {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  selectedAppointments: string[];
  filters: AgendaFilters;
  dragState: DragState | null;
  quickCreateData: QuickCreateData | null;
}

interface AgendaFilters {
  therapists: string[];
  appointmentTypes: AppointmentType[];
  statuses: AppointmentStatus[];
  searchQuery: string;
}
```

## Components and Interfaces

### 1. Enhanced AgendaHeader

**Visual Design:**
- Clean, modern header with subtle shadows and rounded corners
- Gradient background from white to light gray
- Consistent spacing using 8px grid system

**Features:**
- Smooth date navigation with keyboard shortcuts
- Animated view mode transitions
- Integrated search with autocomplete
- Filter chips with clear visual states

```typescript
interface AgendaHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSearch: (query: string) => void;
  filters: AgendaFilters;
  onFiltersChange: (filters: AgendaFilters) => void;
}
```

### 2. Modern Calendar Grid

**Visual Design:**
- Subtle grid lines with proper contrast ratios
- Hover states with smooth transitions
- Clear visual hierarchy between time slots and appointments
- Responsive breakpoints for different screen sizes

**Interaction Design:**
- Click to create appointments
- Drag to select time ranges
- Drag and drop to move appointments
- Resize handles for duration adjustment

```typescript
interface CalendarGridProps {
  appointments: Appointment[];
  viewMode: ViewMode;
  currentDate: Date;
  onAppointmentSelect: (appointment: Appointment) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentDrag: (appointmentId: string, newTime: Date) => void;
  onAppointmentResize: (appointmentId: string, newDuration: number) => void;
}
```

### 3. Enhanced AppointmentCard

**Visual Design:**
- Rounded corners with subtle shadows
- Color-coded left border for appointment types
- Status indicators with meaningful icons
- Improved typography hierarchy

**Information Architecture:**
- Primary: Patient name (bold, larger font)
- Secondary: Time range and appointment type
- Tertiary: Status and additional info
- Interactive elements: Quick actions on hover

```typescript
interface EnhancedAppointmentCardProps {
  appointment: Appointment;
  therapist: Therapist;
  patient: Patient;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onQuickEdit: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}
```

### 4. Month View Component

**Visual Design:**
- Clean grid layout with proper spacing
- Day numbers in consistent positions
- Appointment indicators as colored dots or bars
- Clear distinction between current month and adjacent months

**Features:**
- Appointment density indicators
- Overflow handling for busy days
- Quick preview on hover
- Smooth transitions between months

```typescript
interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}
```

### 5. Quick Create Modal

**Visual Design:**
- Floating modal with backdrop blur
- Minimal form with smart defaults
- Progressive disclosure for advanced options
- Clear visual feedback for validation

**UX Flow:**
1. Click on time slot opens quick create
2. Auto-fills date and time
3. Smart suggestions based on context
4. One-click save for simple appointments

```typescript
interface QuickCreateModalProps {
  isOpen: boolean;
  initialData: {
    date: Date;
    startTime: string;
    therapistId?: string;
  };
  onSave: (appointment: Partial<Appointment>) => void;
  onCancel: () => void;
  patients: Patient[];
  therapists: Therapist[];
}
```

## Data Models

### Enhanced Appointment Interface

```typescript
interface EnhancedAppointment extends Appointment {
  // Visual properties
  color: string;
  position: {
    top: number;
    height: number;
    left?: number;
    width?: number;
  };
  
  // Interaction states
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  
  // Quick actions
  quickActions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  isVisible: boolean;
}
```

### View Configuration

```typescript
interface ViewConfig {
  day: {
    startHour: number;
    endHour: number;
    timeSlotDuration: number; // minutes
    showAllDay: boolean;
  };
  week: {
    startDay: number; // 0 = Sunday
    workingDays: number[];
    showWeekends: boolean;
  };
  month: {
    showAdjacentMonths: boolean;
    maxAppointmentsPerDay: number;
    showWeekNumbers: boolean;
  };
}
```

## Error Handling

### Validation States

```typescript
interface ValidationState {
  conflicts: AppointmentConflict[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface AppointmentConflict {
  type: 'overlap' | 'double-booking' | 'outside-hours';
  message: string;
  severity: 'error' | 'warning';
  affectedAppointments: string[];
}
```

### Error Recovery

- Automatic conflict detection with visual indicators
- Undo/redo functionality for drag operations
- Graceful degradation for network issues
- Clear error messages with suggested actions

## Testing Strategy

### Unit Tests

1. **Component Rendering**
   - Test all view modes render correctly
   - Verify appointment positioning calculations
   - Check responsive behavior

2. **Interaction Logic**
   - Drag and drop functionality
   - Date navigation
   - Filter application

3. **Data Transformation**
   - Appointment positioning algorithms
   - Time zone handling
   - Recurring appointment generation

### Integration Tests

1. **User Workflows**
   - Create appointment flow
   - Edit appointment via drag
   - Filter and search functionality

2. **Performance Tests**
   - Large dataset rendering
   - Smooth animations
   - Memory usage optimization

### Accessibility Tests

1. **Keyboard Navigation**
   - Tab order and focus management
   - Keyboard shortcuts
   - Screen reader compatibility

2. **Visual Accessibility**
   - Color contrast ratios
   - Text scaling support
   - High contrast mode

## Design System Integration

### Color Palette

```css
:root {
  /* Primary Calendar Colors */
  --calendar-bg: #ffffff;
  --calendar-border: #e2e8f0;
  --calendar-hover: #f8fafc;
  
  /* Appointment Type Colors */
  --appointment-evaluation: #3b82f6;
  --appointment-session: #10b981;
  --appointment-return: #f59e0b;
  
  /* Status Colors */
  --status-scheduled: #6b7280;
  --status-completed: #059669;
  --status-cancelled: #dc2626;
  --status-no-show: #d97706;
  
  /* Interactive States */
  --hover-bg: #f1f5f9;
  --selected-bg: #dbeafe;
  --dragging-bg: #fef3c7;
}
```

### Typography Scale

```css
.calendar-text {
  /* Day numbers */
  --text-day-number: 1.125rem; /* 18px */
  
  /* Appointment titles */
  --text-appointment-title: 0.875rem; /* 14px */
  --text-appointment-subtitle: 0.75rem; /* 12px */
  
  /* Time labels */
  --text-time-label: 0.75rem; /* 12px */
  
  /* Headers */
  --text-header: 1rem; /* 16px */
}
```

### Animation Guidelines

```css
.calendar-transitions {
  /* Standard transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms ease-out;
  --transition-slow: 350ms ease-out;
  
  /* Specific animations */
  --appointment-hover: transform 150ms ease-out;
  --view-change: opacity 250ms ease-out;
  --drag-feedback: all 100ms ease-out;
}
```

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**
   - Implement for large time ranges
   - Render only visible appointments
   - Efficient memory management

2. **Memoization**
   - Cache appointment positioning calculations
   - Memoize expensive date operations
   - Optimize re-renders with React.memo

3. **Lazy Loading**
   - Load appointments on demand
   - Progressive enhancement for features
   - Code splitting for view components

### Responsive Design

```css
/* Mobile First Approach */
@media (max-width: 640px) {
  .agenda-grid {
    /* Stack view for mobile */
    grid-template-columns: 1fr;
  }
  
  .appointment-card {
    /* Larger touch targets */
    min-height: 44px;
  }
}

@media (min-width: 768px) {
  .agenda-grid {
    /* Multi-column for tablets */
    grid-template-columns: 80px 1fr;
  }
}

@media (min-width: 1024px) {
  .agenda-grid {
    /* Full desktop layout */
    grid-template-columns: 80px repeat(auto-fit, minmax(120px, 1fr));
  }
}
```

## Implementation Phases

### Phase 1: Core Visual Improvements
- Enhanced styling and layout
- Improved appointment cards
- Better responsive design

### Phase 2: Interaction Enhancements
- Drag and drop functionality
- Quick create modal
- Context menus

### Phase 3: Advanced Features
- Month view implementation
- Advanced filtering
- Performance optimizations

### Phase 4: Mobile Optimization
- Touch gesture support
- Mobile-specific UI patterns
- Progressive Web App features