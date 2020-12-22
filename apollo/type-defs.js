import { gql } from "@apollo/client";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
  }
  type Viewer {
    id: ID
    token: String
    avatar: String
    didRequest: Boolean!
  }

  input LogInInput {
    code: String!
  }

  type Query {
    viewer: User
    authUrl: String!
  }
  type Mutation {
    logIn(input: LogInInput): Viewer!
  }
`;
