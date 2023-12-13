const name = 'finalVote';

import { canSeeVotes } from '../helpers/gameFunctions.js';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  // all other values are booleans so...

  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if(ws !== game.clients.get(json.myId)) {
    return;
  }

  if (!game.voteInProgress) {
    return;
  }

  const player = game.players.find(player => player.id === json.myId);

  if(!player) {
    return;
  }

  // over 0.15s
  if (((Date.now() - player.lockedAt) > 150) || !player.voteLocked) {
    return;
  }

  player.handUp = json.hand;
  player.voteLocked = true;

  const message = {
    type: 'updatePlayer',
    player: {
      id: player.id,
      handUp: player.handUp,
      voteLocked: true,
    },
  };

  game.clients.forEach((socket, id) => {
    message.player.handUp = (canSeeVotes(game.players, game.customSpecials) || id === game.storyteller || id === player.id) ? player.handUp : false;
    message.player.voteLocked = (canSeeVotes(game.players, game.customSpecials) || id === game.storyteller || id === player.id) ? true : false;

    socket.send(JSON.stringify(message));
  });
};

export {name, execute};