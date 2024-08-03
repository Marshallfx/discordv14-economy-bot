const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı yasaklar.')
        .addUserOption(option => option.setName('hedef').setDescription('Yasaklanacak kullanıcı').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Yasaklama sebebi').setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        const hedef = interaction.options.getUser('hedef');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmemiş';

        const member = interaction.guild.members.cache.get(hedef.id);
        if (!member) {
            return interaction.reply({ content: 'Bu kullanıcı bulunamadı.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Kullanıcı Yasaklama')
            .setDescription(`${hedef.tag} adlı kullanıcıyı yasaklamak istediğinize emin misiniz?`)
            .addFields(
                { name: 'Sebep', value: sebep },
                { name: 'Yasaklanacak Kullanıcı', value: hedef.tag }
            )
            .setColor(0xFF0000);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ban_onayla')
                    .setLabel('Onayla')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ban_iptal')
                    .setLabel('İptal')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'ban_onayla') {
                try {
                    await member.ban({ reason: sebep });
                    await i.update({ content: `${hedef.tag} adlı kullanıcı yasaklandı.`, embeds: [], components: [] });

                    const logChannel = interaction.guild.channels.cache.get(config.logChannelId); // Log kanal ID'sini config.json dosyasından alıyor
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Kullanıcı Yasaklandı')
                            .addFields(
                                { name: 'Kullanıcı', value: `${hedef}` },
                                { name: 'Sebep', value: sebep },
                                { name: 'Yasaklayan', value: `${interaction.user}` }
                            )
                            .setColor(0xFF0000);
                        logChannel.send({ embeds: [logEmbed] });
                    }
                } catch (error) {
                    console.error(error);
                    await i.update({ content: 'Kullanıcıyı yasaklarken bir hata oluştu.', embeds: [], components: [] });
                }
            } else if (i.customId === 'ban_iptal') {
                await i.update({ content: 'Yasaklama işlemi iptal edildi.', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Yasaklama işlemi zaman aşımına uğradı.', embeds: [], components: [] });
            }
        });
    },
};
