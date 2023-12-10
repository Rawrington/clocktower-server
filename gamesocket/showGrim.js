const name = 'showGrim';

import { getSpecial } from '../helpers/gameFunctions.js';

function execute(ws, json, activeGames) {
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

  const player = game.players.find(player => player.id === json.player);

  if(!player) {
    return;
  }

  console.log('psock');

  const pSock = game.clients.get(player.id);

  if (!json.show) {
    delete game.stNotes;

    player.hasGrim = false;

    if (pSock && pSock.send) {
      pSock.send(JSON.stringify({
        type: 'storytellerGrim',
        players: false,
        notes: false,
      }));
    }

    ws.send(JSON.stringify({
      type: 'updatePlayer',
      player: {
        id: player.id,
        hasGrim: false,
      },
    }));
  }
  else {
    const special = getSpecial(game.customSpecials, player.role, 'signal', 'grimoire');

    if (!special) {
      return;
    }

    if (special.time === 'night' && game.night) {
      player.hasGrim = true;

      game.stNotes = json.notes;

      if (pSock && pSock.send) {
        pSock.send(JSON.stringify({
          type: 'storytellerGrim',
          players: game.players,
          notes: game.stNotes,
        }));
      }

      ws.send(JSON.stringify({
        type: 'updatePlayer',
        player: {
          id: player.id,
          hasGrim: true,
        },
      }));
    }
  }
};

export {name, execute};