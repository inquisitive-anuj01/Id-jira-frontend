import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';
import './index.css';
import queryClient from './lib/queryClient.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        style={{ zIndex: 99999 }}
        toastStyle={{
          background: '#1E1E1E',
          border: '1px solid #2E2E2E',
          color: '#fff',
          borderRadius: '10px',
          fontSize: '13px',
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
