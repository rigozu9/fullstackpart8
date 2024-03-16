import React from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS, FAVORITE_GENRE } from '../queries'

const Recommendations = (props) => {
  const { loading: loadingGenre, data: genreData } = useQuery(FAVORITE_GENRE)
  const { loading: loadingBooks, error, data: booksData } = useQuery(ALL_BOOKS)

  if (loadingGenre || loadingBooks) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  const favoriteGenre = genreData?.me?.favoriteGenre

  const booksInFavoriteGenre = booksData?.allBooks.filter((book) =>
    book.genres.includes(favoriteGenre)
  )

  if (!props.show) return null

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre <strong>{favoriteGenre}</strong></p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksInFavoriteGenre?.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommendations
