# Redes e protocolos de comunicação para IoT
## Curso de Pós-Graduação Lato Sensu em Agricultura Digital
## Facultade Unyleya

### Professor Conteudista: Jorge Umberto Scatolin Marques
### Estudante: Claudio Omar Biale

No diretório `dispositivo` há uma aplicação implementada em TypeScript que publica o status dos sensores usando o tópico `sensores/id` onde `id` corresponde ao identificador que representa o dispositivo no sistema. Por outro lado, ele escuta no tópico `control/id` para receber mudanças em seus atuadores de acordo com o mecanismo de regras do nó de borda. Se mudanças ocorrerem em qualquer atuador, ele as publica no tópico `atuadores/id`.

No diretório `borda` há uma aplicação desenvolvida em Typescript que define um servidor de borda que possui um sistema de regras que gerencia os atuadores dos dispositivos e envia os dados para a nuvem. Para fazer isso, ele escuta os tópicos `sensores/#` e `atuadores/id` e se conecta a dois brokers, um localizado na borda e o outro na nuvem. Quando os dados chegam sobre os tópicos, eles são encaminhados para o servidor em nuvem para armazenamento dos dados.

No diretório `nuvem` há uma aplicação desenvolvida em Typescript que define um servidor de nuvem que permite obter o status dos dispositivos e armazena os dados recebidos dos nós na borda. Para isso, foi implementado um servidor usando Express que escuta na porta 3000. O servidor se conecta a um broker MQTT na nuvem e assina os tópicos `sensores/#` e `atuadores/id`. Quando recebe dados publicados nesses tópicos, ele os armazena em um banco de dados sqlite. Os pontos finais da aplicação são:
- `/sensores/:id`: Obtém medições dos sensores do dispositivo.
- `/sensores/:id/ultimo`: Obtém o último estado dos sensores do dispositivo.
- `/atuadores/:id`: Obtém estados dos atuadores do dispositivo.
- `/atuadores/:id/ultimo`: Obtém o último estado dos atuadores do dispositivo.

O arquivo `start_broker.sh` inicia os contêineres EMQX correspondentes aos brokers de nuvem e de borda.
