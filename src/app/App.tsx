import { RouterProvider } from 'react-router';
import { AppProvider } from './context/AppContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}