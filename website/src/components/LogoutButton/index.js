import React from 'react';

import {LogoutButtonWrapper} from './index.styles';

import {db, auth} from '../../lib/loadFirebase';
import {getProvider} from '../../lib/utils';

const rootRef = db.ref();
const loggedInUsersRef = rootRef.child('loggedInUsers');

class LogoutButton extends React.Component {
  logoutUser = () => {
    const {loggedInUser, setErrorMessage} = this.props;

    return loggedInUsersRef
      .child(`${getProvider(loggedInUser)}/${loggedInUser.uid}`)
      .remove()
      .then(() => auth.signOut())
      .then(() => {
        // Clear the username stored in local storage.
        localStorage.removeItem('loggedInUsername');
      })
      .catch((error) => {
        setErrorMessage(`Failed to sign out user from Firebase: ${error.message}`);
      });
  };

  render() {
    const {loggedInUser, initialAuthStateFetched} = this.props;

    if (!initialAuthStateFetched || loggedInUser === null) {
      return null;
    }

    return <LogoutButtonWrapper onClick={this.logoutUser}>Logout</LogoutButtonWrapper>;
  }
}

export default LogoutButton
