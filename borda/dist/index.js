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
// conexão com o broker MQTT na borda
const clienteBorda = mqtt.connect('mqtt://localhost:1883');
// conexão com o broker MQTT na nuvem
const clienteNuvem = mqtt.connect('mqtt://localhost:1885');
// ao conectar-se ao broker na borda
clienteBorda.on('connect', () => {
    console.log('[Servidor] Conectado ao broker MQTT na borda');
    clienteBorda.subscribe('sensores/#', console.log);
    clienteBorda.subscribe('atuadores/#', console.log);
});
//ao receber uma mensagem ao broker na borda
clienteBorda.on('message', (topico, mensagem) => {
    // controle tópico sensores
    if (topico.indexOf('sensores') !== -1) {
        console.log(`[Servidor] Mensagem recebida: ${mensagem}. Topico: ${topico}`);
        // converter para o formato JSON
        let dados = JSON.parse(mensagem.toString());
        // id dispositivo
        const idDispositivo = topico.split("/")[1];
        // topico
        const topicoControl = `control/${idDispositivo}`;
        // data e hora atuais
        dados.data = new Date().toISOString();
        // motor de regras
        if (dados.presença === 1) {
            // enviar mensagen a dispositivo para ativar atuador de presença
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'presença', valor: 1 }));
        }
        else {
            // enviar mensagen a dispositivo para desativar atuador de presença
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'presença', valor: 0 }));
        }
        if (dados.fumaça === 1) {
            // enviar mensagen a dispositivo para ativar atuador de fumaça
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'fumaça', valor: 1 }));
        }
        else {
            // enviar mensagen a dispositivo para desativar atuador de fumaça
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'fumaça', valor: 0 }));
        }
        if (dados.gas === 1) {
            // enviar mensagen a dispositivo para ativar atuador de gás
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'gas', valor: 1 }));
        }
        else {
            // enviar mensagen a dispositivo para desativar atuador de gás
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'gas', valor: 0 }));
        }
        // publicar na nuvem
        clienteNuvem.publish(topico, JSON.stringify(dados));
    }
    // controle tópico atuadores
    if (topico.indexOf('atuadores') !== -1) {
        console.log(`[Servidor] Mensagem recebida: ${mensagem}. Topico: ${topico}`);
        // converter para o formato JSON
        let dados = JSON.parse(mensagem.toString());
        // data e hora atuais
        dados.data = new Date().toISOString();
        // publicar na nuvem
        clienteNuvem.publish(topico, JSON.stringify(dados));
    }
});
