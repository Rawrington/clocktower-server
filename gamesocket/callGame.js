const name = 'callGame';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  if (typeof json.result !== 'string') {
    return;
  }

  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if (ws !== game.clients.get(json.myId)) {
    return;
  }

  if (json.myId != game.storyteller) {
    return;
  }

  if (json.result !== 'good' && json.result !== 'evil') {
    return;
  }

  const message = {
    type: 'setGameEnd',
    result: {
      class: json.result,
      text: json.result === 'good' ? 'GOOD WINS' : 'EVIL WINS',
    },
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};