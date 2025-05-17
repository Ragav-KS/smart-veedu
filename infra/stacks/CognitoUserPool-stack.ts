import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  CfnManagedLoginBranding,
  ManagedLoginVersion,
  OAuthScope,
  UserPool,
  UserPoolResourceServer,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { AppName } from '../utils/constants';

interface CognitoUserPoolStackProps extends StackProps {
  userPoolCognitoDomainPrefix: string;
  userPoolCustomDomainName: string;
  domainCertificateArn: string;
  googleSmartHomeProjectId: string;
}

export class CognitoUserPoolStack extends Stack {
  userPool: UserPool;

  constructor(scope: Construct, id: string, props: CognitoUserPoolStackProps) {
    super(scope, id, props);

    const {
      userPoolCognitoDomainPrefix,
      userPoolCustomDomainName,
      domainCertificateArn,
      googleSmartHomeProjectId,
    } = props;

    const importedCertificate = Certificate.fromCertificateArn(
      this,
      `${AppName}ImportedDomainCertificateArn`,
      domainCertificateArn,
    );

    this.userPool = new UserPool(this, `${AppName}UserPool`, {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      signInPolicy: {
        allowedFirstAuthFactors: {
          password: true,
          passkey: true,
        },
      },
      passkeyRelyingPartyId: userPoolCustomDomainName,
    });

    this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: userPoolCognitoDomainPrefix,
      },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    // Make sure that the base domain has an A record in your DNS.
    this.userPool.addDomain('CustomDomain', {
      customDomain: {
        domainName: userPoolCustomDomainName,
        certificate: importedCertificate,
      },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    const restApiResourceServer = new UserPoolResourceServer(
      this,
      `${AppName}UserPoolResourceServer`,
      {
        identifier: 'VeeduRestApi',
        userPool: this.userPool,
        scopes: [
          {
            scopeName: 'SmartHome',
            scopeDescription: 'Smart Home Integration',
          },
        ],
      },
    );

    const googleHomeAppClient = this.userPool.addClient('GoogleHomeAppClient', {
      authFlows: {
        user: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          OAuthScope.resourceServer(restApiResourceServer, {
            scopeName: 'SmartHome',
            scopeDescription: 'Smart Home Integration',
          }),
        ],
        callbackUrls: [
          `https://oauth-redirect.googleusercontent.com/r/${googleSmartHomeProjectId}`,
        ],
      },
      generateSecret: true,
    });

    new CfnManagedLoginBranding(this, `${AppName}LoginPageBranding`, {
      userPoolId: this.userPool.userPoolId,
      clientId: googleHomeAppClient.userPoolClientId,
      useCognitoProvidedValues: true,
    });
  }
}
