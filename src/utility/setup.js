module.exports = {
    async setup() {
        require('dotenv').config(); 
        // configures .env

        process.env.TZ = 'America/New_York'; // sets timezone
        
        require('../server/discord_client'); 
        // initialize discord client

        require('fs').promises.writeFile('service-account.json', process.env.service_account);
        // writes google service account credentials
    }
}