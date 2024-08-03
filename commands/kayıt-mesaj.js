const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kayıtmesaj')
        .setDescription('Kayıt mesajı ayarlar.')
        .addStringOption(option => option.setName('mesaj').setDescription('Kayıt mesajı').setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('mesaj');
        const settingsPath = path.join(__dirname, '..', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

        if (!settings.guilds) {
            settings.guilds = {};
        }

        if (!settings.guilds[interaction.guild.id]) {
            settings.guilds[interaction.guild.id] = {};
        }

        settings.guilds[interaction.guild.id].registerMessage = message;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        await interaction.reply('Kayıt mesajı ayarlandı.');
    },
};
