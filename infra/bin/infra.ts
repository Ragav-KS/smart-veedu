#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { RestApiStack } from '../stacks/RestApiStack-stack';
import { SmartHomeLambdaStack } from '../stacks/SmartHomeLambda-stack';
import { AppName } from '../utils/constants';
import { loadAndVerifyEnv } from '../utils/loadEnv';

const env = loadAndVerifyEnv({
  envVariablesToCheck: [
    // CDK env variables
    'CDK_DEFAULT_ACCOUNT',
    'CDK_DEFAULT_REGION',
    // App specific env variables
    'APP_DOMAIN_CERTIFICATE_ARN',
    'APP_RESTAPI_DOMAIN',
  ] as const,
});

// CDK env variables
const defaultAccount = env.CDK_DEFAULT_ACCOUNT;
const defaultRegion = env.CDK_DEFAULT_REGION;

// App specific env variables
const appDomainCertArn = env.APP_DOMAIN_CERTIFICATE_ARN;
const restApiDomainName = env.APP_RESTAPI_DOMAIN;

const app = new App();

const smartHomeLambdaStack = new SmartHomeLambdaStack(
  app,
  `${AppName}-SmartHomeLambdaStack`,
  {
    env: {
      account: defaultAccount,
      region: defaultRegion,
    },
  },
);

new RestApiStack(app, `${AppName}-RestApiStack`, {
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
  smartHomeFnAliasArn: smartHomeLambdaStack.lambdaFnAlias.functionArn,
  restApiDomainCertificate: appDomainCertArn,
  restApiDomainName,
});
