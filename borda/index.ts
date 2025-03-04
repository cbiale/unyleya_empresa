import * as mqtt from 'mqtt';

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
clienteBorda.on('message', (topico : string, mensagem : Buffer) => {
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
        } else {
            // enviar mensagen a dispositivo para desativar atuador de presença
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'presença', valor: 0 }));
        }

        if (dados.fumaça === 1) {
            // enviar mensagen a dispositivo para ativar atuador de fumaça
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'fumaça', valor: 1 }));
        } else {
            // enviar mensagen a dispositivo para desativar atuador de fumaça
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'fumaça', valor: 0 }));
        }

        if (dados.gas === 1) {
            // enviar mensagen a dispositivo para ativar atuador de gás
            clienteBorda.publish(topicoControl, JSON.stringify({ atuador: 'gas', valor: 1 }));
        } else {
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

