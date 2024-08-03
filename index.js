const { Client, ActionRowBuilder, ButtonBuilder, EmbedBuilder, GatewayIntentBits, Collection, Partials, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId } = require('./config.json');
require('dotenv').config();
const mongoose = require('mongoose');
const Balance = require('./models/Balance');

const mongoURL = process.env.mongoURL;

mongoose.connect(mongoURL).then(() => {
  console.log("Connected to the database!");
}).catch((err) => {
  console.error('Failed to connect to the database:', err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (!command.data || !command.data.name) {
    console.error(`The command at ${filePath} is missing a required "data" or "name" property.`);
    continue;
  }
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

let token = process.env.token;

if (!token) {
  const config = require('./config.json');
  token = config.token;
}

if (!token) {
  console.error('Token bulunamadı. Lütfen .env dosyasında veya config.json dosyası içine token değerinizi tanımlayın.');
  process.exit(1);
}

client.once('ready', () => {
  console.log(`[ ONLINE ] - ${client.user.tag}`);
  client.user.setActivity('/yardım');

  const rest = new REST({ version: '10' }).setToken(token);
  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(clientId, guildId),
        { body: commands },
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  })();
});

function hasHigherRole(member, bot) {
  const botHighestRole = bot.roles.highest;
  const memberHighestRole = member.roles.highest;
  return memberHighestRole.comparePositionTo(botHighestRole) >= 0;
}

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'register') {
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

      const modal = new ModalBuilder()
        .setCustomId('registerModal')
        .setTitle('Kayıt Formu');

      const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('İsim')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(nameInput);

      modal.addComponents(firstRow);

      await interaction.showModal(modal);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'registerModal') {
      const name = interaction.fields.getTextInputValue('name');
      const member = interaction.member;

      const settingsPath = path.join(__dirname, 'settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      const guildSettings = settings.guilds[interaction.guild.id];
      if (!guildSettings) {
        return interaction.reply({ content: 'Sunucu ayarları bulunamadı.', ephemeral: true });
      }

      const role = interaction.guild.roles.cache.get(guildSettings.registerRole);
      if (role) {
        await member.roles.add(role);
      }

      await member.setNickname(`${name}`);
      await interaction.reply({ content: `Kayıt olduğunuz için teşekkürler, ${name}!`, ephemeral: true });
    }
  }
});

client.on('guildMemberAdd', async member => {
  const settingsPath = path.join(__dirname, 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

  const guildSettings = settings.guilds[member.guild.id];
  if (!guildSettings) return;

  const channel = member.guild.channels.cache.get(guildSettings.registerChannel);
  if (!channel) return;

  const button = new ButtonBuilder()
    .setCustomId('register')
    .setLabel('Kayıt Ol')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('👋 Hoş geldin!')
    .setDescription(guildSettings.registerMessage || `**Sunucumuza hoş geldin** ${member.toString()}! 👏\n\n**Kayıt olmak için aşağıdaki butonu kullanarak rol içinde kullanacağınız isim ve soy isminizi yazınız.**\n\n⚠️ **Alacağınız isim gerçek siyasetçilerin __isim ve soy ismi__ olmamalıdır.**`)
    .setThumbnail('https://i.imgur.com/UqOd4OP.jpeg')
    .setFooter({ text: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setTimestamp();

  channel.send({
    content: `${member}`,
    embeds: [welcomeEmbed],
    components: [row]
  });
});

client.login(token);
