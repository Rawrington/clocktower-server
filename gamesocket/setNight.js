import { moveToNightChannels, moveToDayChannel } from '../helpers/gameFunctions.js';

const name = 'setNight';

function execute(ws, json, activeGames, gameAuthTokens, timeout, client) {
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

  game.night = json.night;

  if(game.night) {
    moveToNightChannels(client, game);
  }
  else
  {
    moveToDayChannel(client, game);
  }

  const message = {
    type: 'setNight',
    night: json.night,
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};