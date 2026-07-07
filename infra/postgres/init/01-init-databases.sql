-- Se ejecuta solo al inicializar el volumen de Postgres (primera vez).
-- La BD de Catálogo la crea POSTGRES_DB; aquí creamos las de los demás
-- microservicios (una base de datos por servicio).
CREATE DATABASE optimus_inventory;
CREATE DATABASE optimus_orders;
