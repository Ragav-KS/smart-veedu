import { Size, Stack, StackProps } from 'aws-cdk-lib';
import {
  AccessLogFormat,
  BasePathMapping,
  Deployment,
  DomainName,
  EndpointType,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
  Stage,
} from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { AppName } from '../utils/constants';

interface RestApiStackProps extends StackProps {
  smartHomeFnAliasArn: string;
  restApiDomainCertificate: string;
  restApiDomainName: string;
}

export class RestApiStack extends Stack {
  constructor(scope: Construct, id: string, props: RestApiStackProps) {
    super(scope, id, props);

    const { smartHomeFnAliasArn, restApiDomainName, restApiDomainCertificate } =
      props;

    const importedCertificate = Certificate.fromCertificateArn(
      this,
      `${AppName}ImportedDomainCertificateArn`,
      restApiDomainCertificate,
    );

    const lambdaFnAlias = Function.fromFunctionAttributes(
      this,
      'ImportedLambdaAlias',
      { functionArn: smartHomeFnAliasArn, sameEnvironment: true },
    );

    // Rest API

    const restApi = new RestApi(this, `${AppName}RestApi`, {
      deploy: false,
      minCompressionSize: Size.bytes(500),
    });

    restApi.root.addProxy({
      anyMethod: true,
      defaultIntegration: new LambdaIntegration(lambdaFnAlias, {
        proxy: true,
      }),
    });

    const prodStage = new Stage(this, `${AppName}RestApiStage`, {
      deployment: new Deployment(this, `${AppName}RestApiDeployment`, {
        api: restApi,
      }),
      tracingEnabled: true,
      dataTraceEnabled: true,
      loggingLevel: MethodLoggingLevel.INFO,
      stageName: 'prod',
      accessLogDestination: new LogGroupLogDestination(
        new LogGroup(this, `${AppName}RestApiAccessLogs`, {
          logGroupName: `${AppName}RestApiAccessLogs`,
          retention: RetentionDays.THREE_MONTHS,
        }),
      ),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields({
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        caller: true,
        user: true,
      }),
    });

    const domainName = new DomainName(this, `${AppName}RestApiDomainName`, {
      domainName: restApiDomainName,
      certificate: importedCertificate,
      endpointType: EndpointType.REGIONAL,
    });

    new BasePathMapping(this, `${AppName}BasePathMapping`, {
      domainName,
      restApi,
      stage: prodStage,
    });
  }
}
