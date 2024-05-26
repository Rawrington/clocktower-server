import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nanoid } from 'nanoid'

const testPlayers = [
  {
    id: '1',
    name: 'Test1',
    activeSpecials: [],
  },
  {
    id: '2',
    name: 'Test2',
    activeSpecials: [],
  },
  {
    id: '3',
    name: 'Test3',
    activeSpecials: [],
  },
  {
    id: '4',
    name: 'Test4',
    activeSpecials: [],
  },
  {
    id: '5',
    name: 'Test5',
    activeSpecials: [],
  },
  {
    id: '6',
    name: 'Test6',
    activeSpecials: [],
  },
  {
    id: '7',
    name: 'Test7',
    activeSpecials: [],
  },
];

function getAuth(gameAuthTokens, playerId, guildId) {
  let lastAuth = false;

  gameAuthTokens.forEach((auth, token) => {
    if (auth.id === playerId && auth.game === guildId) {
      lastAuth = token;
    }
  });

  if (lastAuth !== false) {
    return lastAuth;
  }

  return nanoid();
}

const data = new SlashCommandBuilder()
  .setName('creategame')
  .setDescription('Creates a Clocktower game.')
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
  .setDMPermission(false);

async function execute(interaction, db) {
  const channel = interaction.options.getChannel('town-square');

  const game = interaction.client.activeGames.get(interaction.guildId);

  if(game) {
    await interaction.reply({ content: 'There is already a running game!', ephemeral: true });
  }
  else {
    if (interaction.guildId === '1180188559769092216') {
      testPlayers.forEach((user) => {
        interaction.client.gameAuthTokens.set(user.name, {
          id: user.id,
          game: interaction.guildId,
        });
      });
    }

    const newGame = {
      id: interaction.guildId,
      players: interaction.guildId === '1180188559769092216' ? [...testPlayers] : [],
      nomination: {
        nominator: {},
        nominated: {},
        hand: -1,
        open: false,
        running: false,
        over: false,
      },
      fabled: [],
      bluffs: [],
      timer: -1,
      storyteller: interaction.user.id,
      storytellerMember: interaction.member,
      edition: 'tb',
      votingHistory: [],
      night: false,
      daytracker: 0,
      customSpecials: [],
    };

    newGame.clients = new Map();

    newGame.createdAt = Date.now();

    const auth = nanoid();

    const url = 'https://zachevil.online/?token=' + auth;

    db.get('SELECT guild, night_category, town_square FROM bot_guilds WHERE guild = ?', [interaction.guildId], (err, row) => {
      newGame.nightCategory = row.night_category;
      newGame.townSquare = row.town_square;

      interaction.client.gameAuthTokens.set(auth, {
        id: interaction.user.id,
        game: interaction.guildId,
      });

      interaction.client.activeGames.set(interaction.guildId, newGame);
    });

    await interaction.reply({ content: `Created a Clocktower Game for this server! Your Link: ${url}`, ephemeral: true });
  }
};

export { data, execute };