import styled from 'styled-components';

export const StatsWrapper = styled.div`
  float: left;
  width: 251px;
  height: 500px;
  border: solid 5px ${({theme}) => theme.colors.black};
`;

export const StatsSectionTitle = styled.p`
  font-family: 'Norwester';
  font-size: 20px;
  text-align: center;
  margin: 0;
  padding: 3px 0 3px 0;
  border-bottom: solid 5px ${({theme}) => theme.colors.black};
  background: ${({theme}) => theme.colors.gray};
`;

export const PlayByPlayTicker = styled.div`
  width: 100%;
  height: 223px;
  overflow-y: scroll;
`;

export const PlayByPlayEvent = styled.div`
  height: 50px;
  border-bottom: solid 2px ${({theme}) => theme.colors.black};
  background: ${({theme, type}) => {
    if (type === 'move') {
      return theme.colors.blue;
    } else if (type === 'newGame' || type === 'gameOver') {
      return theme.colors.green;
    } else if (type === 'suggestion') {
      return theme.colors.orange;
    }
  }};

  .username {
    color: darken(${({theme}) => theme.colors.blue}, 50%);
    text-decoration: none;
    font-family: 'Clear Sans';
    font-weight: bold;

    &:hover {
      text-decoration: underline;
    }
  }

  .teamName {
    font-family: 'Clear Sans';
    font-weight: bold;
  }

  img {
    float: left;
    width: 40px;
    height: 40px;
    margin: 5px 8px 5px 5px;
    border-radius: 20px;
  }

  p {
    display: table-cell;
    vertical-align: middle;
    font-family: 'Clear Sans';
    font-size: 14px;
  }
`;

export const PlayByPlayEventTextWrapper = styled.div`
  float: left;
  display: table;
  text-align: left;
  height: 50px;
  width: 180px;
  margin-top: -2px;
`;

export const Scoreboard = styled.div`
  width: 100%;
  height: 47px;
  border-bottom: solid 5px ${({theme}) => theme.colors.black};
`;

export const CurrentPlayers = styled.div`
  width: 100%;
  height: 47px;
  border-bottom: solid 5px ${({theme}) => theme.colors.black};
`;

export const TeamContainer = styled.div`
  float: left;
  width: 123px;
  height: 44px;
  text-align: center;
  padding-top: 3px;
  background: ${({theme, isActiveTeam}) => (isActiveTeam ? theme.colors.gold : 'none')};

  img {
    display: inline;
    padding: 3px;
    width: 34px;
    height: 34px;
  }

  p {
    display: inline;
    position: relative;
    top: -8px;
    font-family: 'Norwester';
    font-size: 30px;
  }
`;

export const Divider = styled.div`
  float: left;
  height: 50px;
  border-left: solid 5px ${({theme}) => theme.colors.black};
`;

export const Timer = styled.div`
  width: 100%;
  height: 40px;
  border-bottom: solid 5px ${({theme}) => theme.colors.black};

  & > p {
    font-family: 'Norwester';
    font-size: 30px;
    color: ${({theme}) => theme.colors.red};
    margin: 0;
    padding-top: 6px;
  }
`;
