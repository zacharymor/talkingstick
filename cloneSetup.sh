#!/bin/bash
#
# make this script executable
# chmod +x cloneSetup.sh
#
# execute
# ./cloneSetup.sh
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
#
# the server is running on localhost:3000
# and client is loaded, so run
# cd client
# npm start
# hit y and open in localhost:3001
#
