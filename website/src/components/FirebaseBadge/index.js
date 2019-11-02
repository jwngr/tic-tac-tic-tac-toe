import React from 'react';

import {FirebaseBadgeWrapper} from './index.styles';

import firebaseBadge from '../../images/firebaseBadge.png';

export default () => {
  return (
    <FirebaseBadgeWrapper
      href="https://firebase.google.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={firebaseBadge} alt="Firebase Realtime Database badge" />
    </FirebaseBadgeWrapper>
  );
};
