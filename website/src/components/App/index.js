import React from 'react';

import Footer from '../Footer';
import Header from '../Header';
import GameBoard from '../GameBoard/container';
import GameMessage from '../GameMessage/container';
import ErrorMessage from '../ErrorMessage/container';
import Instructions from '../Instructions';
import LogoutButton from '../LogoutButton/container';
import LoginButtons from '../LoginButtons/container';
import FirebaseBadge from '../FirebaseBadge';

function App() {
  return (
    <>
      <Header />
      <LogoutButton />
      <LoginButtons />
      <GameMessage />
      <ErrorMessage />
      <GameBoard />
      <Instructions />
      <Footer />
      <FirebaseBadge />
    </>
  );
}

export default App;
