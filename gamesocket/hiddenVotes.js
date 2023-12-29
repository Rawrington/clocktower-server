const name = 'hiddenVotes';

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

  //it is either a bool or a string or undefined, but not anything else.
  if(json.forceHidden && typeof json.forceHidden !== 'string' && typeof json.forceHidden !== 'boolean') {
    return;
  }

  game.forceHidden = json.forceHidden;
};

export {name, execute};