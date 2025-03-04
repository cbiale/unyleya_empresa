printf "Iniciando contêineres....\n"
docker run -d --name emqx_borda -p 1883:1883 -p 18083:18083  emqx:5.0.24
docker run -d --name emqx_nuvem -p 1885:1883 -p 18085:18083  emqx:5.0.24
printf "Contêiner iniciado!\n"