import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nanoid } from 'nanoid';

import { invitePlayer } from '../../helpers/botFunctions.js';

const data = new SlashCommandBuilder()
  .setName('inviteplayer')
  .setDescription('Invite a Player to the currently active game.')
  .addUserOption(option => option
    .setName('player')
    .setDescription('The player to invite')
    .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
  .setDMPermission(false);

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

async function execute(interaction, db) {
  const user = interaction.options.getUser('player');

  const game = interaction.client.activeGames.get(interaction.guildId);

  if(user.id === interaction.client.user.id) {
    await interaction.reply({ content: `I'm sorry, I am a bot, I cannot play Blood on the Clocktower.`, ephemeral: true });
    return;
  }

  if(!game) {
    await interaction.reply({ content: `There is no running game to invite ${user.username} to.`, ephemeral: true });
  }
  else {
    const auth = getAuth(interaction.client.gameAuthTokens, user.id, interaction.guildId);

    const member = interaction.options.getMember('player');

    invitePlayer(interaction.client, auth, user, member, game, interaction.guildId, interaction.guild.name);

    await interaction.reply({ content: `Invited ${user.username} to the game.`, ephemeral: true });
  }
};

export { data, execute };