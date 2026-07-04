-- Cria o banco usado pela Evolution API (separado do banco do app).
-- Roda automaticamente na primeira inicializacao do Postgres.
SELECT 'CREATE DATABASE evolution'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evolution')\gexec
