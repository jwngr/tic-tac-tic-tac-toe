import firebase from 'firebase/app';

import firebaseConfig from './loadConfig';

require('firebase/auth');
require('firebase/database');

try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  // eslint-disable-next-line
  console.log('[ERROR] Failed to initialize Firebase:', error);
  // eslint-disable-next-line
  console.log(
    '[DEBUG] Attempted to initialize Firebase with the following config:',
    firebaseConfig
  );
  throw error;
}

export default firebase;

export const db = firebase.database();

export const auth = firebase.auth();
