const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'joyas',
  password: 'RioSimme4995.',
  port: 5432,
});

app.use((req, res, next) => {
  console.log(`Ruta consultada: ${req.path}`);
  next();
});

app.get('/joyas', async (req, res) => {
  const { limits, page, order_by } = req.query;
  const limit = parseInt(limits) || 10;
  const offset = (parseInt(page) - 1) * limit || 0;
  const orderBy = order_by || 'id_ASC';
  const orderColumn = orderBy.split('_')[0];
  const orderDirection = orderBy.split('_')[1];

  try {
    const result = await pool.query(`SELECT * FROM inventario ORDER BY ${orderColumn} ${orderDirection} LIMIT $1 OFFSET $2`, [limit, offset]);
    const joyas = result.rows.map(joya => ({
      ...joya,
      links: {
        self: `/joyas/${joya.id}`,
        category: `/joyas/categoria/${joya.categoria}`,
        metal: `/joyas/metal/${joya.metal}`,
      }
    }));
    res.json(joyas);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la consulta');
  }
});

app.get('/joyas/filtros', async (req, res) => {
  const { precio_max, precio_min, categoria, metal } = req.query;
  const filters = [];
  const values = [];

  if (precio_max) {
    filters.push('precio <= $' + (filters.length + 1));
    values.push(precio_max);
  }
  if (precio_min) {
    filters.push('precio >= $' + (filters.length + 1));
    values.push(precio_min);
  }
  if (categoria) {
    filters.push('categoria = $' + (filters.length + 1));
    values.push(categoria);
  }
  if (metal) {
    filters.push('metal = $' + (filters.length + 1));
    values.push(metal);
  }

  const query = `SELECT * FROM inventario ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''}`;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la consulta');
  }
});

app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});
