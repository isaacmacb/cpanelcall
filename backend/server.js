const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Para manipular caminhos de arquivos
const cors = require('cors'); // Importa o CORS
const pacientesRoutes = require('./routes/pacientes'); // Importa as rotas de pacientes

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do mecanismo de visualização (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Define o diretório de views

// Configuração do CORS
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Permitir requisições apenas dessa origem
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type'], // Cabeçalhos permitidos
}));

// Middleware para arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para manipular JSON e formulários
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas relacionadas à API de pacientes
app.use('/api', pacientesRoutes);

// Rotas para as páginas EJS
app.get('/cadastro', (req, res) => {
    res.render('cadastro'); // Renderiza o arquivo cadastro.ejs
});

app.get('/painel', async (req, res) => {
    try {
        // Busca todos os pacientes do banco de dados
        const { Pool } = require('pg');
        const pool = new Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
        });

        const { rows } = await pool.query('SELECT * FROM pacientes ORDER BY id DESC');
        res.render('painel', { pacientes: rows }); // Passa os pacientes para o painel.ejs
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar o painel.');
    }
});

app.get('/chamada', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pacientes ORDER BY id DESC LIMIT 1');
        
        if (rows.length > 0) {
            // Formatar a data para YYYY-MM-DD
            rows[0].data_nascimento = new Date(rows[0].data_nascimento)
                .toLocaleDateString('en-CA'); // 'en-CA' garante o formato YYYY-MM-DD
        }

        res.render('chamada', { paciente: rows[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar o último paciente.');
    }
});



// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
