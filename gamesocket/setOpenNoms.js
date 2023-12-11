const name = 'setOpenNoms';

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

  game.nomination.open = json.open;

  const message = {
    type: 'setNomination',
    nomination: {
      open: json.open,
    },
  };

  if (!json.open) {
    game.players.forEach((player) => {
      player.marked = false;
    });
  }

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));

    if (!json.open) {
      socket.send(JSON.stringify({
        type: 'clearMarked',
      }));
    }
  });
};

export {name, execute};