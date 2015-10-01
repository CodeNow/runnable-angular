'use strict';

var nodeSourceDockerfile = {
  attrs: require('../apiMocks/files/nodeDockerfile.json')
};
var railsSourceDockerfile = {
  attrs: require('../apiMocks/files/railsDockerfile.json')
};

describe('populateDockerfileService'.bold.underline.blue, function () {
  var populateDockerfile;
  var state;
  var destDockerfile;
  beforeEach(function () {

    destDockerfile = {
      state: {
        body: ''
      }
    };
    state = {
      ports: ['80', '8000'],
      packages: 'package 1',
      containerFiles: [
        {
          type: 'Main Repository',
          toString: sinon.stub().returns('Main Repo'),
          path: 'foo'
        }
      ],
      selectedStack: {
        key: 'nodejs',
        selectedVersion: '0.10.35'
      },
      startCommand: 'npm start'
    };

    angular.mock.module('app');
    angular.mock.inject(function (_populateDockerfile_) {
      populateDockerfile = _populateDockerfile_;
    });
  });

  it('should populate a standard dockerfile', function () {
    populateDockerfile(nodeSourceDockerfile, state, destDockerfile);

    sinon.assert.calledOnce(state.containerFiles[0].toString);

    expect(destDockerfile.state.body).to.contain('FROM node:0.10.35');
    expect(destDockerfile.state.body).to.contain('EXPOSE 80 8000');
    expect(destDockerfile.state.body).to.contain('package 1');
    expect(destDockerfile.state.body).to.contain('Main Repo');
    expect(destDockerfile.state.body).to.contain('WORKDIR /foo');
    expect(destDockerfile.state.body).to.contain('CMD npm start');
  });

  it('should handle having no ports', function () {
    state.ports = [];
    populateDockerfile(nodeSourceDockerfile, state, destDockerfile);
    expect(destDockerfile.state.body).to.not.contain('EXPOSE');
    expect(destDockerfile.state.body).to.not.contain('user-specified-ports');
  });

  it('should handle ruby on rails', function () {
    state.selectedStack.key = 'rails';
    state.selectedStack.selectedVersion = '4.2.0';
    state.selectedStack.dependencies = [
      {
        key: 'ruby',
        selectedVersion: '1.7'
      }
    ];
    populateDockerfile(railsSourceDockerfile, state, destDockerfile);
    expect(destDockerfile.state.body).to.contain('ENV RAILS_VERSION 4.2.0');
  });

  it('should return an error if there is are no `ports` in the state', function () {
    delete state.ports;
    populateDockerfile(railsSourceDockerfile, state, destDockerfile)
      .then(function () {
        throw 'Error case not hit.';
      })
      .catch(function (err) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('populateDockerfile requires an array of port');
      });
  });
});
