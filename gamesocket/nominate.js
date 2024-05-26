const name = 'nominate';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  // nominator and nominated HAVE to be declared strings!
  if(typeof json.nominator !== 'string' || typeof json.nominated !== 'string') {
    return;
  }

  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if(ws !== game.clients.get(json.myId)) {
    return;
  }

  if(json.myId != game.storyteller && (json.nominator !== json.myId)) {
    return;
  }

  // nom in progress or not open
  if(!game.nomination.open || !isNaN(game.nomination.nominated.index)) {
    return;
  }

  const nominatedIndex = game.players.findIndex((player) => player.id === json.nominated);

  game.nomination.nominated = {
    index: nominatedIndex,
    name: nominatedIndex >= 0 ? (game.players[nominatedIndex].name) : (json.nominated),
  };

  const nominatorIndex = game.players.findIndex((player) => player.id === json.nominator);

  game.nomination.nominator = {
    index: nominatorIndex,
    name: nominatorIndex >= 0 ? (game.players[nominatorIndex].name) : (json.nominator),
  };

  game.nomination.hand = nominatedIndex;
  game.nomination.running = false;
  game.nomination.over = false;
  game.nomination.voters = [];
  game.nomination.votes = 0;

  const message = {
    type: 'setNomination',
    nomination: game.nomination,
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};