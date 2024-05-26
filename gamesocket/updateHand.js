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

  //right now only 0 - 2 and true/false are supported
  if (isNaN(json.hand) && typeof json.hand !== 'boolean') {
    return;
  }

  const player = game.players.find(player => player.id === json.myId);

  if(!player || player.voteLocked || player.voteLocked === 0 || (player.dead && player.usedGhostVote)) {
    return;
  }

  // validity check, this shouldnt happen but just incase it does!
  if (!player.activeSpecials.includes('doublevote')) {
    json.hand = !!json.hand;
  }
  else if (json.hand > 2) {
    json.hand = 2;
  }
  else if (json.hand < 0) {
    json.hand = 0;
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