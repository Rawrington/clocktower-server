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

  // selectedRoles needs to be an ARRAY of roles
  if (json.selectedRoles && (typeof json.selectedRoles !== 'object' || !Array.isArray(json.selectedRoles))) {
    return;
  }

  if (json.selectedRoles) {
    // check we have an array of roles
    for (const role of json.selectedRoles) {
      // the client performs role verification we just have to confirm the roles are actually well strings to avoid errors!
      if (typeof role !== 'string') {
        return;
      }
    }

    if (assignRoles(game, json.selectedRoles)) {
      sendOutRoles(game, json.sendRolesToPlayers);

      ws.send(JSON.stringify({
        type: 'closeMenu',
      }));
    }
    else
    {
      ws.send(JSON.stringify({
        type: 'storytellerAlert',
        error: 'Number of available players does not match number of roles selected!',
      }))
    }
  }
  else {
    sendOutRoles(game, json.sendRolesToPlayers);
  }
};

export {name, execute};