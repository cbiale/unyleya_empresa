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
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt = __importStar(require("mqtt"));
const cliente = mqtt.connect('mqtt://localhost:1883');
// argumento de linha de comando do id do dispositivo
const idDispositivo = parseInt(process.argv[2]);
// status dos atuadores
let atuador_presença = 0;
let atuador_gas = 0;
let atuador_fumaça = 0;
cliente.on('connect', () => {
    console.log('Conectado ao broker MQTT na borda');
    // eu assino o tópico de controle
    cliente.subscribe('control/#', console.log);
    // cada 30 segundos
    setInterval(() => {
        // valor aleatório para enviar do sensor de presença (0 ausência, 1 presença)
        const presença = Math.floor(Math.random() * 2);
        // valor aleatório para enviar do sensor de fumaça (0 ausência, 1 presença)
        const fumaça = Math.floor(Math.random() * 2);
        // valor aleatório para enviar do sensor de gás (0 ausência, 1 presença)
        const gas = Math.floor(Math.random() * 2);
        // mensagem a enviar
        const mensagem = JSON.stringify({ presença, fumaça, gas });
        // publica a mensagem
        cliente.publish(`sensores/${idDispositivo}`, mensagem);
        console.log(`Nova mensagem postada pelo id ${idDispositivo}: ${mensagem}`);
    }, 30000);
});
cliente.on('message', (topico, mensagem) => {
    // controle tópico
    if (topico.indexOf('control') !== -1) {
        console.log(`Mensagem recebida: ${mensagem}. Topico: ${topico}`);
        // converter para o formato JSON
        const dados = JSON.parse(mensagem.toString());
        let atuador = dados.atuador; // campo do atuador para alterar
        let valor = dados.valor; // novo valor
        let cambio = false;
        if (atuador === 'presença' && valor !== atuador_presença) {
            atuador_presença = valor;
            cambio = true;
        }
        else if (atuador === 'fumaça' && valor !== atuador_fumaça) {
            atuador_fumaça = valor;
            cambio = true;
        }
        else if (atuador === 'gas' && valor !== atuador_gas) {
            atuador_gas = valor;
            cambio = true;
        }
        if (cambio === true) {
            console.log(`Novo estado dos atuadores: presença: ${atuador_presença}, fumaça: ${atuador_fumaça}, gas: ${atuador_gas}`);
            // publica a mensagem
            cliente.publish(`atuadores/${idDispositivo}`, JSON.stringify({ atuador, valor }));
        }
    }
});
