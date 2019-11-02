import React from 'react';

import {GameBoardWrapper} from './index.styles';

import Stats from './Stats/container';
import UberGrid from './UberGrid/container';

import {db} from '../../lib/loadFirebase';

const rootRef = db.ref();
const winsRef = rootRef.child('wins');
const eventsRef = rootRef.child('events');
const loggedInUsersRef = rootRef.child('loggedInUsers');

class GameBoard extends React.Component {
  state = {
    wins: null,
    events: [],
    loggedInUserCounts: {
      github: 0,
      twitter: 0,
    },
  };

  componentDidMount = () => {
    const {setErrorMessage} = this.props;

    // Subscribe to new events.
    this.eventsChildAddedListener = eventsRef.limitToLast(50).on('child_added', (eventSnap) => {
      this.setState(({events}) => {
        if (events.length === 50) {
          events.pop();
        }

        return {
          events: [
            {
              key: eventSnap.key,
              ...eventSnap.val(),
            },
            ...events,
          ],
        };
      });
    }, (error) => setErrorMessage(`Failed to subscribe to events in Firebase: ${error.message}`));

    // Subscribe to the wins node.
    this.winsValueListener = winsRef.on('value', (winsSnap) => {
      this.setState({
        wins: winsSnap.val(),
      });
    }, (error) => setErrorMessage(`Failed to subscribe to win in Firebase: ${error.message}`));

    // Keep track of the number of logged in users.
    this.gitHubChildAddedListener = loggedInUsersRef.child('github').on('child_added', () => {
      this.setState(({loggedInUserCounts}) => ({
        loggedInUserCounts: {
          ...loggedInUserCounts,
          github: loggedInUserCounts.github + 1,
        },
      }));
    }, (error) => setErrorMessage(`Failed to subscribe to GitHub logged in users (child_added) in Firebase: ${error.message}`));
    this.gitHubChildRemovedListener = loggedInUsersRef.child('github').on('child_removed', () => {
      this.setState(({loggedInUserCounts}) => ({
        loggedInUserCounts: {
          ...loggedInUserCounts,
          github: loggedInUserCounts.github - 1,
        },
      }));
    }, (error) => setErrorMessage(`Failed to subscribe to GitHub logged in users (child_removed) in Firebase: ${error.message}`));
    this.twitterChildAddedListener = loggedInUsersRef.child('twitter').on('child_added', () => {
      this.setState(({loggedInUserCounts}) => ({
        loggedInUserCounts: {
          ...loggedInUserCounts,
          twitter: loggedInUserCounts.twitter + 1,
        },
      }));
    }, (error) => setErrorMessage(`Failed to subscribe to Twitter logged in users (child_added) in Firebase: ${error.message}`));
    this.twitterChildRemovedListener = loggedInUsersRef.child('twitter').on('child_removed', () => {
      this.setState(({loggedInUserCounts}) => ({
        loggedInUserCounts: {
          ...loggedInUserCounts,
          twitter: loggedInUserCounts.twitter - 1,
        },
      }));
    }, (error) => setErrorMessage(`Failed to subscribe to Twitter logged in users (child_removed) in Firebase: ${error.message}`));
  };

  componentWillUnmount = () => {
    winsRef.off('value', this.winsValueListener);
    eventsRef.off('child_added', this.eventsChildAddedListener);
    loggedInUsersRef.child('github').off('child_added', this.gitHubChildAddedListener);
    loggedInUsersRef.child('github').off('child_removed', this.gitHubChildRemovedListener);
    loggedInUsersRef.child('twitter').off('child_added', this.twitterChildAddedListener);
    loggedInUsersRef.child('twitter').off('child_removed', this.twitterChildRemovedListener);
  };

  render() {
    const {currentGame} = this.props;
    const {wins, events, loggedInUserCounts} = this.state;

    if (currentGame === null || wins === null) {
      return null;
    }

    return (
      <GameBoardWrapper>
        <UberGrid />
        <Stats wins={wins} events={events} loggedInUserCounts={loggedInUserCounts} />
        <div style={{clear: 'both'}}></div>
      </GameBoardWrapper>
    );
  }
}

export default GameBoard;
