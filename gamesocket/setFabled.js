const name = 'setFabled';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

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

  if (typeof json.fabled !== 'object' || !Array.isArray(json.fabled)) {
    return;
  }

  for (const role of json.fabled) {
    // the client performs role verification we just have to confirm the roles are actually well strings to avoid errors!
    if (typeof role !== 'string') {
      return;
    }
  }

  game.fabled = json.fabled;

  const message = {
    type: 'setFabled',
    fabled: json.fabled,
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};