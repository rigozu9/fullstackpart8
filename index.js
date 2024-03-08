const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

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
        allAuthors: [Author!]!
        me: User
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

const resolvers = {
    Query: {
        bookCount: async () => Book.collection.countDocuments(),
        authorCount: async () => Author.collection.countDocuments(),
        allBooks: async (root, args) => {
          if (args.genre && args.author) {
            return Book.find({
              genres: { $in: [args.genre] },
            }).populate('author', { name: args.author })
          } 
          else if (args.genre) {
            return Book.find({
              genres: { $in: [args.genre] }, 
            }).populate('author')
          }
          else if (args.author) {
            const author = await Author.findOne({ name: args.author })
            if (!author) {
              return []
            }
            return Book.find({ author: author._id }).populate('author')
          }
          else {
            return Book.find({}).populate('author')
          }
        },              
        allAuthors: async () => {
          return Author.find({})
        },
        me: (root, args, context) => {
          if (!context.currentUser) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
              }
            })
          }
          return context.currentUser
        },        
    },
    Mutation: {
      addBook: async (root, args, context) => {
        if (!context.currentUser) {
          throw new GraphQLError('Unauthorized', {
            extensions: {
              code: 'UNAUTHENTICATED',
            }
          })
        }
        try {
          let author = await Author.findOne({ name: args.author })
      
          if (!author) {
            const authorArgs = { name: args.author, born: args.born }
            author = new Author(authorArgs)
            await author.save()
          }
  
          const book = new Book({
            title: args.title,
            published: args.published,
            genres: args.genres,
            author: author._id,
          })
      
          await book.save()
          await book.populate('author')
    
          return book
        } catch (error) {
          throw new GraphQLError('Error adding book: ' + error.message, {
            extensions: {
              code: 'DATABASE_ERROR',
              invalidArgs: Object.keys(args),
              errorMessage: error.message,
            }
          })
        }
      },
      editAuthor: async (root, args, context) => {
          if (!context.currentUser) {
            throw new GraphQLError('Unauthorized', {
              extensions: {
                code: 'UNAUTHENTICATED',
              }
            })
          }
          try {
            const updatedAuthor = await Author.findOneAndUpdate(
              { name: args.name },
              { born: args.setBornTo },
              { new: true, runValidators: true }
            )
    
            if (!updatedAuthor) {
              throw new Error('Author not found')
            }
    
            return updatedAuthor
          } catch (error) {
            throw new GraphQLError('Error editing author: ', {
              extensions: {
                code: 'DATABASE_ERROR',
                invalidArgs: Object.keys(args),
                error
              }
          })
        }      
      },
      createUser: async (root, args) => {
        const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
      
        try {
          await user.save()
          return user
        } catch (error) {
          throw new GraphQLError('Creating the user failed: ' + error.message, {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: Object.keys(args),
              errorMessage: error.message,
            }
          })
        }
      },      
      login: async (root, args) => {
        const user = await User.findOne({ username: args.username })
    
        if ( !user || args.password !== 'secret' ) {
          throw new GraphQLError('wrong credentials', {
            extensions: {
              code: 'BAD_USER_INPUT'
            }
          })        
        }
    
        const userForToken = {
          username: user.username,
          id: user._id,
        }
    
        return { value: jwt.sign(userForToken, process.env.SECRET) }
      },
    },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const auth = req.headers.authorization || ''
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.substring(7)
      try {
        const decodedToken = jwt.verify(token, process.env.SECRET)
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      } catch (error) {
        console.error(error)
        throw new GraphQLError('Invalid or expired token')
      }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})