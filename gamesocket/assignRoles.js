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

  if (json.selectedRoles) {
    if (assignRoles(game, json.selectedRoles)) {
      sendOutRoles(game, json.sendRolesToPlayers);

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
  }
  else {
    sendOutRoles(game, json.sendRolesToPlayers);
  }
};

export {name, execute};