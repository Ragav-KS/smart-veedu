import { Stack, type StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  Alias,
  Code,
  Function,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppName } from '../utils/constants';

export class SmartHomeLambdaStack extends Stack {
  public readonly lambdaFnAlias: Alias;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const placeholderCode = readFileSync(
      resolve(__dirname, '../assets/placeholderLambdaCode.js'),
    ).toString('utf-8');

    const lambdaExecutionRole = new Role(
      this,
      `${AppName}SmartHomeFnExecutionRole`,
      {
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole',
          ),
        ],
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      },
    );

    const lambdaFn = new Function(this, 'SmartHomeFn', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromInline(placeholderCode),
      role: lambdaExecutionRole,
      logGroup: new LogGroup(this, `${AppName}SmartHomeRestApiAccessLogs`, {
        logGroupName: `${AppName}SmartHomeFnLogs`,
        retention: RetentionDays.THREE_MONTHS,
      }),
      tracing: Tracing.ACTIVE,
      environment: {},
    });

    this.lambdaFnAlias = new Alias(this, `${AppName}SmartHomeFnAlias`, {
      aliasName: 'prod',
      version: lambdaFn.latestVersion,
    });
  }
}
