const pool = require('./db')
const express = require('express')
const path = require('path')
const app = express()
const PORT = 3000
const clientPath = path.resolve(__dirname, '../client/dist')
app.use(express.static(clientPath))
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'))
})
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

app.get('/api/links', (req, res) => {
  pool.query('SELECT * FROM favlinks', (error, results) => {
    if (error) {
      throw error
    }
    console.log('Returning', results.rows)
    res.status(200).json([{ id: 0, url: 'Hello', name: 'Bolaji' }] || results.rows)
  })
})

app.post('/api/links', async (req, res) => {
  try {
    const { id, url, name } = req.body;

    if (!url || !name) {
      return res.status(400).json({ error: 'Both url and name are required.' });
    }

    const query = 'INSERT INTO links (id, url, name) VALUES ($1, $2, $3) RETURNING *';
    const values = [id, url, name];

    const result = await pool.query(query, values);

    res.status(201).json({ message: 'Link added successfully', link: result.rows[0] });
  } catch (error) {
    console.error('Error executing the query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle POST requests to /api/links/:id
app.post('/api/links/:id', async (req, res) => {
  try {
    // Extract data from the JSON payload
    const { url, name } = req.body;
    const linkId = req.params.id;

    // SQL query to update the link in the links table
    const updateQuery = `
        UPDATE links
        SET url = $1, name = $2
        WHERE id = $3
        RETURNING *;
      `;

    // Execute the query with the provided data
    const result = await pool.query(updateQuery, [url, name, linkId]);

    // Check if a link with the specified ID was found and updated
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Link not found' });
    } else {
      // Respond with the updated link
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating the link in the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle DELETE requests to /api/links/:id
app.delete('/api/links/:id', async (req, res) => {
  try {
    const linkId = req.params.id;

    // SQL query to delete the link from the links table
    const deleteQuery = `
        DELETE FROM links
        WHERE id = $1
        RETURNING *;
      `;

    // Execute the query with the specified link ID
    const result = await pool.query(deleteQuery, [linkId]);

    // Check if a link with the specified ID was found and deleted
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Link not found' });
    } else {
      // Respond with the deleted link
      res.status(200).json({ message: 'Link deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting the link from the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});