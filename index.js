require('dotenv').config();
const express = require('express');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do SQL Server (pega do .env ou das variáveis do Render)
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // true para nuvem/RDS/Azure, false local
    trustServerCertificate: true
  }
};

// Endpoint para checar disponibilidade de sabor
app.get('/consulta', async (req, res) => {
  const sabor = req.query.sabor;
  if (!sabor) {
    return res.status(400).json({ erro: 'Favor informar o sabor na query (?sabor=Calabresa)' });
  }

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
      SELECT TOP 1 NomeProduto, Quantidade, Disponivel, Preco
      FROM Estoque
      WHERE NomeProduto = ${sabor}
        AND Disponivel = 1
        AND Quantidade > 0
    `;

    if (result.recordset.length > 0) {
      const pizza = result.recordset[0];
      res.json({
        disponivel: true,
        nome: pizza.NomeProduto,
        preco: pizza.Preco,
        quantidade: pizza.Quantidade
      });
    } else {
      res.json({
        disponivel: false,
        mensagem: 'Esse sabor não está disponível no momento.'
      });
    }
  } catch (err) {
    console.error('Erro na consulta:', err);
    res.status(500).json({ erro: 'Erro interno ao consultar estoque.' });
  }
});

// Endpoint pa
