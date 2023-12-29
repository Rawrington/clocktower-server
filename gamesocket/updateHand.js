const name = 'updateHand';

import { canSeeVotes } from '../helpers/gameFunctions.js';

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

  if (isNaN(game.nomination.nominated.index)) {
    return;
  }

  const player = game.players.find(player => player.id === json.myId);

  if(!player || player.voteLocked || (player.dead && player.usedGhostVote)) {
    return;
  }

  player.handUp = json.hand;

  const message = {
    type: 'updatePlayer',
    player: {
      id: player.id,
      handUp: player.handUp,
    },
  };

  game.clients.forEach((socket, id) => {
    message.player.handUp = (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || id === game.storyteller || id === player.id) ? player.handUp : false;
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};