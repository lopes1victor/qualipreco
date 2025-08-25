require('dotenv').config();
const express = require('express');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do SQL Server (agora com suporte à porta customizada)
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // true para nuvem/RDS/Azure
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

// Endpoint para listar todos os sabores disponíveis
app.get('/sabores', async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
      SELECT NomeProduto, Preco
      FROM Estoque
      WHERE Disponivel = 1 AND Quantidade > 0
    `;

    res.json({ sabores: result.recordset });
  } catch (err) {
    console.error('Erro ao listar sabores:', err);
    res.status(500).json({ erro: 'Erro ao listar sabores.' });
  }
});

app.get('/', (req, res) => {
  res.send('Qualipreço Webhook está rodando! 🚀');
});

app.listen(PORT, () => {
  console.log(`Webhook Qualipreco rodando na porta ${PORT}`);
});
