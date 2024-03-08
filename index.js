const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Author = require('./models/author')
const Book = require('./models/book')

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
        }
    },
    Mutation: {
      addBook: async (root, args) => {
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
      editAuthor: async (root, args) => {
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
    }
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})