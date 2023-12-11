import { moveToDayChannel } from '../helpers/gameFunctions.js';

const name = 'summonToTown';

function execute(ws, json, activeGames, gameAuthTokens, timeout, client) {
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

  setTimeout(() => {
    moveToDayChannel(client, game);
  }, 1000);

  const message = {
    type: 'storytellerAlert',
    alert: json.alert,
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};