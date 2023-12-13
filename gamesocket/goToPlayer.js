const name = 'goToPlayer';

import { moveStToPlayer } from '../helpers/gameFunctions.js';

function execute(ws, json, activeGames, gameAuthTokens, timeout, client) {
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

  if (ws !== game.clients.get(json.myId)) {
    return;
  }

  if (json.myId != game.storyteller) {
    return;
  }

  const player = game.players.find(player => player.id === json.player);

  if (!player) {
    return;
  }

  moveStToPlayer(client, game, game.storytellerMember, player.member);
};

export {name, execute};