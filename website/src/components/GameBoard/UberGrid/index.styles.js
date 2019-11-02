import styled from 'styled-components';

export const UberGridWrapper = styled.div`
  float: left;
  margin-right: 25px;

  /* Disable highlighting */
  ::-moz-selection {
    background-color: transparent;
  }
  ::selection {
    background-color: transparent;
  }
`;

export const Grid = styled.div`
  display: inline;
  float: left;
  width: 155px;
  height: 155px;
  padding: 5px;
  border: solid 3px ${({theme}) => theme.colors.black};

  &:nth-of-type(3n + 1) {
    border-left: none;
    clear: left;
  }

  &:nth-of-type(3n) {
    border-right: none;
  }

  &:nth-of-type(1),
  &:nth-of-type(2),
  &:nth-of-type(3) {
    border-top: none;
  }

  &:nth-of-type(7),
  &:nth-of-type(8),
  &:nth-of-type(9) {
    border-bottom: none;
  }

  &:last-of-type {
    border-right: none;
  }
`;

export const Cell = styled.div`
  display: inline;
  float: left;
  border: solid 1px ${({theme}) => theme.colors.black};
  width: 50px;
  height: 50px;

  &:first-of-type {
    border-left: none;
  }

  &:last-of-type {
    border-right: none;
  }

  &.validForMove {
    cursor: pointer;
    background: ${({theme}) => theme.colors.green};
  }

  &.suggestedMove {
    background: ${({theme}) => theme.colors.orange};
  }

  &.previousMove {
    background: ${({theme}) => theme.colors.blue};
  }

  & > img {
    width: 36px;
    height: 36px;
    margin-top: 7px;
    transition: 3s;
  }

  & > p {
    font-family: 'Clear Sans';
    font-size: 16px;
    font-weight: bold;
    margin: 14px 0 0 0;
  }
`;

export const Row = styled.div`
  &:first-of-type > ${Cell} {
    border-top: none;
  }

  &:nth-of-type(3) > ${Cell} {
    border-bottom: none;
  }
`;

export const GridWinner = styled.div`
  /* Social icons from: http://vervex.deviantart.com/art/Somacro-40-300DPI-Social-Media-Icons-267955425 */
  width: 155px;
  height: 155px;

  &.winningTeam {
    background: ${({theme}) => theme.colors.gold};
  }

  & > img {
    width: 120px;
    height: 120px;
    margin-top: 18px;
  }
`;
