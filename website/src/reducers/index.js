import {combineReducers} from 'redux';

import * as actions from '../actions';

const initialState = {
  currentGame: null,
  errorMessage: null,
  loggedInUser: null,
  numSecondsUntilNextMove: null,
  initialAuthStateFetched: false,
};

const rootReducers = {
  loggedInUser: (state = initialState.loggedInUser, action) => {
    switch (action.type) {
      case actions.SET_LOGGED_IN_USER:
        return action.user;
      default:
        return state;
    }
  },

  initialAuthStateFetched: (state = initialState.initialAuthStateFetched, action) => {
    switch (action.type) {
      case actions.SET_LOGGED_IN_USER:
        return true;
      default:
        return state;
    }
  },

  currentGame: (state = initialState.currentGame, action) => {
    switch (action.type) {
      case actions.SET_CURRENT_GAME:
        return action.currentGame;
      default:
        return state;
    }
  },

  numSecondsUntilNextMove: (state = initialState.numSecondsUntilNextMove, action) => {
    switch (action.type) {
      case actions.SET_TIMER:
        return action.numSecondsUntilNextMove;
      default:
        return state;
    }
  },

  errorMessage: (state = initialState.errorMessage, action) => {
    switch (action.type) {
      case actions.SET_ERROR_MESSAGE:
        return action.errorMessage;
      case actions.SET_LOGGED_IN_USER:
        return null;
      default:
        return state;
    }
  },
};

const createRootReducer = () =>
  combineReducers({
    ...rootReducers,
  });

export default createRootReducer;
