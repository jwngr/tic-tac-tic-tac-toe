import {db, auth} from '../lib/loadFirebase';
import {getProvider} from '../lib/utils';

const rootRef = db.ref();
const infoConnectedRef = rootRef.child('.info/connected');
const loggedInUsersRef = rootRef.child('loggedInUsers');

let _infoConnectedListener;

export const SET_CURRENT_GAME = 'SET_CURRENT_GAME';
export function setCurrentGame(currentGame) {
  return {
    type: SET_CURRENT_GAME,
    currentGame,
  };
}

export const SET_TIMER = 'SET_TIMER';
export function setTimer(numSecondsUntilNextMove) {
  return {
    type: SET_TIMER,
    numSecondsUntilNextMove,
  };
}

export const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';
export function setErrorMessage(errorMessage) {
  return {
    type: SET_ERROR_MESSAGE,
    errorMessage,
  };
}

export const SET_LOGGED_IN_USER = 'SET_LOGGED_IN_USER';
export function setLoggedInUser(user) {
  return {
    type: SET_LOGGED_IN_USER,
    user,
  };
}

export function listenForAuthStateChanges() {
  return (dispatch) => {
    auth.onAuthStateChanged(
      (loggedInUser) => {
        dispatch(setLoggedInUser(loggedInUser));

        if (loggedInUser === null) {
          // Clean up the info connected listener.
          _infoConnectedListener && infoConnectedRef.off('value', _infoConnectedListener);
        } else {
          // Keep track of when the logged-in user in connected or disconnected.
          _infoConnectedListener = infoConnectedRef.on('value', (infoConnectedSnap) => {
            if (infoConnectedSnap.val() === true) {
              const loggedInUserProvider = getProvider(loggedInUser);

              // Remove the user from the logged-in users list when they get disconnected.
              var ref = loggedInUsersRef.child(`${loggedInUserProvider}/${loggedInUser.uid}`);
              ref.onDisconnect().remove();

              // Add the user to the logged-in users list when they get connected.
              var username = localStorage.getItem('loggedInUsername');
              ref
                .set({
                  username,
                  imageUrl: loggedInUser.providerData[0].photoURL,
                  userUrl:
                    loggedInUserProvider === 'github'
                      ? 'https://github.com/' + username
                      : 'https://twitter.com/' + username,
                })
                .catch((error) => {
                  dispatch(setErrorMessage(`Failed to add logged-in user to Firebase: ${error.message}`))
                });
            }
          });
        }
      },
      (error) => {
        dispatch(setErrorMessage(`Failed to establish auth state listener: ${error.message}`));
      }
    );
  };
}

export function subscribeToCurrentGame() {
  return (dispatch) => {
    let updateTimerInterval = null;
    let previousTimeOfNextMove = null;

    db.ref('.info/serverTimeOffset').on(
      'value',
      (serverTimeOffsetSnap) => {
        const serverTimeOffset = serverTimeOffsetSnap.val();

        db.ref('currentGame').on(
          'value',
          (currentGameSnap) => {
            const currentGame = currentGameSnap.val();
            dispatch(setCurrentGame(currentGame));

            if (currentGame.timeOfNextMove !== previousTimeOfNextMove) {
              // Clear the existing interval;
              clearInterval(updateTimerInterval);
              
              // Determine how much time until the next move.
              const numMillisecondsUntilNextMove =
                currentGame.timeOfNextMove - serverTimeOffset - Date.now();

              let numSecondsUntilNextMove = Math.ceil(numMillisecondsUntilNextMove / 1000);

              if (numSecondsUntilNextMove <= 0) {
                numSecondsUntilNextMove = 7;
              }

              // Set the initial timer value.
              dispatch(setTimer(numSecondsUntilNextMove));

              // Use a timeout to align the timer on the second exactly.
              setTimeout(() => {
                // Use an interval to decrement the timer every second.
                updateTimerInterval = setInterval(() => {
                  // Decrement the number of seconds until the next move
                  if (numSecondsUntilNextMove > 0) {
                    numSecondsUntilNextMove -= 1;
                  }

                  
                  // If the timer has hit zero, reset it and make a move for the current team
                  if (numSecondsUntilNextMove === 0) {
                    numSecondsUntilNextMove = 7;

                  }

                  // Update the timer.
                  dispatch(setTimer(numSecondsUntilNextMove));
                }, 1000);
              }, numMillisecondsUntilNextMove % 1000);
            }
          },
          (error) => {
            dispatch(setErrorMessage(`Failed to fetch current game state: ${error.message}`));
          }
        );
      },
      (error) => {
        dispatch(setErrorMessage(`Failed to fetch server time offset: ${error.message}`));
      }
    );
  };
}
