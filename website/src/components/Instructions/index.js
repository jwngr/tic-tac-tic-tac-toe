import React from 'react';

import {InstructionsWrapper} from './index.styles';

export default () => {
  return (
    <InstructionsWrapper>
      <h2>How To Play</h2>
      <p>
        Login with either your GitHub or Twitter account to join that team. You and your teammates
        will each individually suggest your team's next move.
        <b>The most popular square will be your team's collective move!</b>
      </p>
      <p>
        Your goal is to win the big tic-tac-toe board by getting
        <b>three in a row</b> - either across, down, or diagonally - or getting a
        <b>majority of the squares in a full grid</b>. In order to earn one of the nine squares in
        the big board, you must win the smaller tic-tac-toe board contained within it.
      </p>
      <p>
        <b>Your opponent's previous move determines in which board(s) you are allowed to play</b>.
        For example, if your opponent chose the top right square of the center board, you would then
        have to choose an open square in the top right board.
      </p>
      <p>
        If your opponent's previous move would force you to play in a board which has already been
        won, you can select any open square on the whole board.
      </p>
      <p>
        The most recent move is shown in <span className="blue">blue</span>, your team's possible
        moves are shown in <span className="green">green</span>, the move you suggested for your
        team is shown in <span className="orange">orange</span>, and the team which is currently
        deciding which square to choose is shown in <span className="gold">yellow</span>. The
        numbers in individual squares represent how many people have voted for those squares.
      </p>
    </InstructionsWrapper>
  );
};
