
import * as ReactRouterDOM from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { ErrorBoundaryProvider } from './components/ErrorBoundaryProvider';
import AppDebug from './App.debug';

const App = () => {
  // Debug mode for troubleshooting white screen - works in production too
  const isDebugMode = (
    window.location.search.includes('debug=true') || 
    localStorage.getItem('fisioflow_debug') === 'true'
  );
  
  if (isDebugMode) {
    return <AppDebug />;
  }

  return (
    <ErrorBoundaryProvider>
      <ReactRouterDOM.HashRouter>
        <AppRoutes />
      </ReactRouterDOM.HashRouter>
    </ErrorBoundaryProvider>
  );
};

export default App;