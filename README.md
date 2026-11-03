# API REST de productos

API sencilla construida con Node.js, Express y MySQL2 para administrar la tabla
`db_tienda_august.tb_productos`.

## Requisitos

- Node.js 18.11 o superior
- MySQL con la base de datos `db_tienda_august` y la tabla `tb_productos`

La definición compartida incluye `ON DELETE RESTRICT ON UPDATE CASCADE` sin
declarar una clave foránea, por lo que MySQL la rechazará. Como esta tabla no
define ninguna relación, puedes crearla así:

```sql
CREATE DATABASE IF NOT EXISTS db_tienda_august;
USE db_tienda_august;

CREATE TABLE `tb_productos` (
  `pk_clave_pro` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `descripcion` text,
  `stock` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`pk_clave_pro`)
) ENGINE=InnoDB AUTO_INCREMENT=23
  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## Instalación y configuración

```bash
npm install
```

Copia `.env.example` a `.env` y configura las credenciales de tu servidor MySQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_clave
DB_NAME=db_tienda_august
DB_CONNECTION_LIMIT=10
```

Inicia el servidor:

```bash
npm start
```

## Endpoints

La API usa la ruta base `/api/productos`. El cuerpo de las solicitudes de
creación y actualización debe enviarse como JSON.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Comprueba que la API está activa |
| GET | `/api/productos` | Lista todos los productos |
| GET | `/api/productos/:id` | Obtiene un producto |
| POST | `/api/productos` | Crea un producto |
| PUT | `/api/productos/:id` | Actualiza los campos enviados |
| PATCH | `/api/productos/:id` | Actualiza parcialmente un producto |
| DELETE | `/api/productos/:id` | Elimina un producto |

Ejemplo para crear un producto:

```json
{
  "nombre": "Café",
  "precio": 89.5,
  "descripcion": "Café molido",
  "stock": 25,
  "activo": true
}
```

`nombre` y `precio` son obligatorios al crear. `descripcion` y `stock` pueden
ser `null`; `activo` acepta `true`, `false`, `1` o `0` y por defecto es `1`.
Los errores de validación devuelven HTTP 400, los productos inexistentes HTTP
404 y las operaciones de base de datos usan consultas parametrizadas.
