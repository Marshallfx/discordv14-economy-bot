const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gönder')
        .setDescription('Başka bir kullanıcıya para gönderirsiniz.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Para göndereceğiniz kullanıcıyı seçin.')
                .setRequired(true))
        .addNumberOption(option => 
            option.setName('miktar')
                .setDescription('Göndermek istediğiniz para miktarını girin.')
                .setRequired(true)),

    async execute(interaction) {
        const senderId = interaction.user.id;
        const guildId = interaction.guild.id;
        const receiver = interaction.options.getUser('kullanici');
        const receiverId = receiver.id;
        const amount = interaction.options.getNumber('miktar');

        if (senderId === receiverId) {
            await interaction.reply('Kendinize para gönderemezsiniz.');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            await interaction.reply('Geçerli bir miktar girmelisiniz.');
            return;
        }

        try {
            const senderData = await Balance.findOne({ userId: senderId, guildId: guildId });
            const receiverData = await Balance.findOne({ userId: receiverId, guildId: guildId });

            if (!senderData || senderData.balance < amount) {
                await interaction.reply('Yeterli paranız yok.');
                return;
            }

            senderData.balance -= amount;
            await senderData.save();

            if (!receiverData) {
                const newUser = new Balance({ userId: receiverId, guildId: guildId, balance: amount });
                await newUser.save();
            } else {
                receiverData.balance += amount;
                await receiverData.save();
            }

            const embed = new EmbedBuilder()
                .setTitle('Para Gönderme İşlemi')
                .setColor(0x00AE86)
                .setDescription(`<@${interaction.user.id}> kullanıcısı, <@${receiver.id}> kullanıcısına **${amount} TL** gönderdi.`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply('Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
        }
    },
};
