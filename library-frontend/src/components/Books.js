import React, { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ALL_GENRES } from '../queries'

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState('')
  const [genres, setGenres] = useState('')
  const { loading: loadingBooks, error: errorBooks, data: dataBooks } = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre },
  })
  const { loading: loadingGenres, error: errorGenres, data: dataGenres } = useQuery(ALL_GENRES)

  useEffect(() => {
    if (dataGenres) {
      const gatheredGenres = new Set(dataGenres.allGenres)
      setGenres([...gatheredGenres])
    }
  }, [dataGenres])

  const selectGenre = (genre) => {
    setSelectedGenre(genre === 'all genres' ? null : genre)
  }

  if (loadingBooks || loadingGenres) return <p>Loading...</p>
  if (errorBooks || errorGenres) return <p>Error: {errorBooks?.message || errorGenres?.message}</p>
  if (!props.show) return null

  return (
    <div>
      <h2>books</h2>
      <p>in genre <strong>{selectedGenre || 'all genres'}</strong></p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {dataBooks.allBooks.map(a => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {genres.map(genre => (
          <button key={genre} onClick={() => selectGenre(genre)}>
            {genre}
          </button>
        ))}
        <button onClick={() => selectGenre('all genres')}>
          all genres
        </button>
      </div>
    </div>
  )
}

export default Books
