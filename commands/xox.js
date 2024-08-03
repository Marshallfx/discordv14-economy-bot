const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xox')
    .setDescription('XOX oyunu başlatır.')
    .addUserOption(option =>
      option.setName('rakip')
        .setDescription('Oynamak istediğiniz rakibi seçin')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('bahis')
        .setDescription('Bahis miktarını girin')
        .setRequired(true)),

  async execute(interaction) {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('rakip');
    const bahis = interaction.options.getNumber('bahis');
    const guildId = interaction.guild.id;

    if (opponent.bot) {
      return interaction.reply({ content: 'Botlarla oynayamazsınız!', ephemeral: true });
    }

    if (isNaN(bahis) || bahis <= 0) {
      await interaction.reply('Geçerli bir bahis miktarı girmelisiniz.');
      return;
    }

    try {
      const challengerData = await Balance.findOne({ userId: challenger.id, guildId: guildId });
      const opponentData = await Balance.findOne({ userId: opponent.id, guildId: guildId });

      if (!challengerData || challengerData.balance < bahis) {
        await interaction.reply('Yeterli paran yok.');
        return;
      }

      if (!opponentData || opponentData.balance < bahis) {
        await interaction.reply('Rakibin yeterli parası yok.');
        return;
      }

      const confirmEmbed = new EmbedBuilder()
        .setTitle('XOX Oyunu')
        .setThumbnail('https://i.imgur.com/UqOd4OP.jpeg')
        .setDescription(`${opponent}, ${challenger} ile ${bahis} TL bahisle XOX oynamak ister misin?`)
        .setColor(0x00AE86);

      const confirmButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('accept')
          .setLabel('Kabul Et')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('decline')
          .setLabel('Reddet')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmButtons]
      });

      const filter = i => (i.customId === 'accept' || i.customId === 'decline') && i.user.id === opponent.id;
      const confirmCollector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

      confirmCollector.on('collect', async i => {
        if (i.customId === 'accept') {
          await i.update({ content: `${opponent} oyunu kabul etti! Oyun başlıyor...`, components: [] });

          // Bahis miktarını her iki oyuncudan düş
          challengerData.balance -= bahis;
          opponentData.balance -= bahis;
          await challengerData.save();
          await opponentData.save();

          const emptyBoard = [
            [' ', ' ', ' '],
            [' ', ' ', ' '],
            [' ', ' ', ' ']
          ];

          let board = JSON.parse(JSON.stringify(emptyBoard));
          let currentPlayer = challenger;
          let gameActive = true;

          const renderBoard = (board) => {
            return board.map(row => row.join('')).join('\n');
          };

          const checkWin = (board) => {
            for (let i = 0; i < 3; i++) {
              if (board[i][0] === board[i][1] && board[i][1] === board[i][2] && board[i][0] !== ' ') {
                return true;
              }
              if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i] !== ' ') {
                return true;
              }
            }
            if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== ' ') {
              return true;
            }
            if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== ' ') {
              return true;
            }
            return false;
          };

          const checkTie = (board) => {
            return board.flat().every(cell => cell !== ' ');
          };

          const createButtonComponents = (board) => {
            return board.map((row, rowIndex) => {
              const rowComponent = new ActionRowBuilder().addComponents(
                ...row.map((cell, colIndex) => new ButtonBuilder()
                  .setCustomId(`cell_${rowIndex}_${colIndex}`)
                  .setLabel(cell === ' ' ? '\u200B' : cell)
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(cell !== ' ')
                )
              );
              return rowComponent;
            });
          };

          const embed = new EmbedBuilder()
            .setTitle('XOX Oyunu')
            .setDescription(`Sıradaki oyuncu: ${currentPlayer.tag}`)
            .setColor(0x00AE86);

          await interaction.followUp({
            embeds: [embed],
            components: createButtonComponents(board)
          });

          const gameFilter = i => i.customId.startsWith('cell_') && (i.user.id === challenger.id || i.user.id === opponent.id);
          const gameCollector = interaction.channel.createMessageComponentCollector({ filter: gameFilter, time: 60000 });

          gameCollector.on('collect', async i => {
            if (!gameActive) return;

            if (i.user.id !== currentPlayer.id) {
              return i.reply({ content: `Sıranız değil!`, ephemeral: true });
            }

            const [_, row, col] = i.customId.split('_').map(Number);

            if (board[row][col] === ' ') {
              board[row][col] = currentPlayer === challenger ? 'X' : 'O';
              if (checkWin(board)) {
                gameActive = false;
                const winner = currentPlayer === challenger ? challenger.id : opponent.id;

                const winnerData = await Balance.findOne({ userId: winner, guildId: guildId });
                winnerData.balance += bahis * 2;
                await winnerData.save();

                embed.setDescription(`Oyun bitti! Kazanan: ${currentPlayer.tag}`);
                await i.update({ embeds: [embed], components: createButtonComponents(board) });
                return;
              }
              if (checkTie(board)) {
                gameActive = false;
                challengerData.balance += bahis;
                opponentData.balance += bahis;
                await challengerData.save();
                await opponentData.save();

                embed.setDescription(`Oyun bitti! Berabere!`);
                await i.update({ embeds: [embed], components: createButtonComponents(board) });
                return;
              }
              currentPlayer = currentPlayer === challenger ? opponent : challenger;
              embed.setDescription(`Sıradaki oyuncu: ${currentPlayer.tag}`);
              await i.update({ embeds: [embed], components: createButtonComponents(board) });
            }
          });

          gameCollector.on('end', collected => {
            if (gameActive) {
              embed.setDescription('Oyun süresi doldu! Berabere!');
              interaction.followUp({ embeds: [embed] });
            }
          });

        } else {
          await i.update({ content: `${opponent} oyunu reddetti.`, components: [] });
        }
      });

      confirmCollector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp({ content: `${opponent} oyunu yanıtlamadı.`, components: [] });
        }
      });

    } catch (error) {
      console.error('Error executing command:', error);
      await interaction.reply('Bir hata oluştu.');
    }
  },
};
