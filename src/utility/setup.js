module.exports = {
    async setup() {
        require('dotenv').config(); 
        // configures .env
        
        require('../server/discord_client'); 
        // initialize discord client

        require('fs').promises.writeFile('service-account.json', process.env.service_account);
        // writes google service account credentials
    }
}