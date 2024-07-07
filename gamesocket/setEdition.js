const name = 'setEdition';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import schema from '../helpers/script-schema.json' assert { type: 'json' };

import { getFabled } from '../helpers/gameFunctions.js'

const ajv = new Ajv2020({validateFormats: false, code: {esm: true}});

addFormats(ajv)

delete schema.items.oneOf[0].properties.special.items.properties.global.enum;

const validate = ajv.compile(schema);

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

  if (typeof json.edition === 'object') {
    // save a bunch of computation if edition isnt an object.
    if(!Array.isArray(json.edition)) {
      return;
    }

    json.edition = json.edition.map && json.edition.map((entry) => {
      if (typeof entry === 'object' && !Array.isArray(entry) && Object.keys(entry).length === 1 && entry.id) {
        return entry.id.replace(/[^A-Z]/ig, '').toLowerCase();
      }

      if(typeof entry === 'string') {
        return entry.replace(/[^A-Z]/ig, '').toLowerCase();
      }

      if (entry.id === '_meta' && entry.almanac) {
        delete entry.almanac;

        return entry;
      }

      if (entry.flavor) {
        delete entry.flavor;
      }

      if (entry.attribution) {
        delete entry.attribution;
      }

      return entry;
    });

    const valid = validate(json.edition)
    if (!valid) {
      ws.send(JSON.stringify({
        type: 'storytellerAlert',
        alert: 'The provided JSON is NOT a valid Blood on the Clocktower script, please validate it against the schema.',
      }));

      return;
    }
  }
  else if(typeof json.edition !== 'string') {
    //it's not a string either get em boys
    return;
  }

  // set fabled to any fabled listed on the script OR no fabled in play!
  game.fabled = typeof json.edition === 'object' ? (json.edition.filter(role => getFabled(role) || typeof role === 'object' && role.team === 'fabled').map(role => typeof role === 'string' ? role : role.id)) : [];

  // filter out default fabled so they dont show up in the edition object on the client
  game.edition = typeof json.edition === 'object' ? json.edition.filter(role => !getFabled(role)) : json.edition;

  game.customSpecials = typeof json.edition === 'object' ? (
    json.edition.reduce((specialsArray, role) => {
      if (typeof role === 'object' && role.id !== '_meta' && role.special) {
        return specialsArray.concat(role.special);
      }

      return specialsArray;
    }, [])
  ) : [];

  const message = {
    type: 'setEdition',
    edition: game.edition,
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));

    socket.send(JSON.stringify({
      type: 'setFabled',
      fabled: game.fabled,
    }));
  });
};

export {name, execute};