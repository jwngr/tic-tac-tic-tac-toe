import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ThemeProvider} from 'styled-components';

import App from './components/App';
import './index.css';

import theme from './resources/theme.json';
import * as serviceWorker from './serviceWorker';
import configureStore from './lib/configureStore';
import {subscribeToCurrentGame, listenForAuthStateChanges} from './actions';

// Load fonts
require('typeface-norwester');
require('typeface-clear-sans');

// Create the Redux store.
const store = configureStore();

// Hook up the auth state change listener and Firebase listeners to the Redux store.
store.dispatch(subscribeToCurrentGame());
store.dispatch(listenForAuthStateChanges());

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <Provider store={store}>
      <App />
    </Provider>
  </ThemeProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
