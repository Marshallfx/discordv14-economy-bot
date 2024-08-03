const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Komutlar ve bilgileri gösterir'),
    async execute(interaction) {
        // Create the first embed
        const embed1 = new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Yardım Komutları - Sayfa 1')
            .setDescription('Mevcut komutların listesi:')
            .addFields(
                { name: '/yardım', value: 'Komutlar ve bilgileri gösterir' },
                { name: '/bakiye', value: 'Bakiyenizi görüntüleyebilirsiniz.' },
                { name: '/gönder', value: 'Paranızı istediğiniz birine gönderebilirsiniz.' },
                { name: '/maaş', value: 'Maaşınızı haftalık olarak alabilirsiniz.' },
                { name: '/sıralama', value: 'Sunucuda en fazla parası olan 10 kişiyi görüntüleyebilirsiniz.' },
                { name: '/yt', value: 'Yazı tura oynayabilirsiniz.' },
                { name: '/xox', value: 'Xox oynamak için üyelere istek gönderebilirsiniz.' }
            )
            .setTimestamp()
            .setFooter({ text: 'Bot Yardım Menüsü', iconURL: 'https://i.imgur.com/UqOd4OP.jpeg' });

        // Create the second embed
        const embed2 = new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Admin Komutları - Sayfa 2')
            .setDescription('Admin komutların listesi:')
            .addFields(
                { name: '/ban', value: 'Bir kullanıcıyı yasaklayabilirsiniz.' },
                { name: '/kick', value: 'Bir kullanıcıyı atabilirsiniz.' },
                { name: '/mute', value: 'Bir kullanıcıyı susturabilirsiniz.' },
                { name: '/timeout', value: 'Bir kullanıcıya zaman aşımı verebilirsiniz.' },
                { name: '/rolver', value: 'Bir kullanıcıya rol verebilirsiniz.' },
                { name: '/rolal', value: 'Bir kullanıcıdan rol alabilirsiniz.' }
            )
            .setTimestamp()
            .setFooter({ text: 'Bot Yardım Menüsü', iconURL: 'https://i.imgur.com/UqOd4OP.jpeg' });

        // Create the buttons
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Önceki')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Sonraki')
                    .setStyle(ButtonStyle.Primary)
            );

        try {
            // Send the initial message with the first embed and buttons
            const message = await interaction.reply({ embeds: [embed1], components: [buttons], fetchReply: true });

            // Create a collector to handle button interactions
            const filter = i => i.customId === 'next' || i.customId === 'previous';
            const collector = message.createMessageComponentCollector({ filter, time: 60000 }); // 60 seconds

            let currentPage = 0;

            collector.on('collect', async i => {
                try {
                    if (i.customId === 'next') {
                        currentPage++;
                    } else if (i.customId === 'previous') {
                        currentPage--;
                    }

                    // Update the buttons' disabled status based on the current page
                    const newButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous')
                                .setLabel('Önceki')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Sonraki')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 1)
                        );

                    // Update the embed based on the current page
                    const newEmbed = currentPage === 0 ? embed1 : embed2;

                    await i.update({ embeds: [newEmbed], components: [newButtons] });
                } catch (error) {
                    console.error('Error updating interaction:', error);
                    await i.followUp({ content: 'Bir hata oluştu, lütfen tekrar deneyin.', ephemeral: true });
                }
            });

            collector.on('end', async () => {
                // Disable the buttons when the collector ends
                const disabledButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Önceki')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Sonraki')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    );

                try {
                    await interaction.editReply({ components: [disabledButtons] });
                } catch (error) {
                    console.error('Error editing reply after collector ended:', error);
                }
            });
        } catch (error) {
            console.error('Error sending initial message:', error);
            await interaction.reply({ content: 'Bir hata oluştu, lütfen tekrar deneyin.', ephemeral: true });
        }
    },
};
