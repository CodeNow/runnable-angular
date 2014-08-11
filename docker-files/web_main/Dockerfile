#
# web_main Dockerfile
# used to install deps and starting application
# nothing here can be cached
#

FROM registry.runnable.com/runnable/web_base:latest

# Download Runnable-web Repo
WORKDIR /

RUN git clone git@github.com:CodeNow/runnable-angular.git

WORKDIR /runnable-angular
RUN npm install
RUN npm run grunt

# Expose port to Host
EXPOSE 3000

# Define default command.
CMD ["/usr/local/bin/npm", "start"]
