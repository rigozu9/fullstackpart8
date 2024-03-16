const typeDefs = `
    type User {
      username: String!
      favoriteGenre: String!
      id: ID!
    }

    type Token {
      value: String!
    }

    type Book {
        title: String!
        published: Int!
        author: Author!
        genres: [String!]!
        id: ID! 
    }

    type Author {
      name: String!
      id: ID! 
      bookCount: Int!
      born: Int
    }

    type Query {
        bookCount: Int!
        authorCount: Int!
        allBooks(author: String, genre: String): [Book!]!
        allGenres: [String!]!
        allAuthors: [Author!]!
        me: User
    }

    type Subscription {
        bookAdded: Book!
      }    

    type Mutation {
      addBook(
        title: String!
        author: String
        published: Int!
        genres: [String!]
      ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author

    createAuthor(
      name: String!
      born: Int
    ): Author

    createUser(
      username: String!
      favoriteGenre: String!
    ): User

    login(
      username: String!
      password: String!
    ): Token
  }
`

module.exports = typeDefs