import { gql } from '@apollo/client'

export const ALL_AUTHORS = gql`
  query {
    allAuthors  {
      name
      born
      id
    }
  }
`

export const ALL_BOOKS = gql`
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      title
      published
      id
      genres
      author {
        name
      }
    }
  }
`

export const ALL_GENRES = gql`
  query allGenres {
    allGenres
  }
`

export const CREATE_BOOK = gql`
  mutation createBook(
    $title: String!
    $author: String!
    $published: Int!
    $genres: [String!]!
  ) {
    addBook(title: $title, author: $author, published: $published, genres: $genres) {
      title
      author {
        name
        born
      }
      published
      id
    }
  }
`

export const EDIT_AUTHOR = gql`
  mutation editAuthor(
    $name: String!
    $setBornTo: Int!
  ) {
    editAuthor(name: $name, setBornTo: $setBornTo)  {
      name
      born
      id
    }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`


export const FAVORITE_GENRE = gql`
  query {
    me {
      favoriteGenre
    }
  }
`

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    id
    title
    published 
    genres
    author {
      name 
      born
    }
  }
`

export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`