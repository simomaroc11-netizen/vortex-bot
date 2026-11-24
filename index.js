require('dotenv').config();
const crypto = require('crypto');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || '1574853796893560984';

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN in environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function generateThreeHourKey() {
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  const expiresAt = Date.now() + 3 * 60 * 60 * 1000;
  const expiresUnix = Math.floor(expiresAt / 1000);
  return {
    key: `VORTEX-3H-${randomPart}`,
    expiresAt,
    expiresUnix
  };
}

function buildKeyEmbed(keyData, userId) {
  return new EmbedBuilder()
    .setColor(0xff2a55)
    .setTitle('VORTEX 👺 — 3-Hour Key')
    .setDescription(
      `Key generated for <@${userId}>:\n\`\`\`${keyData.key}\`\`\`\n` +
      `**Duration:** 3 Hours\n` +
      `**Expires:** <t:${keyData.expiresUnix}:R> (<t:${keyData.expiresUnix}:f>)`
    )
    .setFooter({ text: 'VORTEX Bot • Valid for 3 hours' })
    .setTimestamp();
}

function buildKeyButtonRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vortex_gen_3h_key')
      .setLabel('Generate 3h Key')
      .setStyle(ButtonStyle.Danger)
  );
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('genkey')
      .setDescription('Generate a 3-hour VORTEX key')
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Slash command /genkey registered.');
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    await registerCommands();
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'genkey') {
      const keyData = generateThreeHourKey();
      await interaction.reply({
        embeds: [buildKeyEmbed(keyData, interaction.user.id)],
        components: [buildKeyButtonRow()],
        ephemeral: true
      });
      return;
    }

    if (interaction.isButton() && interaction.customId === 'vortex_gen_3h_key') {
      const keyData = generateThreeHourKey();
      await interaction.reply({
        embeds: [buildKeyEmbed(keyData, interaction.user.id)],
        components: [buildKeyButtonRow()],
        ephemeral: true
      });
    }
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Error generating key.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: 'Error generating key.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(TOKEN);

