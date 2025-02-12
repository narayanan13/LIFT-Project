import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from '@auth0/auth0-react';

const url = "https://lifthome20.vercel.app/home";
// const url = "http://localhost:3000/home";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Auth0Provider
    domain="dev-unvq3qurpapcwc35.us.auth0.com"
    clientId="C3q12Q1iNHtt4Onn2vCphnlj7Xllceej"
    authorizationParams={{
      redirect_uri: url,
    }}
  >
    <React.StrictMode>
      <App />
      <Analytics />
    </React.StrictMode>
  </Auth0Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
