const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('msj')
        .setDescription('Bir kullanıcıya mesaj gönderir.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Mesaj göndermek istediğiniz kullanıcı.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek mesaj.')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('kullanici');
        const mesaj = interaction.options.getString('mesaj');
        
        try {
            await user.send(mesaj);
            await interaction.reply({ content: `${user.tag} kullanıcısına mesaj gönderildi.`, ephemeral: true });
        } catch (error) {
            console.error('Mesaj gönderilirken bir hata oluştu:', error);
            await interaction.reply({ content: 'Mesaj gönderilemedi.', ephemeral: true });
        }
    },
};
