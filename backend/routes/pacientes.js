const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Conexão com o banco de dados
require('dotenv').config();
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Rota para cadastrar paciente
router.post('/cadastro', async (req, res) => {
    const { nome_paciente, data_nascimento, consultorio, medico, especialidade } = req.body;

    const hoje = new Date();
    const nascimento = new Date(data_nascimento);
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    const prioridade = idade >= 60;

    try {
        // Obtém o número sequencial para a senha
        const querySenha = 'SELECT COUNT(*) FROM pacientes WHERE prioridade = $1';
        const { rows } = await pool.query(querySenha, [prioridade]);
        const sequencial = parseInt(rows[0].count) + 1;
        const prefixo = prioridade ? 'P' : 'N';
        const senha = `${prefixo}${sequencial.toString().padStart(2, '0')}`;

        // Insere o paciente no banco
        const query = `
            INSERT INTO pacientes (nome_paciente, data_nascimento, consultorio, medico, especialidade, prioridade, senha)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await pool.query(query, [
            nome_paciente,
            data_nascimento,
            consultorio,
            medico,
            especialidade,
            prioridade,
            senha,
        ]);

        res.status(201).send({ message: 'Paciente cadastrado com sucesso!', senha });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erro ao cadastrar paciente.' });
    }
});

// Rota para listar todos os pacientes
router.get('/pacientes', async (req, res) => {
    try {
        const query = 'SELECT * FROM pacientes ORDER BY id DESC';
        const { rows } = await pool.query(query);
        res.status(200).send(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erro ao buscar pacientes.' });
    }
});

// Rota para exibir o último paciente cadastrado
router.get('/ultimo-paciente', async (req, res) => {
    try {
        const query = 'SELECT * FROM pacientes ORDER BY id DESC LIMIT 1';
        const { rows } = await pool.query(query);
        res.status(200).send(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erro ao buscar o último paciente.' });
    }
});

module.exports = router;
