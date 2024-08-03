const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yt')
    .setDescription('Yazı tura oynamanızı sağlar.')
    .addNumberOption(option =>
      option.setName('bahis')
        .setDescription('Bahis miktarını girin')
        .setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const bahis = interaction.options.getNumber('bahis');

    if (isNaN(bahis) || bahis <= 0) {
      await interaction.reply('Geçerli bir bahis miktarı girmelisiniz.');
      return;
    }

    try {
      let userBalance = await Balance.findOne({ userId: userId, guildId: guildId });

      if (!userBalance) {
        userBalance = new Balance({ userId: userId, guildId: guildId, balance: 0 });
        await userBalance.save();
      }

      if (userBalance.balance < bahis) {
        await interaction.reply('Yeterli paranız yok.');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Yazı Tura Oyunu')
        .setDescription('Yazı mı tura mı seçeceksiniz?')
        .setColor(0x00AE86);

      const yazıButton = new ButtonBuilder()
        .setCustomId('yazi')
        .setLabel('Yazı')
        .setStyle(ButtonStyle.Primary);

      const turaButton = new ButtonBuilder()
        .setCustomId('tura')
        .setLabel('Tura')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(yazıButton, turaButton);

      await interaction.reply({ embeds: [embed], components: [row] });

      const filter = i => i.user.id === userId;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

      collector.on('collect', async i => {
        await i.deferUpdate();

        const loadingEmbed = new EmbedBuilder()
          .setTitle('Yazı Tura Oyunu')
          .setDescription('Yazı tura atılıyor...')
          .setColor(0x00AE86)
          .setThumbnail('https://i.imgur.com/llF5iyg.gif'); // Loading gif

        await i.editReply({ embeds: [loadingEmbed], components: [] });

        setTimeout(async () => {
          const hobala = Math.random() < 0.5 ? 'yazi' : 'tura';
          const kazandi = i.customId === hobala;
          const kazanc = kazandi ? bahis * 1.1 : -bahis;

          userBalance.balance += kazanc;
          await userBalance.save();

          const resultEmbed = new EmbedBuilder()
            .setTitle('Yazı Tura Sonucu')
            .setDescription(`Sonuç **${hobala === 'yazi' ? 'Yazı' : 'Tura'}**! ${kazandi ? `Tebrikler, ${bahis * 1.1} TL kazandınız.` : ` ${bahis} TL kaybettiniz.`}`)
            .setColor(kazandi ? 0x00FF00 : 0xFF0000);

          await i.editReply({ embeds: [resultEmbed], components: [] });
        }, 4000);
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ content: 'Yazı tura oynamak için süre doldu.', components: [] });
        }
      });

    } catch (error) {
      console.error('Error executing command:', error);
      await interaction.reply('Bir hata oluştu.');
    }
  },
};
