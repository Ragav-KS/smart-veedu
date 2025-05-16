import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  CfnManagedLoginBranding,
  ManagedLoginVersion,
  UserPool,
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

    const userPool = new UserPool(this, `${AppName}UserPool`, {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
    });

    userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: userPoolCognitoDomainPrefix,
      },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    // Make sure that the base domain has an A record in your DNS.
    userPool.addDomain('CustomDomain', {
      customDomain: {
        domainName: userPoolCustomDomainName,
        certificate: importedCertificate,
      },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    const googleHomeAppClient = userPool.addClient('GoogleHomeAppClient', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: [
          `https://oauth-redirect.googleusercontent.com/r/${googleSmartHomeProjectId}`,
        ],
      },
      generateSecret: true,
    });

    new CfnManagedLoginBranding(this, `${AppName}LoginPageBranding`, {
      userPoolId: userPool.userPoolId,
      clientId: googleHomeAppClient.userPoolClientId,
      useCognitoProvidedValues: true,
    });
  }
}
