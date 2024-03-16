import React, { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState('all genres')
  const [genres, setGenres] = useState([])
  const { loading, error, data } = useQuery(ALL_BOOKS)

  useEffect(() => {
    if (data) {
      const gatheredGenres = new Set(data.allBooks.flatMap(book => book.genres))
      setGenres(['all genres', ...gatheredGenres])
    }
  }, [data])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!props.show || !data) return null

  const filteredBooks = selectedGenre === 'all genres'
    ? data.allBooks
    : data.allBooks.filter(book => book.genres.includes(selectedGenre))

    return (
      <div>
        <h2>books</h2>      
        <p>in genre <strong>{selectedGenre}</strong> </p>      
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {filteredBooks.map(a => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
        <div>
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
    </div>
  )
}

export default Books
