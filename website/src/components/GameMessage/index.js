import React from 'react';

import {getProvider} from '../../lib/utils';

import {GameMessageWrapper} from './index.styles';

export default ({currentGame, loggedInUser}) => {
  let gameMessage;
  if (currentGame === null) {
    gameMessage = 'Loading current game state...';
  } else if (currentGame.winner) {
    let winningTeam = currentGame.winner === 'github' ? 'GitHub' : 'Twitter';
    gameMessage = `Team ${winningTeam} wins! A new game will start soon.`;
  } else {
    // Get the team whose turn it is and the logged-in user's team.
    var whoseTurnTeam = currentGame.whoseTurn === 'github' ? 'GitHub' : 'Twitter';

    if (loggedInUser === null) {
      // User is logged out.
      gameMessage = `Team ${whoseTurnTeam} is making a move.`;
    } else {
      var loggedInUsersTeam = getProvider(loggedInUser) === 'github' ? 'GitHub' : 'Twitter';

      if (whoseTurnTeam === loggedInUsersTeam) {
        // Logged-in user's team's turn.
        gameMessage = `Suggest a move for Team ${whoseTurnTeam}!`;
      } else {
        // Other team's turn.
        gameMessage = `Waiting for Team ${whoseTurnTeam} to make a move.`;
      }
    }
  }

  return <GameMessageWrapper>{gameMessage}</GameMessageWrapper>;
};
