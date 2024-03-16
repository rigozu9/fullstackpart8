import { useState } from 'react'
import { useApolloClient, useSubscription } from '@apollo/client'
import { BOOK_ADDED } from './queries.js'

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Recommendations from './components/Recommendations'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  const client = useApolloClient()

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.clearStore()
    setPage('authors')
  }

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      if (data?.data?.bookAdded) {
        const title = data.data.bookAdded.title
        const authorName = data.data.bookAdded.author.name
        alert(`A new book "${title}" by ${authorName} added`)
      }
    }
  })
  

  if (!token) {
      return (
      <div>
        <div>
          <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          <button onClick={() => setPage('login')}>login</button>
        </div>

        <Authors show={page === 'authors'} />

        <Books show={page === 'books'} />

        <LoginForm show={page === 'login'} setToken={setToken} setPage={setPage}/>
      </div>
    )
  }
  if (token) {
    return (
      <div>
        <div>
          <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          <button onClick={() => setPage('add')}>add book</button>
          <button onClick={() => setPage('recommend')}>recommend</button>
          <button onClick={logout}>logout</button>
        </div>

        <Authors show={page === 'authors'} />

        <Books show={page === 'books'} />

        <NewBook show={page === 'add'} setPage={setPage}/>

        <Recommendations show={page === 'recommend'}/>
      </div>
    )
  }
}

export default App
