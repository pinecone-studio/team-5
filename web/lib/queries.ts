import { gql } from "@apollo/client";

export const GET_BENEFITS = gql`
  query {
    countries {
      code
      name
      capital
    }
  }
`;
