const jwt = require('jsonwebtoken')
const { GraphQLError } = require('graphql')

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

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
        allGenres: async () => {
            const books = await Book.find({})
            const genres = new Set(books.flatMap(book => book.genres))
            return Array.from(genres)
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
          pubsub.publish('BOOK_ADDED', { bookAdded: book })

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
    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
        }
    }
}

module.exports = resolvers