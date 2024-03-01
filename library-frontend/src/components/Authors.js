import Select from 'react-select';
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

const Authors = (props) => {
  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  const { loading, error, data } = useQuery(ALL_AUTHORS);
  const [selectedAuthor, setSelectedAuthor] = useState(null); // This will store the selected author
  const [born, setBorn] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    if (selectedAuthor && born !== '') {
      await editAuthor({
        variables: { name: selectedAuthor.value, setBornTo: parseInt(born) },
      });
      setSelectedAuthor(null);
      setBorn('');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!props.show || !data) return null;

  // Options for the Select component
  const options = data.allAuthors.map((author) => ({
    value: author.name,
    label: author.name,
  }));

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {data.allAuthors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Set birthyear</h2>
      <div>
        <form onSubmit={submit}>
          <div>
            name
            <Select
              value={selectedAuthor}
              onChange={setSelectedAuthor}
              options={options}
              isClearable
              isSearchable
            />
          </div>
          <div>
            born
            <input
              type="number"
              value={born}
              onChange={({ target }) => setBorn(target.value)}
            />
          </div>
          <button type="submit">update author</button>
        </form>
      </div>
    </div>
  );
};

export default Authors;
