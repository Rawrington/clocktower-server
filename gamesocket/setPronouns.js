const name = 'setPronouns';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }
  
  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if (ws !== game.clients.get(json.myId)) {
    return;
  }

  if (json.playerId !== json.myId && json.myId !== game.storyteller) {
    return;
  }

  const player = game.players.find(player => player.id === json.playerId);

  if(!player) {
    return;
  }

  player.pronouns = json.pronouns;

  const message = {
    type: 'updatePlayer',
    player: {
      id: player.id,
      pronouns: player.pronouns,
    },
  };

  game.clients.forEach((socket, id) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};