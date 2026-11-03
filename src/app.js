const express = require('express');
const productsRouter = require('./routes/products');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/productos', productsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'El JSON enviado no es válido.' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
