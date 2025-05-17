#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { CognitoUserPoolStack } from '../stacks/CognitoUserPool-stack';
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
    'APP_RESTAPI_DOMAIN',
    'APP_USERPOOL_COGNITO_DOMAIN_PREFIX',
    'APP_USERPOOL_CUSTOM_DOMAIN',

    'APP_REGIONAL_DOMAIN_CERTIFICATE_ARN',
    'APP_GLOBAL_DOMAIN_CERTIFICATE_ARN',

    'APP_GOOGLE_SMARTHOME_PROJECT_ID',
  ] as const,
});

// CDK env variables
const defaultAccount = env.CDK_DEFAULT_ACCOUNT;
const defaultRegion = env.CDK_DEFAULT_REGION;

// App specific env variables
const restApiDomainName = env.APP_RESTAPI_DOMAIN;
const userPoolCognitoDomainPrefix = env.APP_USERPOOL_COGNITO_DOMAIN_PREFIX;
const userPoolCustomDomainName = env.APP_USERPOOL_CUSTOM_DOMAIN;

const appRegionalDomainCertArn = env.APP_REGIONAL_DOMAIN_CERTIFICATE_ARN;
const appGlobalDomainCertArn = env.APP_GLOBAL_DOMAIN_CERTIFICATE_ARN;

const googleSmartHomeProjectId = env.APP_GOOGLE_SMARTHOME_PROJECT_ID;

const app = new App();

const cognitoUserPoolStack = new CognitoUserPoolStack(
  app,
  `${AppName}-CognitoUserPoolStack`,
  {
    env: {
      account: defaultAccount,
      region: defaultRegion,
    },
    googleSmartHomeProjectId,
    userPoolCognitoDomainPrefix,
    userPoolCustomDomainName,
    domainCertificateArn: appGlobalDomainCertArn,
  },
);

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
  restApiDomainName,
  restApiDomainCertificate: appRegionalDomainCertArn,
  cognitoUserPool: cognitoUserPoolStack.userPool,
});
