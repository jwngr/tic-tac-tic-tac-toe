import {darken} from 'polished';
import styled from 'styled-components';

export const InstructionsWrapper = styled.div`
  width: 520px;
  margin: 50px auto 10px auto;

  p {
    font-family: 'Clear Sans';
    text-align: justify;
    width: 520px;
  }

  .blue {
    font-family: 'Clear Sans';
    font-weight: bold;
    color: ${({theme}) => darken(0.2, theme.colors.blue)};
  }

  .green {
    font-family: 'Clear Sans';
    font-weight: bold;
    color: ${({theme}) => darken(0.1, theme.colors.green)};
  }

  .orange {
    font-family: 'Clear Sans';
    font-weight: bold;
    color: ${({theme}) => darken(0.1, theme.colors.orange)};
  }

  .gold {
    font-family: 'Clear Sans';
    font-weight: bold;
    color: ${({theme}) => darken(0.25, theme.colors.gold)};
  }
`;
