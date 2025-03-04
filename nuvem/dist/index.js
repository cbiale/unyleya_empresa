"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mqtt = __importStar(require("mqtt"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const cors_1 = __importDefault(require("cors"));
// definição de express e porta
const app = (0, express_1.default)();
const porta = 3000;
// middleware para permitir requisições entre domínios diferentes
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// conexão com o broker MQTT na nuvem
const cliente = mqtt.connect('mqtt://localhost:1885');
// conectar ao banco de dados SQLite
const db = new better_sqlite3_1.default("meu_banco.db", { verbose: console.log });
// criar tabela sensores se não existir
db.prepare(`CREATE TABLE IF NOT EXISTS sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispositivo INTEGER,
    data DATE, 
    presença INTEGER, 
    fumaça INTEGER, 
    gas INTEGER)`).run();
// criar tabela atuadores se não existir
db.prepare(`CREATE TABLE IF NOT EXISTS atuadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispositivo INTEGER,
    data DATE, 
    atuador STRING, 
    valor INTEGER)`).run();
// eu defino rotas
// de prova
app.get('/', (req, res) => {
    res.send('Servidor');
});
// rota para obter medições dos sensores do dispositivo {por ID de dispositivo}
// retorna todos os registros de sensores para um determinado dispositivo
app.get("/sensores/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const sensores = db.prepare("SELECT * FROM sensores WHERE dispositivo = ?").all(id);
    res.json(sensores);
});
// rota para obter o último estado dos sensores do dispositivo {por ID de dispositivo}
app.get("/sensores/:id/ultimo", (req, res) => {
    const id = parseInt(req.params.id);
    const sensores = db.prepare("SELECT * FROM sensores WHERE dispositivo = ? ORDER BY data DESC LIMIT 1").get(id);
    res.json(sensores || { message: "Nenhum dado encontrado para este dispositivo." });
});
// rota para obter estado dos atuadores do dispositivo {por ID de dispositivo}
// retorna todos os registros de atuadores para um determinado dispositivo
app.get("/atuadores/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const atuadores = db.prepare("SELECT * FROM atuadores WHERE dispositivo = ?").all(id);
    res.json(atuadores);
});
// rota para obter o último estado de cada tipo de atuador do dispositivo {por ID de dispositivo}
app.get("/atuadores/:id/ultimo", (req, res) => {
    const { id } = req.params;
    const atuadores = db.prepare(`
        SELECT datos.atuador, a.data, a.valor FROM
        (SELECT atuador, MAX(data) maximo FROM atuadores 
            WHERE dispositivo = ?
        GROUP BY atuador) datos,
        atuadores a
        WHERE a.dispositivo = ? AND a.atuador = datos.atuador AND a.data = datos.maximo`).all(id, id);
    res.json(atuadores.length ? atuadores : { message: "Nenhum dado encontrado para este dispositivo." });
});
// ao conectar-se ao broker na borda
cliente.on('connect', () => {
    console.log('[Servidor] Conectado ao broker MQTT na nuvem');
    cliente.subscribe('sensores/#', console.log);
    cliente.subscribe('atuadores/#', console.log);
});
//ao receber uma mensagem ao broker na nuvem
cliente.on('message', (topico, mensagem) => {
    // id dispositivo
    const idDispositivo = topico.split("/")[1];
    // controle topico sensores
    if (topico.indexOf('sensores') !== -1) {
        console.log(`[Servidor] Mensagem recebida: ${mensagem}. Topico: ${topico}`);
        // converter para o formato JSON
        let dados = JSON.parse(mensagem.toString());
        // guardar em banco de dados
        const stmt = db.prepare("INSERT INTO sensores (dispositivo, data, presença, fumaça, gas) VALUES (?, ?, ?, ?, ?)");
        stmt.run(idDispositivo, dados.data, dados.presença, dados.fumaça, dados.gas);
    }
    // controle topico atuadores
    if (topico.indexOf('atuadores') !== -1) {
        console.log(`[Servidor] Mensagem recebida: ${mensagem}. Topico: ${topico}`);
        // converter para o formato JSON
        let dados = JSON.parse(mensagem.toString());
        // guardar em banco de dados
        const stmt = db.prepare(`INSERT INTO atuadores (dispositivo, data, atuador, valor) VALUES (?, ?, ?, ?)`);
        stmt.run(idDispositivo, dados.data, dados.atuador, dados.valor);
    }
});
// iniciar o servidor na porta especificada
app.listen(porta, () => {
    console.log(`[Servidor] Servidor rodando em o porta: ${porta}`);
});
