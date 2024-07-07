const name = 'removePlayer';

function execute(ws, json, activeGames, gameAuthTokens) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  // player is just a player id (string) its fine to leave but it means we dont have to perform computation if the client sends junk (as usuaL)
  if (typeof json.player !== 'string') {
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

  game.players = game.players.filter(player => player.id !== json.player);

  let lastAuth = false;

  gameAuthTokens.forEach((auth, token) => {
    if (auth.id === json.player && auth.game === json.gameId) {
      lastAuth = token;
    }
  });

  if (lastAuth) {
    gameAuthTokens.delete(lastAuth);
  }

  const client = game.clients.get(json.player);

  if (client && client.close) {
    client.close();
  }

  game.clients.delete(json.player);

  game.clients.forEach((ws) => {
    ws.send(JSON.stringify({
      type: 'updatePlayerList',
      players: game.players.map((player) => {
        return {
          id: player.id,
          name: player.name,
          dead: player.dead,
          handUp: player.handUp,
          voteLocked: player.voteLocked,
          marked: player.marked,
        }
      }),
    }));
  });
};

export {name, execute};