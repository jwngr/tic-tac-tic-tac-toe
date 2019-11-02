import React from 'react';

import gitHubLogo from '../../../images/gitHubLogo.png';
import twitterLogo from '../../../images/twitterLogo.png';

import {
  Timer,
  Divider,
  Scoreboard,
  StatsWrapper,
  TeamContainer,
  CurrentPlayers,
  PlayByPlayEvent,
  PlayByPlayTicker,
  StatsSectionTitle,
  PlayByPlayEventTextWrapper,
} from './index.styles';

const Stats = ({wins, events, currentGame, loggedInUserCounts, numSecondsUntilNextMove}) => {
  const activeTeam = currentGame.winner ? '' : currentGame.whoseTurn;

  return (
    <StatsWrapper>
      <StatsSectionTitle>Seconds Until Next Move</StatsSectionTitle>
      <Timer>
        <p>{numSecondsUntilNextMove}</p>
      </Timer>

      <StatsSectionTitle>Wins</StatsSectionTitle>
      <Scoreboard>
        <TeamContainer isActiveTeam={activeTeam === 'github'}>
          <img src={gitHubLogo} alt="GitHub logo" />
          <p>{wins.github}</p>
        </TeamContainer>
        <Divider />
        <TeamContainer isActiveTeam={activeTeam === 'twitter'}>
          <p>{wins.twitter}</p>
          <img src={twitterLogo} alt="Twitter logo" />
        </TeamContainer>
      </Scoreboard>

      <StatsSectionTitle>Team Size</StatsSectionTitle>
      <CurrentPlayers>
        <TeamContainer isActiveTeam={activeTeam === 'github'}>
          <img src={gitHubLogo} alt="GitHub logo" />
          <p>{loggedInUserCounts.github}</p>
        </TeamContainer>
        <Divider />
        <TeamContainer isActiveTeam={activeTeam === 'twitter'}>
          <p>{loggedInUserCounts.twitter}</p>
          <img src={twitterLogo} alt="Twitter logo" />
        </TeamContainer>
      </CurrentPlayers>

      <StatsSectionTitle>Play By Play</StatsSectionTitle>
      <PlayByPlayTicker>
        {events.map((event) => {
          let eventTextContent;
          if (event.type === 'suggestion') {
            eventTextContent = (
              <p>
                <a
                  className="username"
                  href={event.userUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{event.username}
                </a>
                <span>{event.text}</span>
              </p>
            );
          } else if (event.type === 'move' || event.type === 'gameOver') {
            eventTextContent = (
              <p>
                <span className="teamName">Team {event.teamName}</span>
                <span>{event.text}</span>
              </p>
            );
          } else if (event.type === 'newGame') {
            eventTextContent = <p>{event.text}</p>;
          }

          let imageUrl = event.imageUrl;
          if (event.type !== 'suggestion') {
            imageUrl = event.teamName === 'GitHub' ? gitHubLogo : twitterLogo;
          }

          return (
            <PlayByPlayEvent type={event.type} key={event.key}>
              <img src={imageUrl} alt={`${event.username} ${event.teamName} profile pic`} />
              <PlayByPlayEventTextWrapper>{eventTextContent}</PlayByPlayEventTextWrapper>
              <div style={{clear: 'both'}}></div>
            </PlayByPlayEvent>
          );
        })}
      </PlayByPlayTicker>
    </StatsWrapper>
  );
};

export default Stats;
