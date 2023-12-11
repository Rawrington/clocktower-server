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

  // vote in progress
  if(game.voteInProgress) {
    return;
  }

  game.nomination.transition = json.transition;

  game.voteInProgress = true;

  if(json.countdown) {
    runVoteCountdown(game);
  }
  else {
    runVote(game);
  }
};

export {name, execute};