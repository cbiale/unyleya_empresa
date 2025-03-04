import express, { Express, Request, Response } from 'express';
import * as mqtt from 'mqtt';
import Database from "better-sqlite3";
import cors from "cors";

// definição de express e porta
const app: Express = express();
const porta : number = 3000;

// middleware para permitir requisições entre domínios diferentes
app.use(cors());
app.use(express.json());

// conexão com o broker MQTT na nuvem
const cliente = mqtt.connect('mqtt://localhost:1885');

// conectar ao banco de dados SQLite
const db = new Database("meu_banco.db", { verbose: console.log });

// criar tabela sensores se não existir
db.prepare(`CREATE TABLE IF NOT EXISTS sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispositivo INTEGER,
    data DATE, 
    presença INTEGER, 
    fumaça INTEGER, 
    gas INTEGER)").run();`);

// criar tabela atuadores se não existir
db.prepare(`CREATE TABLE IF NOT EXISTS atuadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispositivo INTEGER,
    data DATE, 
    atuador STRING, 
    valor INTEGER)").run();`);

// eu defino rotas
// de prova
app.get('/', (req: Request, res: Response) => {
    res.send('Servidor');
});

// rota para obter medições dos sensores do dispositivo {por ID de dispositivo}
// retorna todos os registros de sensores para um determinado dispositivo
app.get("/sensores/:id", (req: Request, res: Response) => {
    const id : number = parseInt(req.params.id);
    const sensores = db.prepare("SELECT * FROM sensores WHERE dispositivo = ?").all(id);
    res.json(sensores);
});

// rota para obter o último estado dos sensores do dispositivo {por ID de dispositivo}
app.get("/sensores/:id/ultimo", (req: Request, res: Response) => {
    const id : number = parseInt(req.params.id);
    const sensores = db.prepare("SELECT * FROM sensores WHERE dispositivo = ? ORDER BY data DESC LIMIT 1").get(id);
    res.json(sensores || { message: "Nenhum dado encontrado para este dispositivo." });
});

// rota para obter estado dos atuadores do dispositivo {por ID de dispositivo}
// retorna todos os registros de atuadores para um determinado dispositivo
app.get("/atuadores/:id", (req, res) => {
    const id : number = parseInt(req.params.id);
    const atuadores = db.prepare("SELECT * FROM atuadores WHERE dispositivo = ?").all(id);
    res.json(atuadores);
});

// rota para obter o último estado de cada tipo de atuador do dispositivo {por ID de dispositivo}
app.get("/atuadores/:id/ultimo", (req, res) => {
    const { id } = req.params;
    const atuadores = db.prepare(`SELECT * FROM atuadores 
            WHERE dispositivo = ? 
            AND data = (SELECT MAX(data) FROM atuadores WHERE dispositivo = ? AND atuador = atuadores.atuador)`
       ).all(id, id);
    res.json(atuadores.length ? atuadores : { message: "Nenhum dado encontrado para este dispositivo." });
});

// ao conectar-se ao broker na borda
cliente.on('connect', () => {
    console.log('[Servidor] Conectado ao broker MQTT na nuvem');
    cliente.subscribe('sensores/#', console.log);
    cliente.subscribe('atuadores/#', console.log); 
});

//ao receber uma mensagem ao broker na nuvem
cliente.on('message', (topico : string, mensagem : Buffer) => {

    // id dispositivo
    const idDispositivo = topico.split("/")[1];

    // controle topico sensores
    if (topico.indexOf('sensores') !== -1) {

        console.log(`[Servidor] Mensagem recebida: ${mensagem}. Topico: ${topico}`);

        // converter para o formato JSON
        let dados = JSON.parse(mensagem.toString());

        // guardar em banco de dados
        const stmt = db.prepare("INSERT INTO sensores (dispositivo, presença, fumaça, gas) VALUES (?, ?, ?, ?)");
        stmt.run(idDispositivo, dados.presença, dados.fumaça, dados.gas);
    }

    // controle topico atuadores
    if (topico.indexOf('atuadores') !== -1) {

        console.log(`[Servidor] Mensagem recebida: ${mensagem}. Topico: ${topico}`);

        // converter para o formato JSON
        let dados = JSON.parse(mensagem.toString());

        // guardar em banco de dados
        const stmt = db.prepare(`INSERT INTO atuadores (dispositivo, data, atuador, valor) VALUES (?, ?, ?)`);
        stmt.run(idDispositivo, dados.data, dados.atuador, dados.valor);

    }

});

// iniciar o servidor na porta especificada
app.listen(porta, () => {
    console.log(`[Servidor] Servidor rodando em o porta: ${porta}`);
});