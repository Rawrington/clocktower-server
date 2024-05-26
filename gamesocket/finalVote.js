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
  if (((Date.now() - player.lockedAt) > 150) || (!player.voteLocked && player.voteLocked !== 0)) {
    return;
  }

  if (!player.activeSpecials.includes('doublevote')) {
    json.hand = !!json.hand;
  }
  else if (json.hand > 2) {
    json.hand = 2;
  }
  else if (json.hand < 0) {
    json.hand = 0;
  }

  if (player.handUp !== json.hand) {
    player.handUp = json.hand;

    if (!player.handUp) {
      player.handUp = 0
    }

    game.nomination.voters.filter(voter => voter === player.id);

    // eventually this will be a for loop im just keeping it like this so i remember
    if (player.handUp) {
      game.nomination.voters.push(player.id);
      if (player.handUp === 2) {
        game.nomination.voters.push(player.id);
      }
    }
  }
  
  player.voteLocked = game.nomination.votes + json.hand;

  const message = {
    type: 'updatePlayer',
    player: {
      id: player.id,
      handUp: player.handUp,
      voteLocked: player.voteLocked,
    },
  };

  game.clients.forEach((socket, id) => {
    message.player.handUp = (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || id === game.storyteller || id === player.id) ? player.handUp : false;
    message.player.voteLocked = (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || id === game.storyteller || id === player.id) ? player.voteLocked : false;

    socket.send(JSON.stringify(message));
  });
};

export {name, execute};