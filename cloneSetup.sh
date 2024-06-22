
#!/bin/bash
#
# first make executable with 
# chmod +x cloneSetup.sh
# 
# then run with cloneSetup.sh
#
# Clone the repository
git clone https://github.com/zacharymor/talkingstick-client.git || { echo "Failed to clone repository"; exit 1; }

# Remove existing 'client' directory if it exists
rm -rf client

# Rename the cloned directory to 'client'
mv talkingstick-client client || { echo "Failed to rename directory"; exit 1; }

# Navigate into the 'client' directory
cd client || { echo "Failed to change directory to 'client'"; exit 1; }

# Install dependencies for the client
npm install || { echo "Failed to install client dependencies"; exit 1; }

# Navigate back to the parent directory
cd ..

# Install dependencies for the server (assuming server dependencies are already handled)
npm install || { echo "Failed to install server dependencies"; exit 1; }

echo "installed dependencies, running the srever..."

# Start the application
npm start || { echo "Failed to start the server"; exit 1; }

# If everything completes successfully, exit with success status
exit 0

# the server will be running and the client is now loaded 
# now open another tab in terminal then:
#
# cd client
# npm start
#
# hit y then open in localhost:3001 
