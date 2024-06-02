FROM node:18

# Set the working directory in the container
WORKDIR /app

# Install tzdata package
RUN apt-get update && apt-get install -y tzdata

# Set the timezone (replace 'Europe/Berlin' with your timezone)
ENV TZ=Europe/Berlin

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in package.json
RUN npm install

RUN npx prisma generate

# If you are building your code for production
# RUN npm ci --only=production

# Build the Next.js app
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["npm", "start"]
