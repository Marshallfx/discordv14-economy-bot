const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolal')
        .setDescription('Bir kullanıcıdan rol alır.')
        .addUserOption(option => option.setName('hedef').setDescription('Rol alınacak kullanıcı').setRequired(true))
        .addRoleOption(option => option.setName('rol').setDescription('Alınacak rol').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply(); // Interaction'ı ertele

        const admin = interaction.user;
        const target = interaction.options.getUser('hedef');
        const role = interaction.options.getRole('rol');
        const member = await interaction.guild.members.fetch(target.id);

        // Check if the user has the Manage Roles permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.editReply('Bu komutu kullanma izniniz yok.');
        }

        if (member) {
            if (member.roles.cache.has(role.id)) {
                try {
                    await member.roles.remove(role);

                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Rol Alındı')
                        .setDescription(`${target} kullanıcısından ${role.name} rolü alındı.`)
                        .setThumbnail(target.displayAvatarURL())
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    
                    // Send log message to log channel
                    const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('Rol Alındı')
                            .setDescription(`${admin} tarafından ${target} kullanıcısından ${role.name} rolü alındı.`)
                            .setTimestamp();
                        logChannel.send({ embeds: [logEmbed] });
                    }
                } catch (error) {
                    await interaction.editReply('Rol alınırken bir hata oluştu.');
                }
            } else {
                await interaction.editReply('Kullanıcıda bu rol bulunmuyor.');
            }
        } else {
            await interaction.editReply('Kullanıcı bulunamadı.');
        }
    },
};
