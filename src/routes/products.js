const express = require('express');
const pool = require('../db');

const router = express.Router();
const allowedFields = new Set([
  'nombre',
  'precio',
  'descripcion',
  'stock',
  'activo',
]);

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isValidPrice(value) {
  return (
    typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 99999999.99
    && Number(value.toFixed(2)) === value
  );
}

function validateProduct(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'El cuerpo debe ser un objeto JSON.' };
  }

  const fields = Object.keys(body);
  const unknownFields = fields.filter((field) => !allowedFields.has(field));
  if (unknownFields.length > 0) {
    return { error: `Campos no permitidos: ${unknownFields.join(', ')}.` };
  }

  if (fields.length === 0) {
    return { error: 'Debes enviar al menos un campo.' };
  }

  if (!partial) {
    if (typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
      return { error: 'El nombre es obligatorio y debe ser texto.' };
    }

    if (body.nombre.trim().length > 100) {
      return { error: 'El nombre no puede superar 100 caracteres.' };
    }

    if (!isValidPrice(body.precio)) {
      return { error: 'El precio debe ser un número no negativo con hasta 2 decimales.' };
    }
  } else if (fields.includes('nombre')) {
    if (typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
      return { error: 'El nombre debe ser texto no vacío.' };
    }

    if (body.nombre.trim().length > 100) {
      return { error: 'El nombre no puede superar 100 caracteres.' };
    }
  }

  if (partial && fields.includes('precio')) {
    if (!isValidPrice(body.precio)) {
      return { error: 'El precio debe ser un número no negativo con hasta 2 decimales.' };
    }
  }

  if (
    fields.includes('descripcion')
    && body.descripcion !== null
    && typeof body.descripcion !== 'string'
  ) {
    return { error: 'La descripción debe ser texto o null.' };
  }

  if (
    fields.includes('stock')
    && body.stock !== null
    && (!Number.isInteger(body.stock) || body.stock < 0)
  ) {
    return { error: 'El stock debe ser un entero no negativo o null.' };
  }

  if (
    fields.includes('activo')
    && body.activo !== 0
    && body.activo !== 1
    && body.activo !== false
    && body.activo !== true
  ) {
    return { error: 'El campo activo debe ser true, false, 1 o 0.' };
  }

  return {
    value: {
      ...body,
      ...(typeof body.nombre === 'string' ? { nombre: body.nombre.trim() } : {}),
      ...(typeof body.activo === 'boolean' ? { activo: Number(body.activo) } : {}),
    },
  };
}

router.get('/', async (req, res, next) => {
  try {
    const [products] = await pool.query(
      'SELECT pk_clave_pro, nombre, precio, descripcion, stock, activo FROM tb_productos ORDER BY pk_clave_pro',
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  try {
    const [products] = await pool.execute(
      'SELECT pk_clave_pro, nombre, precio, descripcion, stock, activo FROM tb_productos WHERE pk_clave_pro = ?',
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    return res.json(products[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const validation = validateProduct(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { nombre, precio, descripcion, stock, activo } = validation.value;

  try {
    const [result] = await pool.execute(
      `INSERT INTO tb_productos (nombre, precio, descripcion, stock, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, precio, descripcion ?? null, stock ?? null, activo ?? 1],
    );

    const [products] = await pool.execute(
      'SELECT pk_clave_pro, nombre, precio, descripcion, stock, activo FROM tb_productos WHERE pk_clave_pro = ?',
      [result.insertId],
    );
    return res.status(201).json(products[0]);
  } catch (error) {
    return next(error);
  }
});

async function updateProduct(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  const validation = validateProduct(req.body, { partial: true });
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const entries = Object.entries(validation.value);
  const columns = {
    nombre: 'nombre',
    precio: 'precio',
    descripcion: 'descripcion',
    stock: 'stock',
    activo: 'activo',
  };

  try {
    const [result] = await pool.execute(
      `UPDATE tb_productos SET ${entries.map(([field]) => `\`${columns[field]}\` = ?`).join(', ')}
       WHERE pk_clave_pro = ?`,
      [...entries.map(([, value]) => value), id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const [products] = await pool.execute(
      'SELECT pk_clave_pro, nombre, precio, descripcion, stock, activo FROM tb_productos WHERE pk_clave_pro = ?',
      [id],
    );
    return res.json(products[0]);
  } catch (error) {
    return next(error);
  }
}

router.put('/:id', updateProduct);
router.patch('/:id', updateProduct);

router.delete('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM tb_productos WHERE pk_clave_pro = ?',
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
