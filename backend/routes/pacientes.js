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

// ✅ Rota para cadastrar paciente
router.post('/cadastro', async (req, res) => {
    const { nome_paciente, data_nascimento, consultorio, medico, especialidade } = req.body;

    try {
        const hoje = new Date();
        const nascimento = new Date(data_nascimento);
        const idade = hoje.getFullYear() - nascimento.getFullYear();

        // 📌 Definir prioridade automaticamente
        const prioridade = idade >= 60;

        // 📌 Gerar senha automaticamente (P para prioridade e N para normal)
        const tipoSenha = prioridade ? 'P' : 'N';
        const numeroSenha = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const senha = `${tipoSenha}${numeroSenha}`;

        // 📌 Inserir no banco de dados (agora com a senha)
        const query = `
            INSERT INTO pacientes (nome_paciente, data_nascimento, consultorio, medico, especialidade, prioridade, senha)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;

        const values = [nome_paciente, data_nascimento, consultorio, medico, especialidade, prioridade, senha];

        const { rows } = await pool.query(query, values);
        
        console.log("Paciente cadastrado:", rows[0]);

        res.status(201).send({ message: 'Paciente cadastrado com sucesso!', senha: rows[0].senha });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erro ao cadastrar paciente.' });
    }
});

// ✅ Rota para listar todos os pacientes (para o painel.html)
router.get('/pacientes', async (req, res) => {
    try {
        const query = `
            SELECT nome_paciente, 
                   TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento, 
                   consultorio, medico, especialidade, senha, prioridade 
            FROM pacientes 
            ORDER BY id DESC
        `;

        const { rows } = await pool.query(query);

        res.status(200).json(rows); // ✅ Retorna todos os pacientes para o painel.html
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erro ao buscar pacientes.' });
    }
});

// ✅ Rota para pegar o último paciente cadastrado (para o chamadas.html)
router.get('/ultimo-paciente', async (req, res) => {
    try {
        const query = `
            SELECT nome_paciente, 
                   TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento, 
                   consultorio, medico, especialidade, senha, prioridade 
            FROM pacientes 
            ORDER BY id DESC LIMIT 1
        `;

        const { rows } = await pool.query(query);
        
        if (rows.length === 0) {
            return res.status(404).send({ error: 'Nenhum paciente encontrado.' });
        }

        console.log("Último paciente chamado:", rows[0]); // Debug

        res.status(200).json(rows[0]); // ✅ Retorna JSON corretamente
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Erro ao buscar o último paciente.' });
    }
});

// Exportar as rotas corretamente
module.exports = router;
