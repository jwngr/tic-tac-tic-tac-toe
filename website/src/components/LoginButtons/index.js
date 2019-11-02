import React from 'react';

import {
  ErrorMessage,
  LoginButtonsWrapper,
  GitHubLoginButton,
  TwitterLoginButton,
} from './index.styles';

import firebase, {auth} from '../../lib/loadFirebase';

import gitHubLogo from '../../images/gitHubLogo.png';
import twitterLogo from '../../images/twitterLogo.png';

class LogoutButton extends React.Component {
  state = {
    errorMessage: null,
  };

  loginUser = (providerId) => {
    const provider =
      providerId === 'twitter'
        ? new firebase.auth.TwitterAuthProvider()
        : new firebase.auth.GithubAuthProvider();

    auth
      .signInWithPopup(provider)
      .then((user) => {
        // The only time to grab the username is upon initial sign in, so store it in local storage
        // so it persists beyond page reload.
        localStorage.setItem('loggedInUsername', user.additionalUserInfo.username);
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.message,
        });
      });
  };

  render() {
    const {errorMessage} = this.state;
    const {loggedInUser, initialAuthStateFetched} = this.props;

    if (!initialAuthStateFetched || loggedInUser !== null) {
      return null;
    }

    return (
      <>
        <LoginButtonsWrapper>
          <GitHubLoginButton onClick={() => this.loginUser('github')}>
            <img src={gitHubLogo} alt="GibHub logo" />
            <p>Join Team GitHub</p>
          </GitHubLoginButton>
          <TwitterLoginButton onClick={() => this.loginUser('twitter')}>
            <img src={twitterLogo} alt="Twitter logo" />
            <p>Join Team Twitter</p>
          </TwitterLoginButton>
        </LoginButtonsWrapper>
        {errorMessage && <ErrorMessage>Failed to sign in: {errorMessage}</ErrorMessage>}
      </>
    );
  }
}

export default LogoutButton;
