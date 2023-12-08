import { assignRoles, sendOutRoles } from '../helpers/gameFunctions.js';

const name = 'assignRoles';

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

  if(assignRoles(game, json.selectedRoles)) {
    sendOutRoles(game);
    ws.send(JSON.stringify({
      type: 'closeMenu',
    }));
  }
  else
  {
    ws.send(JSON.stringify({
      type: 'showError',
      error: 'Number of available players does not match number of roles selected!',
    }))
  }
};

export {name, execute};