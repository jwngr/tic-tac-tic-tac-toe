import thunk from 'redux-thunk';
import {applyMiddleware, compose, createStore} from 'redux';

import createRootReducer from '../reducers';

// Middleware.
const middleware = [thunk];
if (process.env.NODE_ENV !== 'production') {
  const {logger} = require('redux-logger');
  middleware.push(logger);
}

// Store.
export default function configureStore(preloadedState) {
  const store = createStore(
    createRootReducer(),
    preloadedState,
    compose(applyMiddleware(...middleware))
  );

  return store;
}
