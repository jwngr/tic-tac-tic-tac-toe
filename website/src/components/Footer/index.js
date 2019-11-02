import React from 'react';

import {FooterWrapper, GitHubButton} from './index.styles';

export default () => {
  // GitHub (from https://github.com/mdo/github-buttons) and Twitter buttons.

  return (
    <FooterWrapper href="https://firebase.google.com" target="_blank" rel="noopener noreferrer">
      <GitHubButton
        src="./github-btn.html?user=jwngr&repo=tic-tac-tic-tac-toe&type=fork&size=large"
        allowtransparency="true"
        frameborder="0"
        scrolling="0"
        width="80"
        height="30"
      ></GitHubButton>
      <GitHubButton
        src="./github-btn.html?user=jwngr&repo=tic-tac-tic-tac-toe&type=follow&size=large"
        allowtransparency="true"
        frameborder="0"
        scrolling="0"
        width="157"
        height="30"
      ></GitHubButton>
      <a
        href="https://twitter.com/share"
        className="twitter-share-button"
        data-text="Tic-tac-toe with a multiplayer twist"
        data-via="_jwngr"
        data-size="large"
        data-related="firebase"
        data-dnt="true"
      >
        Tweet
      </a>
    </FooterWrapper>
  );
};
