/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const fs = require('fs');
const ZB = require('zeebe-node');

let zbClientInstance;

module.exports.checkConnectivity = async function(parameters) {

  shutdownClientInstance();

  if (parameters.type === 'selfHosted') {

    let url = parameters.url;
    let port = '26500';
    if (parameters.url.includes(':')) {
      const splitted = parameters.url.split(':');
      url = splitted[0];
      port = splitted[1];
    }

    return new Promise(function(resolve, error) {
      zbClientInstance = new ZB.ZBClient(url, {
        retry: false,
        port: port
      });

      zbClientInstance.topology().then(async function(response) {
        resolve({
          isSuccessful: true
        });
      }).catch(async function(err) {
        resolve({
          isSuccessful: false,
          reason: err.details
        });
      });
    });
  } else if (parameters.type === 'oauth') {

    let url = parameters.url;
    let port = '443';
    if (parameters.url.includes(':')) {
      const splitted = parameters.url.split(':');
      url = splitted[0];
      port = splitted[1];
    }

    return new Promise(function(resolve, error) {
      zbClientInstance = new ZB.ZBClient(url, {
        retry: false,
        oAuth: {
          url: parameters.oauthURL,
          audience: parameters.audience,
          clientId: parameters.clientId,
          clientSecret: parameters.clientSecret,
          cacheOnDisk: false
        },
        useTLS: true,
        port: port
      });

      zbClientInstance.topology().then(async function(response) {
        resolve({
          isSuccessful: true
        });
      }).catch(async function(err) {
        resolve({
          isSuccessful: false,
          reason: err.details
        });
      });
    });
  } else if (parameters.type === 'camundaCloud') {
    return new Promise(function(resolve, error) {
      zbClientInstance = new ZB.ZBClient({
        retry: false,
        camundaCloud: {
          clientId: parameters.clientId,
          clientSecret: parameters.clientSecret,
          clusterId: parameters.clusterId,
          cacheOnDisk: false
        },
        useTLS: true
      });

      zbClientInstance.topology().then(async function(response) {
        resolve({
          isSuccessful: true
        });
      }).catch(async function(err) {
        resolve({
          isSuccessful: false,
          reason: err.details
        });
      });
    });
  }
};

module.exports.deploy = function(parameters) {

  return new Promise(function(resolve, error) {

    const buffer = fs.readFileSync(parameters.filePath);

    zbClientInstance.deployWorkflow({ definition: buffer, name: parameters.name }).then(function(resp) {
      resolve({
        success: true,
        response: resp
      });
    }).catch(function(err) {
      resolve({
        success: false,
        response: err
      });
    });
  });
};

module.exports.run = function(parameters) {
  return new Promise(function(resolve, reject) {

    zbClientInstance.createWorkflowInstance({
      bpmnProcessId: parameters.processId
    }).then(function(resp) {
      resolve(resp);
    }).catch(function(err) {
      resolve(false);
    });
  });
};

async function shutdownClientInstance() {
  if (zbClientInstance) {
    await zbClientInstance.close();
  }
}
