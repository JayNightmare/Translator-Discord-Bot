# Discord Bot
This bot translates messages automatically for users who don't speek english. 
**------
## How does it work?
It uses LibreTranslate API self-hosting API to detect the language of the message. It bases it off of a confidence variable to determine the language. This is can be run on a server (which is what I'm using). 

## How to run the code
#### 1. **Prerequisites**
   - **Node.js and npm**: Ensure Node.js and npm are installed on your system. You can download them from [nodejs.org](https://nodejs.org/).

#### 2. **Clone the GitHub Repository**
   - Clone the repository to machine:
     ```bash
     git clone https://github.com/JayNightmare/LibreTranslate-Translator-Bot---Discord.js-Bot.git
     cd LibreTranslate-Translator-Bot---Discord.js-Bot
     ```

#### 3. **Install Dependencies**
   - Navigate to the project directory and install the required npm packages:
     ```bash
     npm install
     ```

#### 4. **Create a Discord Bot**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Create a new application and add a bot to it.
   - Go to Bot tab and enable Public Bot and Message Content Intent
     ![image](https://github.com/user-attachments/assets/c17ba914-333e-40fe-9383-24d1a3bef56c)


   - Copy the bot token in the Bot tab
   - Generate an invite link in the Installation tab. Make sure to enable Guide Install
     ![image](https://github.com/user-attachments/assets/b5a53e39-f141-4cf2-acaa-98605c213c68)


#### 5. **Configure Environment Variables**
   - Create a `.env` file in the directory:
     ```env
     BOT_TOKEN=your-discord-bot-token
     API_URL=http://your-linode-ip:5000/translate
     ```
   - Replace `your-discord-bot-token` with the token from the Discord Developer Portal.
   - Replace `http://your-linode-ip:5000/translate` with the API endpoint of your LibreTranslate instance or y.

#### 6. **Set Up and Run the LibreTranslate API**
   - If you haven't already, set up LibreTranslate on a server (e.g., Linode) and ensure it's running.
   - If self-hosting, ensure your server is properly configured to handle requests.
-----
Here’s a guide to install it on your server:

1. **Create a Linode Server**:
   - Deploy a new Linode instance with a Linux distribution like Debian 12 or Ubuntu 24.04 LTS. I'm using the $5 shared CPU server which is more than enough to run this bot.

2. **Install Dependencies**:
   - SSH into your Linode server and install the necessary dependencies, including Docker.

   ```bash
   sudo apt-get update
   sudo apt-get install docker.io
   ```

3. **Run LibreTranslate**:
   - Pull the LibreTranslate Docker image and run it.

   ```bash
   sudo docker run -d -p 5000:5000 libretranslate/libretranslate
   ```

4. **Access the API**:
   - The API will be accessible at `http://your-linode-ip:5000/translate`.

To test to see if the API is working, you can run a CURL line:
```bash
curl -X POST http://your-linode-ip:5000/translate -H "Content-Type: application/json" -d '{"q": "Hola", "source": "es", "target": "en"}'
```
-----
#### 7. **Run the Bot**
   - Start the bot using the following command:
     ```bash
     node index.js
     ```
   - The bot should log in to your server and start listening for messages.

#### 8. **Test the Bot**
   - Send messages in different languages in your Discord server to see if the bot translates them and displays the corresponding flag and language.

#### 9. **Deploy and Maintain**
   - Once you have your code running smoothly on your own machine, transfer it to your server. To run the bot, use PM2.

Heres a guide to install PM2 on your server/local machine:
#### 1. **Install PM2 Globally**
   ```bash
   sudo npm install -g pm2
   ```

#### 2. **Optional - Create a PM2 Account** 
   - To monitor the bot on the server, type the command:
     ```bash
     pm2 login
     ```
   - This will open the PM2 website where you can create an account
   - Connect to the monitor bucket if you have one, if not just type `none`
   - To link your pm2 account type the command:
     ```bash
     pm2 link <secret_key> <public_key>
     ```

#### 3. **Start the Bot with PM2**
   - Navigate to your bot's directory and start it with PM2:
     ```bash
     pm2 start index.js --name "discord-bot" --monitor
     ```
   - `--monitor` add the bot to the monitor list which can be seen on the pm2 site.
   - type `pm2 monit` to see a GUI of the Process List and the bot logs.

#### 4. **Auto-Start on Server Reboot**
   - Set up PM2 to start on server boot:
     ```bash
     pm2 startup
     pm2 save
     ```

#### 5. **Monitoring and Logs**
   - View logs:
     ```bash
     pm2 logs discord-bot-name
     ```
   - Monitor running processes:
     ```bash
     pm2 list
     ```
