const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');
const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const stimulus_payout = 1200000;
const raise_payout = 2500;

module.exports = {
    name: 'tiercheck',
    alias: ['tc', 'tier'],
    description: "tiercheck enemy teams from op.gg link",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        try {
            if (args.length != 1) {
                return;
            }

            const multiSearchMatch = args[0].match(/multisearch\/na\?summoners=([^#]+)/);
            const singleSearchMatch = args[0].match(/summoners\/na\/([^/]+)/);

            const players = [];

            if (multiSearchMatch) {
                players.push(...(decodeURIComponent(multiSearchMatch[1]).replace(/\+/g, ' ').split(/,\s?/)));
            } else if (singleSearchMatch) {
                players.push(decodeURIComponent(singleSearchMatch[1]).replace(/-/g, '#'));
            }

            // console.log(players);

            const options = new chrome.Options();
            options.addArguments('--headless=new');
            options.addArguments('--disable-gpu');
            options.addArguments('--no-sandbox');
            options.addArguments('--log-level=3');
            options.addArguments('--remote-debugging-port=9222');

            const driver = new Builder()
                .forBrowser(Browser.CHROME)
                .setChromeOptions(options)
                .build();

            let player_tiers = '';

            try {
                for (const player of players) {
                    await driver.get('https://metashift.gg/lookup');
                    let textBox = await driver.findElement(By.name('riot_id')); // Change selector as needed
                    await textBox.sendKeys(player, Key.RETURN); // Replace with actual input

                    // Wait until text containing "Tier #" appears anywhere in the body
                    await driver.wait(async () => {
                        let bodyText = await driver.findElement(By.tagName("body")).getText();
                        return /Tier \d+/.test(bodyText);
                    }, 30000); // Wait up to 10s

                    let tierNumber = await driver.executeScript("return document.body.innerText.match(/Tier (\\d+)/)?.[1] || '';");
                    // console.log('Extracted Tier Number:', tierNumber);
                    player_tiers += `${player} - Tier ${tierNumber}\n`;
                }
            } catch (e) {
                console.log(e);
            } finally {
                if (driver) await driver.quit();
            }

            console.log(player_tiers);

            msg.channel.send(`${player_tiers}`);
        }
        catch (err) {
            console.log(err);
            msg.channel.send('+tier <link>');
            return;
        }
    }
}