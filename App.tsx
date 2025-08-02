
import * as ReactRouterDOM from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { ErrorBoundaryProvider } from './components/ErrorBoundaryProvider';

const App = () => {
  return (
    <ErrorBoundaryProvider>
      <ReactRouterDOM.HashRouter>
        <AppRoutes />
      </ReactRouterDOM.HashRouter>
    </ErrorBoundaryProvider>
  );
};

export default App;