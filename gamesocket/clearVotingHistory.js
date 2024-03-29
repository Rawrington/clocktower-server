const name = 'clearVotingHistory';

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

  game.votingHistory = [];

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify({
      type: 'setVotingHistory',
      votingHistory: game.votingHistory,
    }));
  });
};

export {name, execute};