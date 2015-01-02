# tic-tac-tic-tac-toe

[tic-tac-tic-tac-toe](https://tic-tac-tic-tac-toe.firebaseapp.com) is a new twist on the age old
game of tic-tac-toe. Powered by [Firebase](https://www.firebase.com) and
[AngularFire](https://www.firebase.com/docs/web/libraries/angular/index.html), tic-tac-tic-tac-toe
allows thousands of people to collaboratively and simultaneously play a multi-level variant of
tic-tac-toe.

Join the fun at https://tic-tac-tic-tac-toe.firebaseapp.com!


## How To Play

Login with either your GitHub or Twitter account to join that team. You and your teammates will each
individually suggest your team's next move. __The most popular square will be your team's collective
move!__

Your goal is to win the big tic-tac-toe board by getting __three in a row__ - either across, down, or
diagonally - or getting a __majority of the squares in a full grid__. In order to earn one of the
nine squares in the big board, you must win the smaller tic-tac-toe board contained within it.

__Your opponent's previous move determines in which board(s) you are allowed to play__. For example,
if your opponent chose the top right square of the center board, you would then have to choose an open
square in the top right board.

If your opponent's previous move would force you to play in a board which has already been won, you
can select any open square on the whole board.


## Inspiration

- [Ten (iOS)](https://itunes.apple.com/us/app/ten/id669964112?mt=8) by Sennep
- [Ultimate Tic-Tac-Toe](http://mathwithbaddrawings.com/2013/06/16/ultimate-tic-tac-toe/)
- [Twitch Plays Pokemon](http://www.twitch.tv/twitchplayspokemon)


## Contributing

If you'd like to fork this repo and / or contribute back to it, you'll need to run the following
commands to get your environment set up:

```bash
$ git clone https://github.com/jwngr/tic-tac-tic-tac-toe.git
$ cd tic-tac-tic-tac-toe  # go to the tic-tac-tic-tac-toe directory
$ npm install -g gulp     # globally install gulp task runner
$ npm install -g bower    # globally install Bower package manager
$ npm install             # install local npm build dependencies
$ bower install           # install local JavaScript dependencies
$ gulp                    # populate the /dist/ directory
```

`gulp watch` will watch for changes in the `/src/` directory and lint, concatenate, and minify the
source files when a change occurs. The output files are written to the `/dist/` directory.

`bower install` will create a `bower_components/` directory within the `/src/client/` directory.
