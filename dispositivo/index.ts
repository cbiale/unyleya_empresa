import * as mqtt from 'mqtt';

// conexão com o broker MQTT na borda
const cliente = mqtt.connect('mqtt://localhost:1883');

// argumento de linha de comando do id do dispositivo
const idDispositivo : number = parseInt(process.argv[2]);

// status dos atuadores
let atuador_presença : number = 0;
let atuador_gas : number = 0;
let atuador_fumaça : number = 0;

// ao conectar-se ao broker na borda
cliente.on('connect', () => {
    console.log('Conectado ao broker MQTT na borda');
    // eu assino o tópico de controle
    cliente.subscribe('control/#', console.log); 

    // cada 30 segundos
    setInterval(() => {
        // valor aleatório para enviar do sensor de presença (0 ausência, 1 presença)
        const presença : number = Math.floor(Math.random() * 2);
        // valor aleatório para enviar do sensor de fumaça (0 ausência, 1 presença)
        const fumaça : number = Math.floor(Math.random() * 2);
        // valor aleatório para enviar do sensor de gás (0 ausência, 1 presença)
        const gas : number = Math.floor(Math.random() * 2);
        // mensagem a enviar
        const mensagem : string = JSON.stringify({ presença, fumaça, gas });
        // publica a mensagem
        cliente.publish(`sensores/${idDispositivo}`, mensagem);
        console.log(`Nova mensagem postada pelo id ${idDispositivo}: ${mensagem}`);
    }, 30000);
});

cliente.on('message', (topico : string, mensagem : Buffer) => {
    // controle tópico
    if (topico.indexOf('control') !== -1) {
        console.log(`Mensagem recebida: ${mensagem}. Topico: ${topico}`);

        // converter para o formato JSON
        const dados = JSON.parse(mensagem.toString());

        let atuador : string = dados.atuador; // campo do atuador para alterar
        let valor : number = dados.valor; // novo valor
        let cambio : boolean = false;

        if (atuador === 'presença' && valor !== atuador_presença) {
            atuador_presença = valor;
            cambio = true;
        } else if (atuador === 'fumaça' && valor !== atuador_fumaça) {
            atuador_fumaça = valor;
            cambio = true;
        } else if (atuador === 'gas' && valor !== atuador_gas) {
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
