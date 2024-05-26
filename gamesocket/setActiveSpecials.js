const name = 'setActiveSpecials';

// the storytellers client is the authorative source for activeSpecials (from tokens)
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

  if(json.myId !== game.storyteller) {
    return;
  }

  // player is just a player id (string) its fine to leave but it means we dont have to perform computation if the client sends junk (as usuaL)
  if (typeof json.player !== 'string') {
    return;
  }

  if (!Array.isArray(json.activeSpecials)) {
    return;
  }

  const player = game.players.find(player => player.id === json.player);

  player.activeSpecials = json.activeSpecials;

  const message = {
    type: 'setActiveSpecials',
    activeSpecials: player.activeSpecials,
  };

  const sock = game.clients.get(json.player);

  if (sock) {
    sock.send(JSON.stringify(message));
  }
};

export {name, execute};