import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Views from './Views'
import { ThemeProvider } from '@mui/material/styles';

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Theme from './theme';
import theme from './theme';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Views.Home />,
  },
  {
    path: "/signin",
    element: <Views.SignIn />,
  },
  {
    path: "/initialize",
    element: <Views.Initialize />,
  },
  {
    path: "*",
    element: <Views.NotMatch />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
function Root() {
  const [currentTheme, setCurrentTheme] = React.useState(theme.theme());
  theme.listenToThemeModeChange(() => setCurrentTheme(theme.theme()));
  return <ThemeProvider theme={currentTheme}>
    <RouterProvider router={router} />
  </ThemeProvider>
}
root.render(
  <Root></Root>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
