import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nanoid } from 'nanoid';

import { invitePlayer } from '../../helpers/botFunctions.js';

const data = new SlashCommandBuilder()
  .setName('invitechannel')
  .setDescription('Invite all players in voice channel')
  .addChannelOption(option => option
    .setName('voice-channel')
    .setDescription('The channel to invite players from.')
    .addChannelTypes(ChannelType.GuildVoice)
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
  const channel = interaction.options.getChannel('voice-channel');

  const game = interaction.client.activeGames.get(interaction.guildId);

  if(!game) {
    await interaction.reply({ content: `There is no running game to invite members in ${channel} to.`, ephemeral: true });
  }
  else {
    if (channel.members && channel.members.size > 0) {
      channel.members.forEach((member) => {
        const auth = getAuth(interaction.client.gameAuthTokens, member.id, interaction.guildId);

        invitePlayer(interaction.client, auth, member.user, member, game, interaction.guildId, interaction.guild.name);
      });
    }
  }

  await interaction.reply({ content: 'Invited all members in ${channel} to the game.', ephemeral: true });
};

export { data, execute };