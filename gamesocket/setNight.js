import { moveToNightChannels, moveToDayChannel } from '../helpers/gameFunctions.js';

const name = 'setNight';

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

  game.night = json.night;

  if (game.night) {
    game.daytracker = game.daytracker + 1;

    if (game.daytracker > 1 && game.players.some(player => player.firstNight)) {
      game.players.forEach(player => {
        player.firstNight = false;
      });

      ws.send(JSON.stringify({
        type: 'updatePlayerList',
        players: game.players.map((player) => {
          return {
            id: player.id,
            firstNight: false,
          }
        }),
      }));
    }
  }

  if(json.discord) {
    if(game.night) {
      moveToNightChannels(client, game, 0);
    }
    else
    {
      moveToDayChannel(client, game);
    }
  }

  const message = {
    type: 'setNight',
    night: json.night,
    dayNumber: game.daytracker,
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};