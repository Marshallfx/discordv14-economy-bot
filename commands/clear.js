const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Belirtilen sayı kadar mesajı siler.')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Silinecek mesaj sayısı')
        .setRequired(true)),

  async execute(interaction) {
    const miktar = interaction.options.getInteger('miktar');

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
    }


    if (isNaN(miktar) || miktar <= 0) {
      return interaction.reply({ content: 'Geçerli bir sayı girmelisiniz.', ephemeral: true });
    }

    if (miktar > 100) {
      return interaction.reply({ content: 'En fazla 100 mesaj silebilirsiniz.', ephemeral: true });
    }

    try {
      const fetchedMessages = await interaction.channel.messages.fetch({ limit: miktar });
      await interaction.channel.bulkDelete(fetchedMessages);

      await interaction.reply({ content: `${miktar} mesaj başarıyla silindi.`, ephemeral: true });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.reply({ content: 'Mesajlar silinirken bir hata oluştu.', ephemeral: true });
    }
  },
};
