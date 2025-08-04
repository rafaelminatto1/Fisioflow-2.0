import { lazyWithRetry, LazyWrapper } from '@/utils/performance';

// Lazy-loaded components for better code splitting and performance

// Main Dashboard Components
export const LazyDashboard = lazyWithRetry(
  () => import('@/pages/Dashboard'),
  'Dashboard'
);

export const LazyPatients = lazyWithRetry(
  () => import('@/pages/Patients'),
  'Patients'
);

export const LazyAppointments = lazyWithRetry(
  () => import('@/pages/Appointments'),
  'Appointments'
);

export const LazyReports = lazyWithRetry(
  () => import('@/pages/Reports'),
  'Reports'
);

export const LazySettings = lazyWithRetry(
  () => import('@/pages/Settings'),
  'Settings'
);

// Patient Portal Components
export const LazyPatientDashboard = lazyWithRetry(
  () => import('@/pages/patient/PatientDashboard'),
  'Patient Dashboard'
);

export const LazyPatientAppointments = lazyWithRetry(
  () => import('@/pages/patient/PatientAppointments'),
  'Patient Appointments'
);

export const LazyPatientDocuments = lazyWithRetry(
  () => import('@/pages/patient/PatientDocuments'),
  'Patient Documents'
);

export const LazyVoucherStore = lazyWithRetry(
  () => import('@/pages/patient/VoucherStore'),
  'Voucher Store'
);

// Partner Portal Components
export const LazyPartnerDashboard = lazyWithRetry(
  () => import('@/pages/partner/PartnerDashboard'),
  'Partner Dashboard'
);

export const LazyPartnerClients = lazyWithRetry(
  () => import('@/pages/partner/PartnerClients'),
  'Partner Clients'
);

export const LazyPartnerExercises = lazyWithRetry(
  () => import('@/pages/partner/PartnerExercises'),
  'Partner Exercises'
);

// Complex Components that benefit from lazy loading
export const LazyCalendar = lazyWithRetry(
  () => import('@/components/calendar/Calendar'),
  'Calendar'
);

export const LazyPatientForm = lazyWithRetry(
  () => import('@/components/forms/PatientForm'),
  'Patient Form'
);

export const LazyExerciseLibrary = lazyWithRetry(
  () => import('@/components/exercises/ExerciseLibrary'),
  'Exercise Library'
);

export const LazySOAPNoteEditor = lazyWithRetry(
  () => import('@/components/soap/SOAPNoteEditor'),
  'SOAP Note Editor'
);

export const LazyAnalyticsDashboard = lazyWithRetry(
  () => import('@/components/analytics/AnalyticsDashboard'),
  'Analytics Dashboard'
);

export const LazyAIAssistant = lazyWithRetry(
  () => import('@/components/AiAssistant'),
  'AI Assistant'
);

// Route wrapper components with proper loading states
export const DashboardRoute = () => (
  <LazyWrapper name="Dashboard" fallback={<DashboardSkeleton />}>
    <LazyDashboard />
  </LazyWrapper>
);

export const PatientsRoute = () => (
  <LazyWrapper name="Patients" fallback={<TableSkeleton />}>
    <LazyPatients />
  </LazyWrapper>
);

export const AppointmentsRoute = () => (
  <LazyWrapper name="Appointments" fallback={<CalendarSkeleton />}>
    <LazyAppointments />
  </LazyWrapper>
);

export const ReportsRoute = () => (
  <LazyWrapper name="Reports" fallback={<ReportsSkeleton />}>
    <LazyReports />
  </LazyWrapper>
);

export const SettingsRoute = () => (
  <LazyWrapper name="Settings" fallback={<SettingsSkeleton />}>
    <LazySettings />
  </LazyWrapper>
);

// Patient Portal Routes
export const PatientDashboardRoute = () => (
  <LazyWrapper name="Patient Dashboard" fallback={<PatientDashboardSkeleton />}>
    <LazyPatientDashboard />
  </LazyWrapper>
);

export const PatientAppointmentsRoute = () => (
  <LazyWrapper name="Patient Appointments" fallback={<PatientAppointmentsSkeleton />}>
    <LazyPatientAppointments />
  </LazyWrapper>
);

export const VoucherStoreRoute = () => (
  <LazyWrapper name="Voucher Store" fallback={<StoreSkeleton />}>
    <LazyVoucherStore />
  </LazyWrapper>
);

// Partner Portal Routes
export const PartnerDashboardRoute = () => (
  <LazyWrapper name="Partner Dashboard" fallback={<PartnerDashboardSkeleton />}>
    <LazyPartnerDashboard />
  </LazyWrapper>
);

export const PartnerClientsRoute = () => (
  <LazyWrapper name="Partner Clients" fallback={<ClientsSkeleton />}>
    <LazyPartnerClients />
  </LazyWrapper>
);

// Skeleton Components for Loading States
const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex space-x-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CalendarSkeleton = () => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-4 border-b">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="p-4 grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

const ReportsSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex space-x-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-32"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const SettingsSkeleton = () => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PatientDashboardSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const PatientAppointmentsSkeleton = () => (
  <div className="p-4 space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const StoreSkeleton = () => (
  <div className="p-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow animate-pulse">
          <div className="h-48 bg-gray-200 rounded-t-lg"></div>
          <div className="p-4 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PartnerDashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-48 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ClientsSkeleton = () => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);