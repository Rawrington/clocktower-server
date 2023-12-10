const name = 'authenticate';

import { canSeeVotes } from '../helpers/gameFunctions.js';

function execute(ws, json, activeGames, gameAuthTokens, timeout) {
  const authed = gameAuthTokens.get(json.token);

  if (authed) {
    const game = activeGames.get(authed.game);

    if(!game) {
      return;
    }

    const client = game.clients.get(authed.id);

    if(client && client !== ws && client.close) {
      console.log(`Closing old connection for user discord id: ${authed.id}`);
      client.close(); //remove duplicate client
    }

    ws.connectionTime = Math.floor((json.now - ws.connectionTime) / 1000);

    game.clients.set(authed.id, ws);

    const message = {
      type: 'syncGameState',
      players: game.players.map((player) => {
          const playerObj = {
            id: player.id,
            name: player.name,
            dead: player.dead,
            handUp: (canSeeVotes(game.customSpecials, game.players) || authed.id === game.storyteller || authed.id === player.id) ? player.handUp : false,
            voteLocked: (canSeeVotes(game.customSpecials, game.players) || authed.id === game.storyteller || authed.id === player.id) ?  player.voteLocked : false,
            usedGhostVote: player.usedGhostVote,
            marked: player.marked,
          };

          return playerObj;
        }),
      edition: game.edition,
      nomination: game.nomination,
      timer: game.timer + (ws.connectionTime * 1000),
      night: game.night,
      fabled: game.fabled,
      votingHistory: game.votingHistory,
      gameId: authed.game,
    }

    ws.send(JSON.stringify({
      type: 'authenticate',
      privilege: (game.storyteller === authed.id) ? 1 : 0,
      id: authed.id,
    }));

    ws.send(JSON.stringify(message));

    clearTimeout(timeout);
  }
  else {
    ws.close();
  }
};

export {name, execute};