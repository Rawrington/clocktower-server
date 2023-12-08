const name = 'storytellerAlert';

function execute(ws, json, activeGames) {
  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if(ws !== game.clients.get(json.myId)) {
    return;
  }

  if(json.myId != game.storyteller) {
    return;
  }

  const message = {
    type: 'storytellerAlert',
    alert: json.alert,
  };

  if (json.self) {
    ws.send(JSON.stringify(message));
    return;
  }

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};