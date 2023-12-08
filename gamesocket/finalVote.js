const name = 'finalVote';

function execute(ws, json, activeGames) {
  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if(ws !== game.clients.get(json.myId)) {
    return;
  }

  if (!game.voteInProgress) {
    return;
  }

  const player = game.players.find(player => player.id === json.myId);

  if(!player) {
    return;
  }

  // over 0.15s
  if (((Date.now() - player.lockedAt) > 150) || !player.voteLocked) {
    return;
  }

  player.handUp = json.hand;
  player.voteLocked = true;

  const message = {
    type: 'updatePlayer',
    player: {
      id: player.id,
      handUp: player.handUp,
      voteLocked: true,
    },
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};