import { runVoteCountdown, runVote } from '../helpers/gameFunctions.js';

const name = 'startVote';

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

  if(json.myId != game.storyteller) {
    return;
  }

  if(isNaN(json.transition) || Number(json.transition) > 3 || Number(json.transition) < 0.5) {
    return;
  }

  //it is either a bool or a string or undefined, but not anything else.
  if(json.forceHidden && typeof json.forceHidden !== 'string' && typeof json.forceHidden !== 'boolean') {
    return;
  }

  // vote in progress
  if(game.voteInProgress) {
    return;
  }

  game.nomination.transition = Number(json.transition);

  game.forceHidden = json.forceHidden;

  game.voteInProgress = true;

  if(json.countdown) {
    runVoteCountdown(game);
  }
  else {
    runVote(game);
  }
};

export {name, execute};