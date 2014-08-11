#
# web_base Dockerfile
# used to install external deps.
#

# Pull base image.
FROM registry.runnable.com/runnable/base:latest

WORKDIR /

# Installing Node.js
RUN wget http://nodejs.org/dist/v0.10.29/node-v0.10.29.tar.gz
RUN tar xvf node-v*.tar.gz
WORKDIR node-v0.10.29/
RUN ./configure
RUN make -j16
RUN make install

# hacks for SASS
RUN locale-gen en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# Ruby and Sass needed for grunt
RUN apt-get install ruby
RUN gem install sass